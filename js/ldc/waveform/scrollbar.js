/**
 * @module ldc
 * @submodule waveform
 * @namespace waveform
 */
goog.provide("ldc.waveform.Scrollbar");

/**
 * Turn an html element into a scrollbar widget for waveforms.
 * 
 * @class Scrollbar
 * @constructor
 * @param {HTMLElement} element A div element to be converted to a scrollbar.
 */
ldc.waveform.Scrollbar = function(element) {
	this.element = element;

	this.waveforms = new Array;
	this.max_len_t = 0;
	this.max_len_count = 0;
	this.window_t = null;  // start time of current window
	this.window_w = null;  // duration of the current window
	this.widget = new goog.ui.Slider;
	this.widget.decorate(this.element);
	this.widget.setStep(0.000000001);

	var sb = this;
	var handler =  function(e) {
		if (sb.waveforms.length == 0) {
			return;
		}
		var p = sb.widget.getValue();
		var m = sb.widget.getMaximum();
		sb.window_t = (sb.max_len_t - sb.window_w) * p / m;
		for (var i=0; i < sb.waveforms.length; ++i) {
			sb.waveforms[i].moveWindow(sb.window_t);
		}
	}
	
	goog.events.listen(
		this.widget, goog.ui.Component.EventType.CHANGE, handler, false);

	goog.cssom.addCssText(" \
		.goog-slider-horizontal { \
		  background-color: ThreeDFace; \
		  position: relative; \
		  overflow: hidden; \
		  height: 15px; \
		} \
		\
		.goog-slider-thumb { \
		  background-color: ThreeDShadow; \
		  position: absolute; \
		  overflow: hidden; \
		  top: 0; \
		  width: 20px; \
		  height: 100%; \
		} \
	");
}

/**
 * Add a waveform to the managed waveform list. When the scrollbar changes the
 * position, managed waveforms are signaled to move to that position. Note
 * changes in a managed waveform is not propagated back to the scrollbar.
 *
 * @method addWaveform
 */
ldc.waveform.Scrollbar.prototype.addWaveform = function(waveform) {
	var idx = this.waveforms.indexOf(waveform);
	if (idx < 0) {
		this.waveforms.push(waveform);
		if (this.window_t === null) {
			this.window_t = waveform.windowStartTime();
			this.window_w = waveform.windowDuration();
		}
		else {
			waveform.display(this.window_t, this.window_w);
		}
		if (this.max_len_t < waveform.buffer.len_t) {
			this.max_len_t = waveform.buffer.len_t;
			this.max_len_count = 1;

			var ww = parseInt(this.widget.getElement().style.width);
			var w = this.window_w / this.max_len_t * ww;
			w = Math.max(Math.min(w, ww), 10);
			this.widget.getValueThumb().style.width = w + 'px';
		}
		else if (this.max_len_t == waveform.buffer.len_t) {
			this.max_len_count += 1;
		}
	}
}

/**
 * @method removeWaveform
 */
ldc.waveform.Scrollbar.prototype.removeWaveform = function(waveform) {
	var idx = this.waveforms.indexOf(waveform);
	if (idx >= 0) {
		this.waveforms.splice(idx, 1);
		if (waveform.buffer.len_t == this.max_len_t) {
			this.max_len_count -= 1;
			if (this.max_len_count <= 0) {
				this.max_len_t = 0;
				this.max_len_count = 0;
				for (var i=0; i < this.waveforms.length; ++i) {
					var t = this.waveforms[i].buffer.len_t;
					if (t > this.max_len_t) {
						this.max_len_t = t;
						this.max_len_count = 1;
					}
					else if (t == this.max_len_t) {
						this.max_len_count += 1;
					}
				}
			}
		}
	}
}

/**
 * Set width of the widget.
 *
 * @method setWidth
 * @param {number} n
 */
ldc.waveform.Scrollbar.prototype.setWidth = function(n) {
	if (typeof(n) == "number") {
		this.element.style.width = Math.round(n) + "px";
	}
}

/**
 * @method width
 * @return {number} The width of the underlying html element.
 */
ldc.waveform.Scrollbar.prototype.width = function() {
	return this.element.clientWidth;
}

/**
 * Move the windows of managed waveforms to the specified location in the
 * timeline.
 * 
 * @method moveTo
 * @param {number} t Time offset
 * @param {String} anchor="beg" One of `beg`, `mid` or `end`.
 *   If anchor is `beg`, the window will begin at `t`. If anchor is `end`,
 *   the window will end at `t`. If anchor is `mid`, the center of the
 *   window will be calculated based on the canvas width, and it will be
 *   aligned with the center of the canvas.
 */
ldc.waveform.Scrollbar.prototype.moveTo = function(t, anchor) {
	var x = this.max_len_t - this.window_w;
	var n = t / x * this.widget.getMaximum();
	if (anchor == "beg" || anchor === undefined) {
		this.widget.setValue(n);
	}
	else {
		var w = this.window_w / x * this.widget.getMaximum();
		if (anchor == "mid") {
			this.widget.setValue(n - w / 2);
		}
		else if (anchor == "end") {
			this.widget.setValue(n - w);
		}
	}
}