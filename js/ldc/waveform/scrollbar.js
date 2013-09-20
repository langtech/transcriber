/**
 * @module ldc
 * @submodule waveform
 * @namespace waveform
 */
goog.provide('ldc.waveform.Scrollbar');
goog.require('ldc.waveform.WaveformWindowEvent');
goog.require('goog.ui.Slider');
goog.require('goog.cssom');

/**
 * Turn an html element into a scrollbar widget for waveforms.
 * 
 * Emits and listens to the following events:
 *
 *  - {{#crossLink "waveform.WaveformWindowEvent"}}{{/crossLink}}
 *
 * @class Scrollbar
 * @constructor
 * @param {WaveformSet} waveformSet
 * @param {HTMLElement} element A div element to be converted to a scrollbar.
 * @param {EventBus} [ebus]
 */
ldc.waveform.Scrollbar = function(waveformSet, element, ebus) {
	this.element = element;
	this.wset = waveformSet;

	this.widget = new goog.ui.Slider;
	this.widget.decorate(this.element);
	this.thumb = this.widget.getValueThumb();
	this.issue_event = true; // whether to issue the window move event

	goog.events.listen(this.widget, 'change', function(e) {
		if (ebus && this.issue_event) {
			var p = this.widget.getValue();
			var m = this.widget.getMaximum();
			var t = (this.wset.length() - this.wset.windowDuration()) * p / m;
			ebus.queue(new ldc.waveform.WaveformWindowEvent(this, t));
		}
	}, false, this);

	this.ebus = ebus;
	if (ebus) {
		ebus.connect(ldc.waveform.WaveformWindowEvent, this);
	}

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
		  height: 100%; \
		} \
	");

	var w = this.wset.windowDuration() / this.wset.length() * this.element.clientWidth;
	this.thumb.style.width = Math.round(Math.max(5,w)) + 'px';
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
	var x = this.wset.length();
	var max = this.widget.getMaximum();

	if (anchor == "beg" || anchor == null) {
		var v = t / x * max;
		this.widget.setValue(Math.min(100, Math.round(v)));
	}
	else {
		if (anchor == "mid") {
			var dur = this.wset.windowDuration();
			var v = (t - dur / 2) / x * max;
			this.widget.setValue(Math.min(100, Math.round(v)));
		}
		else if (anchor == "end") {
			var dur = this.wset.windowDuration();
			var v = (t - dur) / x * max;
			this.widget.setValue(Math.min(100, Math.round(v)));
		}
	}
}

/**
 *
 * @method handleEvent
 */
ldc.waveform.Scrollbar.prototype.handleEvent = function(e) {
	if (e instanceof ldc.waveform.WaveformWindowEvent) {
		var a = e.args();
		if (a.dur) {
			var x = this.wset.length();
			var w = a.dur / x * this.element.clientWidth;
			this.thumb.style.width =  Math.round(w) + 'px';
		}

		this.issue_event = false;
		this.moveTo(e.args().beg);
		this.issue_event = true;
	}
}
