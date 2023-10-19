'use strict';

define('quickreply', [
	'components', 'composer', 'composer/autocomplete', 'api',
	'alerts', 'uploadHelpers', 'mousetrap', 'storage',
], function (
	components, composer, autocomplete, api,
	alerts, uploadHelpers, mousetrap, storage
) {
	const QuickReply = {};

	QuickReply.init = function () {
		const element = components.get('topic/quickreply/text');
		const qrDraftId = `qr:draft:tid:${ajaxify.data.tid}`;
		const data = {
			element: element,
			strategies: [],
			options: {
				style: {
					'z-index': 100,
				},
			},
		};

		destroyAutoComplete();
		$(window).one('action:ajaxify.start', () => {
			destroyAutoComplete();
		});
		$(window).trigger('composer:autocomplete:init', data);
		autocomplete._active.core_qr = autocomplete.setup(data);

		mousetrap.bind('ctrl+return', (e) => {
			if (e.target === element.get(0)) {
				components.get('topic/quickreply/button').get(0).click();
			}
		});

		uploadHelpers.init({
			dragDropAreaEl: $('[component="topic/quickreply/container"] .quickreply-message'),
			pasteEl: element,
			uploadFormEl: $('[component="topic/quickreply/upload"]'),
			inputEl: element,
			route: '/api/post/upload',
			callback: function (uploads) {
				let text = element.val();
				uploads.forEach((upload) => {
					text = text + (text ? '\n' : '') + (upload.isImage ? '!' : '') + `[${upload.filename}](${upload.url})`;
				});
				element.val(text);
			},
		});

		let ready = true;
		components.get('topic/quickreply/button').on('click', function (e) {
			e.preventDefault();
			if (!ready) {
				return;
			}

			const replyMsg = components.get('topic/quickreply/text').val();
			const replyData = {
				tid: ajaxify.data.tid,
				handle: undefined,
				content: replyMsg,
			};
			const replyLen = replyMsg.length;
			if (replyLen < parseInt(config.minimumPostLength, 10)) {
				return alerts.error('[[error:content-too-short, ' + config.minimumPostLength + ']]');
			} else if (replyLen > parseInt(config.maximumPostLength, 10)) {
				return alerts.error('[[error:content-too-long, ' + config.maximumPostLength + ']]');
			}

			ready = false;
			api.post(`/topics/${ajaxify.data.tid}`, replyData, function (err, data) {
				ready = true;
				if (err) {
					return alerts.error(err);
				}
				if (data && data.queued) {
					alerts.alert({
						type: 'success',
						title: '[[global:alert.success]]',
						message: data.message,
						timeout: 10000,
						clickfn: function () {
							ajaxify.go(`/post-queue/${data.id}`);
						},
					});
				}

				components.get('topic/quickreply/text').val('');
				storage.removeItem(qrDraftId);
				autocomplete._active.core_qr.hide();
			});
		});

		const draft = storage.getItem(qrDraftId);
		if (draft) {
			element.val(draft);
		}

		element.on('keyup', utils.debounce(function () {
			const text = element.val();
			if (text) {
				storage.setItem(qrDraftId, text);
			} else {
				storage.removeItem(qrDraftId);
			}
		}, 1000));

		components.get('topic/quickreply/expand').on('click', (e) => {
			e.preventDefault();
			storage.removeItem(qrDraftId);
			const textEl = components.get('topic/quickreply/text');
			composer.newReply({
				tid: ajaxify.data.tid,
				title: ajaxify.data.title,
				body: textEl.val(),
			});
			textEl.val('');
		});
	};

	function destroyAutoComplete() {
		if (autocomplete._active.core_qr) {
			autocomplete._active.core_qr.destroy();
			autocomplete._active.core_qr = null;
		}
	}

	return QuickReply;
});
