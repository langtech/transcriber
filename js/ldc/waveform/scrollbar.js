/**
 * @module ldc
 * @submodule waveform
 * @namespace waveform
 */
goog.provide('ldc.waveform.Scrollbar');
goog.require('goog.ui.Slider');
goog.require('goog.cssom');

/**
 * Turn an html element into a scrollbar widget for waveforms.
 * 
 * @class Scrollbar
 * @constructor
 * @param {WaveformSet} waveformSet
 * @param {HTMLElement} element A div element to be converted to a scrollbar.
 */
ldc.waveform.Scrollbar = function(waveformSet, element) {
	this.element = element;
	this.wset = waveformSet;

	this.widget = new goog.ui.Slider;
	this.widget.decorate(this.element);
	this.widget.setStep(0.000000001);

	var sb = this;
	var handler =  function(e) {
		var p = sb.widget.getValue();
		var m = sb.widget.getMaximum();
		var t = sb.wset.length() * p / m;
		sb.wset.display(t);
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
	var n = t / x * this.widget.getMaximum();
	if (anchor == "beg" || anchor == null) {
		this.widget.setValue(n);
	}
	else {
		var w = this.wset.windowDuration() / x * this.widget.getMaximum();
		if (anchor == "mid") {
			this.widget.setValue(n - w / 2);
		}
		else if (anchor == "end") {
			this.widget.setValue(n - w);
		}
	}
}