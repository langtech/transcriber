(function() {

/**
 * @module ldc
 * @submodule aikuma
 * @namespace aikuma
 */
goog.provide('ldc.aikuma.AikumaFolder');

/**
 * Aikuma data directory reader. Only works with Chrome browser.
 *
 * @class AikumaFolder
 * @constructor
 */
ldc.aikuma.AikumaFolder = function() {
	/**
	 * Collection of objects related to users.
	 * @property users
	 */
	this.users = {};

	/**
	 * Collection of objects related to recordings. Hash of hash with
	 * structure: uuid -> <type> -> file_object, where <type> can be
	 *
	 *   - json
	 *   - map
	 *   - wav
	 *   - ...
	 *
	 * @property recordings
	 */
	this.recordings = {};

	/**
	 * Collection of objects representing a group of recodgins. Keyed
	 * by uuid of original recording.
	 *
	 * Each item has two properties:
	 *   original -- uuid of the original recording
	 *   respeakings -- array of uuids of respeakings
	 *
	 * @property recording_groups
	 */
	this.recording_groups = {};
}

/**
 * Load a FileList object.
 *
 * @method localFolder
 * @param {FileList} filelist
 * @param {Function} progress A callback function that is called when progress
 *   is made. The argument of the function is a percentage.
 */
ldc.aikuma.AikumaFolder.prototype.loadFolder = function(filelist, progress) {
	total_count = filelist.length;
	count = 0;

	this.users = {};
	this.recordings = {};
	this.recording_groups = {};

	var that = this;
	var updater = function(db_type, uuid, type, obj) {
		var db = {};
		if (db_type == 'user') {
			db = that.users;
		}
		else if (db_type == 'recording') {
			db = that.recordings;
		}
		var record = db[uuid] || {};
		record[type] = obj;
		db[uuid] = record;
		progress(++count / total_count * 100);
	};

	for (var i=0, file; file = filelist[i]; ++i) {
		var r = get_file_type(file);
		if (r != null) {
			if (r[2] == 'json') {
				var reader = new FileReader;
				reader.onload = (function(db, uuid, type) {
					return function() {
						updater(db, uuid, type, JSON.parse(this.result));
					};
				}).apply(null, r);
				reader.readAsText(file);
			}
			else {
				updater.apply(null, r.concat(file));
			}
		}
		else {
			progress(++count / total_count * 100);
		}
	}
}

/**
 * Build an index of recording groups. Each recording group consists of
 * an original recording and an array of respeakings.
 */
ldc.aikuma.AikumaFolder.prototype.buildRecordingGroups = function() {
	for (var uuid in this.recordings) {
		var item = this.recordings[uuid];
		if (item['json'] == null) {
			continue;
		}
		if (item['json']['original_uuid']) {
			if (this.recording_groups[item['json']['original_uuid']] == null) {
				this.recording_groups[item['json']['original_uuid']] = {
					original: item['json']['original_uuid'],
					respeakings: [uuid]
				};
			}
			else {
				this.recording_groups[item['json']['original_uuid']].respeakings.push(uuid);
			}
		}
		else if (this.recording_groups[uuid] == null) {
			this.recording_groups[uuid] = {
				original: uuid,
				respeakings: []
			};
		}
	}
}

// For a file, figure out
//   1) whether it's about user or recording,
//   2) uuid, and
//   3) file type.
function get_file_type(file) {
	var path = file.webkitRelativePath.split('/');
	var m = /(.*?)\.(.*)/.exec(file.name);
	if (m == null) {
		return null;
	}
	if (m[2] == 'json') {
		if (m[1] == 'metadata') {
			if (path[1] == 'users') {
				return ['user', path[2], 'json'];
			}
		}
		else {
			return ['recording', m[1], 'json'];
		}
	}
	else if (m[2] == 'wav' || m[2] == 'shape' || m[2] == 'map') {
		return ['recording', m[1], m[2]];
	}
	else if (m[2] == 'small.jpg') {
		return ['user', m[1], m[2]];
	}
}

})();