'use strict';


define('forum/post-queue', [
	'categoryFilter', 'categorySelector', 'api', 'alerts', 'bootbox',
	'accounts/moderate', 'accounts/delete',
], function (
	categoryFilter, categorySelector, api, alerts, bootbox,
	AccountModerate, AccountsDelete
) {
	const PostQueue = {};

	PostQueue.init = function () {
		$('[data-bs-toggle="tooltip"]').tooltip();

		categoryFilter.init($('[component="category/dropdown"]'), {
			privilege: 'moderate',
		});

		handleActions();
		handleBulkActions();
		handleContentEdit('[data-action="editContent"]', '.post-content-editable', 'textarea', '.post-content');
		handleContentEdit('[data-action="editTitle"]', '.topic-title-editable', 'input', '.topic-title');

		$('.posts-list').on('click', '.topic-category[data-editable]', function (e) {
			handleCategoryChange(this);
			e.stopPropagation();
			e.preventDefault();
		});

		$('[component="post/content"] img:not(.not-responsive)').addClass('img-fluid');
	};

	function confirmReject(msg) {
		return new Promise((resolve) => {
			bootbox.confirm(msg, resolve);
		});
	}

	function handleContentEdit(triggerClass, editableClass, inputSelector, displayClass) {
		$('.posts-list').on('click', triggerClass, function () {
			const el = $(this);
			const inputEl = el.parents('[data-id]').find(editableClass);
			const displayEl = el.parents('[data-id]').find(displayClass);
			if (inputEl.length) {
				displayEl.addClass('hidden');
				inputEl.removeClass('hidden').find(inputSelector).focus();
			}
		});

		$('.posts-list').on('blur', editableClass + ' ' + inputSelector, function () {
			const textarea = $(this);
			const preview = textarea.parent().parent().find(displayClass);
			const id = textarea.parents('[data-id]').attr('data-id');
			const titleEdit = triggerClass === '[data-action="editTitle"]';

			socket.emit('posts.editQueuedContent', {
				id: id,
				title: titleEdit ? textarea.val() : undefined,
				content: titleEdit ? undefined : textarea.val(),
			}, function (err, data) {
				if (err) {
					return alerts.error(err);
				}
				if (titleEdit) {
					preview.find('.title-text').text(data.postData.title);
				} else {
					preview.html(data.postData.content);
				}

				textarea.parent().addClass('hidden');
				preview.removeClass('hidden');
			});
		});
	}

	function handleCategoryChange(categoryEl) {
		const $this = $(categoryEl);
		const id = $this.parents('[data-id]').attr('data-id');
		categorySelector.modal({
			onSubmit: function (selectedCategory) {
				Promise.all([
					api.get(`/categories/${selectedCategory.cid}`, {}),
					socket.emit('posts.editQueuedContent', {
						id: id,
						cid: selectedCategory.cid,
					}),
				]).then(function (result) {
					const category = result[0];
					app.parseAndTranslate('post-queue', 'posts', {
						posts: [{
							category: category,
						}],
					}, function (html) {
						if ($this.find('.category-text').length) {
							$this.find('.category-text').text(html.find('.topic-category .category-text').text());
						} else {
							// for backwards compatibility, remove in 1.16.0
							$this.replaceWith(html.find('.topic-category'));
						}
					});
				}).catch(alerts.error);
			},
		});
		return false;
	}

	function handleActions() {
		const listEl = document.querySelector('.posts-list');
		if (listEl) {
			listEl.addEventListener('click', (e) => {
				const subselector = e.target.closest('[data-action]');
				if (subselector) {
					const action = subselector.getAttribute('data-action');
					const uid = subselector.closest('[data-uid]').getAttribute('data-uid');
					switch (action) {
						case 'editCategory': {
							const categoryEl = e.target.closest('[data-id]').querySelector('.topic-category');
							handleCategoryChange(categoryEl);
							break;
						}

						case 'ban':
							AccountModerate.banAccount(uid, ajaxify.refresh);
							break;

						case 'unban':
							AccountModerate.unbanAccount(uid);
							break;

						case 'mute':
							AccountModerate.muteAccount(uid, ajaxify.refresh);
							break;

						case 'unmute':
							AccountModerate.unmuteAccount(uid);
							break;

						case 'delete-account':
							AccountsDelete.account(uid, ajaxify.go.bind(null, 'post-queue'));
							break;

						case 'delete-content':
							AccountsDelete.content(uid, ajaxify.go.bind(null, 'post-queue'));
							break;

						case 'delete-all':
							AccountsDelete.purge(uid, ajaxify.go.bind(null, 'post-queue'));
							break;

						default:
							handleQueueActions.call(e.target);
							break;
					}
				}
			});
		}
	}

	async function handleQueueActions() {
		// accept, reject, notify
		function getMessage() {
			return new Promise((resolve) => {
				const modal = bootbox.dialog({
					title: '[[post-queue:notify-user]]',
					message: '<textarea class="form-control"></textarea>',
					buttons: {
						OK: {
							label: '[[modules:bootbox.send]]',
							callback: function () {
								const val = modal.find('textarea').val();
								if (val) {
									resolve(val);
								}
							},
						},
					},
				});
			});
		}

		const parent = $(this).parents('[data-id]');
		const action = $(this).attr('data-action');
		const id = parent.attr('data-id');
		const listContainer = parent.get(0).parentNode;

		if ((!['accept', 'reject', 'notify'].includes(action)) ||
			(action === 'reject' && !await confirmReject(ajaxify.data.canAccept ? '[[post-queue:confirm-reject]]' : '[[post-queue:confirm-remove]]'))) {
			return;
		}

		socket.emit('posts.' + action, {
			id: id,
			message: action === 'notify' ? await getMessage() : undefined,
		}, function (err) {
			if (err) {
				return alerts.error(err);
			}
			if (action === 'accept' || action === 'reject') {
				parent.remove();
			}

			if (listContainer.childElementCount === 0) {
				if (ajaxify.data.singlePost) {
					ajaxify.go('/post-queue' + window.location.search);
				} else {
					ajaxify.refresh();
				}
			}
		});
		return false;
	}

	function handleBulkActions() {
		$('[component="post-queue/bulk-actions"]').on('click', '[data-action]', async function () {
			const bulkAction = $(this).attr('data-action');
			let queueEls = $('.posts-list [data-id]');
			if (bulkAction === 'accept-selected' || bulkAction === 'reject-selected') {
				queueEls = queueEls.filter(
					(i, el) => $(el).find('input[type="checkbox"]').is(':checked')
				);
			}
			const ids = queueEls.map((i, el) => $(el).attr('data-id')).get();
			const showConfirm = bulkAction === 'reject-all' || bulkAction === 'reject-selected';
			const translationString = ajaxify.data.canAccept ?
				`${bulkAction}-confirm` :
				`${bulkAction.replace(/^reject/, 'remove')}-confirm`;
			if (!ids.length || (showConfirm && !(await confirmReject(`[[post-queue:${translationString}, ${ids.length}]]`)))) {
				return;
			}
			const action = bulkAction.split('-')[0];
			const promises = ids.map(id => socket.emit('posts.' + action, { id: id }));

			Promise.allSettled(promises).then(function (results) {
				const fulfilled = results.filter(res => res.status === 'fulfilled').length;
				const errors = results.filter(res => res.status === 'rejected');
				if (fulfilled) {
					alerts.success(`[[post-queue:bulk-${action}-success, ${fulfilled}]]`);
					ajaxify.refresh();
				}

				errors.forEach(res => alerts.error(res.reason));
			});
		});
	}

	return PostQueue;
});
