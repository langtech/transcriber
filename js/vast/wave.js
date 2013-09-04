//(function() {

/**
 * @nmodule vast
 */

goog.provide('vast.Wave');
goog.require('ldc.waveform.WaveformBuffer');
goog.require('ldc.waveform.RichWaveform');
goog.require('ldc.waveform.WaveformSet');
goog.require('ldc.waveform.Scrollbar');
goog.require('ldc.event.EventBus');
goog.require('goog.net.XhrIo');


/**
 * @method download
 * @param {String} url
 * @param {String} [type] If the value is "array_buffer", the url is
 *   downloaded as an ArrayBuffer. Otherwise, it's downloaded as text.
 * @return {Promise} A promise for the downloaded data.
 */
function download(url, type) {
	var deferred = Q.defer();
	var xhr = new goog.net.XhrIo;
	if (type == 'array_buffer') {
		xhr.setResponseType(goog.net.XhrIo.ResponseType.ARRAY_BUFFER);
	}
	else {
		xhr.setResponseType(goog.net.XhrIo.ResponseType.TEXT);
	}
	xhr.listen(goog.net.EventType.COMPLETE, function(e) {
		deferred.resolve(e.target.getResponse());
	});
	xhr.listen(goog.net.EventType.ERROR, function(e) {
		deferred.reject(e);
	})
	xhr.send(url);
	return deferred.promise;
}

// Run callback with exception handling
function execute_callback(callback, args) {
	if (callback == null)
		return;
	try {
		callback.apply(args);
	} catch (e) {
		console.log(e.stack);	
		alert("Application error.\nSee console for details");
	}
}

/**
 * @class Wave
 * @constructor
 * @param {String} elementId
 */
vast.Wave = function(elementId) {
	this.container = document.getElementById(elementId);
	if (this.container == null) {
		throw "No HTML element by the ID: " + elementId;
	}

	this.player_div = document.createElement('div');
	document.body.appendChild(this.player_div);

	this.playing_start_time = null;
	this.playing_end_time = null;

	this.waveforms = [];
	this.waveform_set = null;  // ldc.waveform.WaveformSet instance
	this.ebus = new ldc.event.EventBus;
};

/**
 * @method setShapeUrl
 * @param {string} waveformUrl
 * @param {function} callback Called when shape file is loaded.
 */
vast.Wave.prototype.setShapeUrl = function(waveformUrl, callback) {
	var that = this;
	download(waveformUrl, 'array_buffer')
	.then(function(raw_data) {
		var buf = new ldc.waveform.WaveformBuffer(raw_data);
		that.container.innerHTML = '';
		that.waveforms = [];
		that.waveform_set = new ldc.waveform.WaveformSet;
		for (var c=0; c < buf.channels; ++c) {
			var div = goog.dom.createDom('div', 'waveform');
			var canvas = goog.dom.createDom('canvas', 'waveform-canvas');
			div.appendChild(canvas);
			var waveform = new ldc.waveform.RichWaveform(buf, canvas, c, that.ebus);
			that.waveforms.push({
				channel: c,
				canvas: canvas,
				waveform: waveform
			});
			that.waveform_set.addWaveform(waveform);
			that.container.appendChild(div);
		}
		var sb_dom = goog.dom.createDom('div');
		var sb = new ldc.waveform.Scrollbar(that.waveform_set, sb_dom, that.ebus);
		that.container.appendChild(sb_dom);
		execute_callback(callback);
	})
	.fail(function(e) {
		console.log(e);
		alert("Failed to download waveform: " + waveform_url +
			"\n\nSee console for details.");
	});
};

/**
 * @method setAudioUrl
 * @param {String} audioUrl
 * @param {String} format
 * @param {Function} callback
 */
vast.Wave.prototype.setAudioUrl = function(audioUrl, format, callback) {
	if (format == null) {
		format = 'ogg';
	}
	var opts = {};
	opts[format] = audioUrl;
	var that = this;
	$(this.player_div).jPlayer({
		ready: function(e) {
			$(this).jPlayer('setMedia', opts);
			execute_callback(callback);
		},
		supplied: format,
		timeupdate: function(e) {
			var pos = e.jPlayer.status.currentTime;
			var ev = new ldc.waveform.WaveformCursorEvent(null, pos);
			that.ebus.queue(ev);
			if (pos >= that.playing_end_time) {
				$(this).jPlayer('stop');
			}
		}
	});
};

/**
 * Start offset of the currently selected region.
 *
 * @method getCursor
 * @return {Number}
 */
vast.Wave.prototype.getCursor = function() {
	var s = this.getSpan();
	if (s) {
		return s.offset;
	}
};

/**
 * @method getSpan
 * @return {Object}
 */
vast.Wave.prototype.getSpan = function() {
	if (this.waveforms.length > 0) {
		var s = this.waveforms[0].waveform.getSelection();
		return {offset: s.pos, length: s.dur};
	}
};

/**
 * @method playCurrentSpan
 */
vast.Wave.prototype.playCurrentSpan = function() {
	var s = this.getSpan();
	if (s != null) {
		this.playing_start_time = s.offset;
		this.playing_end_time = s.offset + s.length;
		$(this.player_div).jPlayer('play', s.offset);
	}
};

/**
 * @method playThisSpan
 * @param {Number} offset
 * @param {Number} length
 */
vast.Wave.prototype.playThisSpan = function(offset, length) {
	this.playing_start_time = offset;
	this.playing_end_time = offset + length;
	$(this.player_div).jPlayer('play', offset);
};

/**
 * @method setCanvasSize
 * @param {Number} width
 * @param {Number} height
 */
vast.Wave.prototype.setCanvasSize = function(width, height) {
	for (var i=0, meta; meta = this.waveforms[i]; ++i) {
		meta.canvas.width = width;
		meta.canvas.height = height;
	}
};

/**
 * @method display
 * @param {Number} startOffset
 * @param {Number} endOffset
 */
vast.Wave.prototype.display = function(startOffset, endOffset) {
	if (this.waveform_set) {
		this.waveform_set.display(startOffset, endOffset);
	}
};

//})();
