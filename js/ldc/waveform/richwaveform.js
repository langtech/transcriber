/**
 * @module ldc
 * @submodule waveform
 * @namespace waveform
 */
goog.provide('ldc.waveform.RichWaveform');
goog.require('ldc.waveform.Waveform');
goog.require('goog.dom');
goog.require('goog.style');
goog.require('goog.object');

/**
 * Waveform with a cursor and a region for markup.
 *
 * @class RichWaveform
 * @extends waveform.Waveform
 * @constructor
 * @param {WaveformBuffer} buffer
 * @param {Canvas} canvas A canvas object on the html page
 * @param {number} channel A channel of the buffer to display
 */
ldc.waveform.RichWaveform = function(buffer, canvas, channel) {
	goog.base(this, buffer, canvas, channel);

	this.container = goog.dom.createElement('div');
	this.container.style.position = 'relative';
	goog.dom.insertSiblingAfter(this.container, canvas);
	goog.dom.appendChild(this.container, canvas);

	this.regions = {}
	// Region is an object represention a region in the waveform. It has
	// following properties:
	//    html  - a DIV element
	//    pos   - start position of the region in seconds
	//    dur   - length of the region in seconds
	//    color - color of the region
	//    alpha - transparency (client has no control on this)
}
goog.inherits(ldc.waveform.RichWaveform, ldc.waveform.Waveform);

/**
 * @method addRegion
 * @param {Number} t Start position of the region in seconds.
 * @param {Number} [dur=0]
 * @param {String} [color=red]
 * @return {String} A unique ID for the region.
 */
ldc.waveform.RichWaveform.prototype.addRegion = function(t, dur, color)
{
	var div = goog.dom.createElement('div');
	goog.dom.appendChild(this.container, div);

	var region = {
		html: div,
		pos: t,
		dur: dur==null ? 0 : dur,
		color: color==null ? 'red' : color,
		alpha: 0.4
	}

	var id = Math.random() + '';
	while (this.regions.hasOwnProperty(id)) {
		id = Math.random() + '';
	}
	this.regions[id] = region;
	this.renderRegion_(region);
	return id;
}

/**
 * Update the position and size of the region.
 *
 * @method updateRegion
 * @param {String} id An ID referencing the region to be updated.
 * @param {Number} [t] New position in seconds. No change if null.
 * @param {Number} [dur] New size of the region in seconds. No change if null.
 * @param {String} [color] New color of the region.
 */
ldc.waveform.RichWaveform.prototype.updateRegion = function(id, t, dur, color) {
	if (this.regions.hasOwnProperty(id)) {
		var r = this.regions[id];
		if (t != null) {
			r.pos = t;
		}
		if (dur != null) {
			r.dur = dur;
		}
		if (color != null) {
			r.color = color;
		}
		if (t != null || dur != null || color != null) {
			this.renderRegion_(r);
		}
	}
}

/**
 * Display waveform at the specified time and duration.
 * 
 * @method display
 * @param {number} t Start time of the drawing window
 * @param {number} [dur] Width of the drawing window in seconds.
 *   If not set, current window duration is kept.
 */
ldc.waveform.RichWaveform.prototype.display = function(t, dur) {
	var ret = goog.base(this, 'display', t, dur);
	goog.object.every(this.regions, this.renderRegion_, this);
	return ret;
}

// Private method for rendering a region object.
ldc.waveform.RichWaveform.prototype.renderRegion_ = function(r) {
	var x = this.t2p(r.pos);
	var y = this.t2p(r.pos + r.dur);
	if (y < 0 || x >= this.canvas.width) {
		r.html.style.display = 'none';
	}
	else {
		if (x < 0) {
			x = 0;
		}
		if (y >= this.canvas.width) {
			y = this.canvas.width - 1;
		}
		r.html.style.left = x + 'px';
		r.html.style.width = (y - x + 1) + 'px';
		r.html.style.height = this.canvas.height + 'px';
		r.html.style.backgroundColor = r.color;
		goog.style.setOpacity(r.html, r.alpha);
		r.html.style.position = 'absolute';
		r.html.style.top = '0px';
		r.html.style.display = 'block';
	}
}
