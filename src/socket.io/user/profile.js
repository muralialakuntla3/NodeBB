'use strict';

const user = require('../../user');
const privileges = require('../../privileges');
const plugins = require('../../plugins');

module.exports = function (SocketUser) {
	SocketUser.updateCover = async function (socket, data) {
		if (!socket.uid) {
			throw new Error('[[error:no-privileges]]');
		}
		await user.isAdminOrGlobalModOrSelf(socket.uid, data.uid);
		await user.checkMinReputation(socket.uid, data.uid, 'min:rep:cover-picture');
		return await user.updateCoverPicture(data);
	};

	SocketUser.uploadCroppedPicture = async function (socket, data) {
		if (!socket.uid || !(await privileges.users.canEdit(socket.uid, data.uid))) {
			throw new Error('[[error:no-privileges]]');
		}

		await user.checkMinReputation(socket.uid, data.uid, 'min:rep:profile-picture');
		data.callerUid = socket.uid;
		return await user.uploadCroppedPicture(data);
	};

	SocketUser.removeCover = async function (socket, data) {
		if (!socket.uid) {
			throw new Error('[[error:no-privileges]]');
		}
		await user.isAdminOrGlobalModOrSelf(socket.uid, data.uid);
		const userData = await user.getUserFields(data.uid, ['cover:url']);
		// 'keepAllUserImages' is ignored, since there is explicit user intent
		await user.removeCoverPicture(data);
		plugins.hooks.fire('action:user.removeCoverPicture', {
			callerUid: socket.uid,
			uid: data.uid,
			user: userData,
		});
	};

	SocketUser.toggleBlock = async function (socket, data) {
		const isBlocked = await user.blocks.is(data.blockeeUid, data.blockerUid);
		await user.blocks.can(socket.uid, data.blockerUid, data.blockeeUid, isBlocked ? 'unblock' : 'block');
		await user.blocks[isBlocked ? 'remove' : 'add'](data.blockeeUid, data.blockerUid);
		return !isBlocked;
	};
};
