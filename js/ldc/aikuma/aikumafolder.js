(function() {

/**
@module ldc
@submodule aikuma
@namespace aikuma
*/
goog.provide('ldc.aikuma.AikumaFolder');

/**
Aikuma data directory reader. Only works with Chrome browser.

@class AikumaFolder
@constructor
*/
ldc.aikuma.AikumaFolder = function() {
	this.originals = {};
	this.commentaries = {};
	this.org2comm = {};  // list of commentary uuids by original uuid
	this.speakers = {};
	this.urls = {};  // keys are a file extension, values are File object
}

/**
Load a FileList object.

@method loadFolder
@param {FileList} filelist
@param {Function} progress A callback function that is called when progress
	is made. The argument of the function is a percentage.
*/
ldc.aikuma.AikumaFolder.prototype.loadFolder = function(filelist, progress) {
	var total_count = filelist.length;
	var count = 0;

	var re = /.*\/(recordings|images)\/(.*?)\.(.*)$/;
	var re2 = /.*\/(users)\/(.*?)\/metadata\.json$/;
	var that = this;

	this.originals = {};
	this.commentaries = {};
	this.speakers = {};
	this.urls = {};
	this.org2comm = {};

	for (var i=0, file; file = filelist[i]; ++i) {

		var p = file.webkitRelativePath;
		var m = re.exec(p);

		if (m == null)
			m = re2.exec(p);
		if (m == null) {
			progress(++count / total_count * 100);
			continue;
		}

		var rootdir = m[1];
		var uuid = m[2];
		var file_ext = m[3];

		if (rootdir == 'users' && file_ext == 'json') {
			read_text_file(file, (function(uuid) {
				return function(text) {
					that.speakers[uuid] = JSON.parse(text);
					progress(++count / total_count * 100);
				};
			})(uuid));
		}
		else if (rootdir == 'recordings' && file_ext == 'json') {
			read_text_file(file, (function(uuid) {
				return function(text) {
					var obj = JSON.parse(text);
					obj['name'] = obj['recording_name']; // for backward compatibility
					var orguuid = obj.originalUUID;
					if (orguuid == null)
						orguuid = obj.original_uuid; // for backward compatibility
					if (orguuid == null)
						that.originals[uuid] = obj;
					else {
						that.commentaries[uuid] = obj;
						if (!that.org2comm.hasOwnProperty(orguuid))
							that.org2comm[orguuid] = {};
						that.org2comm[orguuid][uuid] = true;
					}
					progress(++count / total_count * 100);
				};
			})(uuid));
		}
		else {
			if (typeof this.urls[uuid] == 'undefined')
		   		this.urls[uuid] = {};
			this.urls[uuid][file_ext] = URL.createObjectURL(file);
			progress(++count / total_count * 100);
		}
	}
}

/**
Load an index obtained from the Aikuma web server, e.g. the http server
embedded in the Aikuma app.

@method loadWebIndex
@param {object} index
*/
ldc.aikuma.AikumaFolder.prototype.loadWebIndex = function(index) {
	this.originals = index.originals;
	this.commentaries = index.commentaries;
	this.speakers = index.speakers;
	this.urls = {};
	this.org2comm = {};

	for (var uuid in index.commentaries) {
		var obj = index.commentaries[uuid];
		if (this.org2comm.hasOwnProperty(obj.originalUUID))
			this.org2comm[obj.originalUUID] = {};
		this.org2comm[obj.originalUUID][obj.uuid] = 1;
		this.urls[uuid] = {
			wav: '/recording/' + uuid,
			map: '/recording/' + uuid + '/mapfile',
			shape: '/recording/' + uuid + '/shapefile'
		};
	}

	for (var uuid in index.originals) {
		this.urls[uuid] = {
			wav: '/recording/' + uuid,
			map: '/recording/' + uuid + '/mapfile',
			shape: '/recording/' + uuid + '/shapefile'
		};
	}

	for (var uuid in index.speakers) {
		this.urls[uuid] = {
			jpg: '/speaker/' + uuid + '/image',
			'small.jpg': '/speaker/' + uuid + '/smallimage'
		};
	}
}

/**
Load an index obtained from a static Aikuma web server serviing static files.

@method loadStaticWebIndex
@param {object} index
@param {string} [baseurl="aikuma"] Base URL for the Aikuma directory structure.
    By default, it's the "aikuma" folder next to the main HTML page.
*/
ldc.aikuma.AikumaFolder.prototype.loadStaticWebIndex = function(index, baseurl) {
	baseurl = baseurl == null ? 'aikuma' : baseurl;

	this.originals = index.originals;
	this.commentaries = index.commentaries;
	this.speakers = index.speakers;
	this.urls = {};
	this.org2comm = {};

	// obj is a recording json
	function ensure_backward_compatibility(obj) {
		obj['name'] = obj['recording_name'];
		if (!obj.hasOwnProperty('originalUUID'))
			obj['originalUUID'] = obj['original_uuid'];
	}

	for (var uuid in index.commentaries) {
		var obj = index.commentaries[uuid];
		ensure_backward_compatibility(obj);
		var orguuid = obj.originalUUID;
		if (!this.org2comm.hasOwnProperty(orguuid))
			this.org2comm[orguuid] = {};
		this.org2comm[orguuid][obj.uuid] = 1;
		this.urls[uuid] = {
			wav: baseurl + '/recordings/' + uuid + '.wav',
			map: baseurl + '/recordings/' + uuid + '.map',
			shape: baseurl + '/recordings/' + uuid + '.shape'
		};
	}

	for (var uuid in index.originals) {
		ensure_backward_compatibility(index.originals[uuid]);
		this.urls[uuid] = {
			wav: baseurl + '/recordings/' + uuid + '.wav',
			map: baseurl + '/recordings/' + uuid + '.map',
			shape: baseurl + '/recordings/' + uuid + '.shape'
		};
	}

	for (var uuid in index.speakers) {
		this.urls[uuid] = {
			jpg: baseurl + '/images/' + uuid + '.jpg',
			'small.jpg': baseurl + '/images/' + uuid + '.small.jpg'
		};
	}
}

/**
Get the full list of original recordings.

@method getOriginals
@return {object} A set of recording metadata json objects. Keys are a UUID.
*/
ldc.aikuma.AikumaFolder.prototype.getOriginals = function() {
	return this.originals;
}


/**
Get the URL of the given recording UUID.

@method getRecordingUrl
@param {string} uuid Recording UUID.
@return {string} URL for the recording file.
*/
ldc.aikuma.AikumaFolder.prototype.getRecordingUrl = function(uuid) {
	if (this.urls.hasOwnProperty(uuid))
		return this.urls[uuid].wav;
}

/**
Get recording metadata.

@method getRecordingInfo
@param {string} uuid Recording UUID
@return {object} A JSON object containing information about the recording.
*/
ldc.aikuma.AikumaFolder.prototype.getRecordingInfo = function(uuid) {
	var result = null;
	if (this.originals.hasOwnProperty(uuid))
		result = this.originals[uuid];
	else if (this.commentaries.hasOwnProperty(uuid))
		result = this.commentaries[uuid];
	return result;
}

/**
Returns UUIDs of commentaries.

@method getCommentaryUUIDs
@param {string} uuid UUID of the original recording.
@return {array} List of UUIDs.
*/
ldc.aikuma.AikumaFolder.prototype.getCommentaryUUIDs = function(uuid) {
	var org = this.org2comm[uuid];
	return org == null ? null :	Object.getOwnPropertyNames(this.org2comm[uuid]);
}

/**
Returns the URL for a map file given a recording UUID.

@method getMapFileUrl
@param {string} uuid UUID of a commentary.
@return {string} URL for a map file.
*/
ldc.aikuma.AikumaFolder.prototype.getMapFileUrl = function(uuid) {
	if (this.urls.hasOwnProperty(uuid))
		return this.urls[uuid].map;
}

/**
Returns the URL for a shape file given a recording UUID.

@method getShapeFileUrl
@param {string} uuid UUID of a commentary.
@return {string} URL for a shape file.
*/
ldc.aikuma.AikumaFolder.prototype.getShapeFileUrl = function(uuid) {
	if (this.urls.hasOwnProperty(uuid))
		return this.urls[uuid].shape;
}

/**
Returns the URL for a speaker image file the given recording UUID.

@method getSpeakerImageUrl
@param {string} uuid UUID of a commentary.
@return {string} URL for a speaker image file.
*/
ldc.aikuma.AikumaFolder.prototype.getSpeakerImageUrl = function(uuid) {
	if (this.urls.hasOwnProperty(uuid))
		return this.urls[uuid].jpg;
}

/**
Returns the URL for a small speaker image file the given recording UUID.

@method getSmallSpeakerImageUrl
@param {string} uuid UUID of a commentary.
@return {string} URL for a small speaker image file.
*/
ldc.aikuma.AikumaFolder.prototype.getSmallSpeakerImageUrl = function(uuid) {
	if (this.urls.hasOwnProperty(uuid))
		return this.urls[uuid]['small.jpg'];
}

function read_text_file(file, callback) {
	var reader = new FileReader;
	reader.onload = function() {
		callback(this.result);
	};
	reader.readAsText(file);
}

})();