(function() {

/**
 * @module vast
 * @namespace vast
 */

goog.provide('vast.Wave');
goog.require('ldc.waveform.WaveformBuffer');
goog.require('ldc.waveform.RichWaveform');
goog.require('ldc.waveform.WaveformSet');
goog.require('ldc.waveform.Scrollbar');
goog.require('ldc.event.EventBus');
goog.require('goog.net.XhrIo');


/**
 * @private
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
 * Construct a waveform display widget.
 *
 * @class Wave
 * @constructor
 * @param {String} elementId ID of a DIV element inside which the widget will
 *   be rendered.
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
 * Load a shapefile and render the widget. If a callback function is supplied,
 * it is called after everything is loaded and rendered.
 *
 * @method setShapeUrl
 * @param {string} shapeFileUrl
 * @param {function} callback Called when shape file is loaded.
 */
vast.Wave.prototype.setShapeUrl = function(waveformUrl, callback) {
	var that = this;
	download(waveformUrl, 'array_buffer')
	.then(function(raw_data) {
		var buf = new ldc.waveform.WaveformBuffer(raw_data);
		that.container.innerHTML = '';
		that.ebus = new ldc.event.EventBus;
		that.waveforms.forEach(function(meta) {
			meta.waveform.tearDown();
		});
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
		console.log(e.stack);
		alert("Failed to download waveform: " + waveform_url +
			"\n\nSee console for details.");
	});
};

/**
 * Load an audio from the specified URL. If a callback function is supplied,
 * it is called after audio has been loaded.
 *
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
 * Returns start offset of the currently selected region.
 *
 * @method getCursor
 * @return {Number} Start offset of the current region.
 */
vast.Wave.prototype.getCursor = function() {
	var s = this.getSpan();
	if (s) {
		return s.offset;
	}
};

/**
 * Returns start offset and lenght of the currently selected region.
 *
 * @method getSpan
 * @return {Object} An object with two properties:
 *
 *   - offset: start offset of the region
 *   - length: length of the region
 */
vast.Wave.prototype.getSpan = function() {
	if (this.waveforms.length > 0) {
		var s = this.waveforms[0].waveform.getSelection();
		return {offset: s.pos, length: s.dur};
	}
};

/**
 * Highlight the specified region on the waveform.
 *
 * @method setSpan
 * @param {Number} offset
 * @param {Number} length
 */
vast.Wave.prototype.setSpan = function(offset, length) {
	if (this.waveforms.length > 0) {
		var w = this.waveforms[0].waveform;
		var e = new ldc.waveform.WaveformRegionEvent(this, offset, length, w.id);
		this.ebus.queue(e);
	}
};

/**
 * Play currently selected region.
 *
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
 * Play specified region.
 *
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
 * Resize the waveform area.
 *
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
 * Move and resize the current waveform display window.
 *
 * @method display
 * @param {Number} startOffset
 * @param {Number} endOffset
 */
vast.Wave.prototype.display = function(startOffset, endOffset) {
	if (this.waveform_set) {
		this.waveform_set.display(startOffset, endOffset);
	}
};

vast.Wave.prototype.handleEvent = function(e) {
	if (e instanceof ldc.waveform.WaveformCursorEvent) {
	}
};

goog.exportSymbol('vast.Wave', vast.Wave);
goog.exportSymbol('vast.Wave.prototype.setShapeUrl', vast.Wave.prototype.setShapeUrl);
goog.exportSymbol('vast.Wave.prototype.setAudioUrl', vast.Wave.prototype.setAudioUrl);
goog.exportSymbol('vast.Wave.prototype.getCursor', vast.Wave.prototype.getCursor);
goog.exportSymbol('vast.Wave.prototype.getSpan', vast.Wave.prototype.getSpan);
goog.exportSymbol('vast.Wave.prototype.setSpan', vast.Wave.prototype.setSpan);
goog.exportSymbol('vast.Wave.prototype.playCurrentSpan', vast.Wave.prototype.playCurrentSpan);
goog.exportSymbol('vast.Wave.prototype.playThisSpan', vast.Wave.prototype.playThisSpan);
goog.exportSymbol('vast.Wave.prototype.setCanvasSize', vast.Wave.prototype.setCanvasSize);
goog.exportSymbol('vast.Wave.prototype.display', vast.Wave.prototype.display);

})();