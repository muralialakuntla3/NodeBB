'use strict';


define('forum/account/header', [
	'coverPhoto',
	'pictureCropper',
	'components',
	'translator',
	'accounts/delete',
	'accounts/moderate',
	'accounts/picture',
	'api',
	'bootbox',
	'alerts',
], function (coverPhoto, pictureCropper, components, translator,
	AccountsDelete, AccountsModerate, AccountsPicture, api, bootbox, alerts) {
	const AccountHeader = {};
	let isAdminOrSelfOrGlobalMod;

	AccountHeader.init = function () {
		isAdminOrSelfOrGlobalMod = ajaxify.data.isAdmin || ajaxify.data.isSelf || ajaxify.data.isGlobalModerator;

		selectActivePill();

		handleImageChange();

		if (isAdminOrSelfOrGlobalMod) {
			setupCoverPhoto();
		}

		components.get('account/follow').on('click', () => toggleFollow('follow'));
		components.get('account/unfollow').on('click', () => toggleFollow('unfollow'));

		components.get('account/chat').on('click', async function () {
			const roomId = await socket.emit('modules.chats.hasPrivateChat', ajaxify.data.uid);
			const chat = await app.require('chat');
			if (roomId) {
				chat.openChat(roomId);
			} else {
				chat.newChat(ajaxify.data.uid);
			}
		});

		components.get('account/new-chat').on('click', async function () {
			const chat = await app.require('chat');
			chat.newChat(ajaxify.data.uid, function () {
				components.get('account/chat').parent().removeClass('hidden');
			});
		});

		components.get('account/ban').on('click', () => AccountsModerate.banAccount(ajaxify.data.theirid));
		components.get('account/mute').on('click', () => AccountsModerate.muteAccount(ajaxify.data.theirid));
		components.get('account/unban').on('click', () => AccountsModerate.unbanAccount(ajaxify.data.theirid));
		components.get('account/unmute').on('click', () => AccountsModerate.unmuteAccount(ajaxify.data.theirid));
		components.get('account/delete-account').on('click', () => AccountsDelete.account(ajaxify.data.theirid));
		components.get('account/delete-content').on('click', () => AccountsDelete.content(ajaxify.data.theirid));
		components.get('account/delete-all').on('click', () => AccountsDelete.purge(ajaxify.data.theirid));
		components.get('account/flag').on('click', flagAccount);
		components.get('account/block').on('click', toggleBlockAccount);
		components.get('account/unblock').on('click', toggleBlockAccount);
	};

	function selectActivePill() {
		$('.account-sub-links li a').removeClass('active').each(function () {
			const href = $(this).attr('href');

			if (decodeURIComponent(href) === decodeURIComponent(window.location.pathname)) {
				$(this).addClass('active');
				return false;
			}
		});
	}

	function handleImageChange() {
		$('[component="profile/change/picture"]').on('click', function () {
			AccountsPicture.openChangeModal();
			return false;
		});
	}

	function setupCoverPhoto() {
		coverPhoto.init(
			components.get('account/cover'),
			function (imageData, position, callback) {
				socket.emit('user.updateCover', {
					uid: ajaxify.data.uid,
					imageData: imageData,
					position: position,
				}, callback);
			},
			function () {
				pictureCropper.show({
					title: '[[user:upload_cover_picture]]',
					socketMethod: 'user.updateCover',
					aspectRatio: NaN,
					allowSkippingCrop: true,
					restrictImageDimension: false,
					paramName: 'uid',
					paramValue: ajaxify.data.theirid,
					accept: '.png,.jpg,.bmp',
				}, function (imageUrlOnServer) {
					imageUrlOnServer = (!imageUrlOnServer.startsWith('http') ? config.relative_path : '') + imageUrlOnServer + '?' + Date.now();
					components.get('account/cover').css('background-image', 'url(' + imageUrlOnServer + ')');
				});
			},
			removeCover
		);
	}

	function toggleFollow(type) {
		api[type === 'follow' ? 'put' : 'del']('/users/' + ajaxify.data.uid + '/follow', undefined, function (err) {
			if (err) {
				return alerts.error(err);
			}
			components.get('account/follow').toggleClass('hide', type === 'follow');
			components.get('account/unfollow').toggleClass('hide', type === 'unfollow');
			alerts.success('[[global:alert.' + type + ', ' + ajaxify.data.username + ']]');
		});

		return false;
	}

	function flagAccount() {
		require(['flags'], function (flags) {
			flags.showFlagModal({
				type: 'user',
				id: ajaxify.data.uid,
			});
		});
	}

	function toggleBlockAccount() {
		socket.emit('user.toggleBlock', {
			blockeeUid: ajaxify.data.uid,
			blockerUid: app.user.uid,
		}, function (err, blocked) {
			if (err) {
				return alerts.error(err);
			}
			components.get('account/block').toggleClass('hidden', blocked);
			components.get('account/unblock').toggleClass('hidden', !blocked);
		});

		// Keep dropdown open
		return false;
	}

	function removeCover() {
		translator.translate('[[user:remove_cover_picture_confirm]]', function (translated) {
			bootbox.confirm(translated, function (confirm) {
				if (!confirm) {
					return;
				}

				socket.emit('user.removeCover', {
					uid: ajaxify.data.uid,
				}, function (err) {
					if (!err) {
						ajaxify.refresh();
					} else {
						alerts.error(err);
					}
				});
			});
		});
	}

	return AccountHeader;
});
