/**
 * @module ldc
 * @submodule waveform
 * @namespace waveform
 */
goog.provide('ldc.waveform.Region');

/**
 * A region over a waveform. It's usually created by RichWaveform class.
 *
 * @class Region
 * @param {Object} info An object with these properties: beg, dur, id.
 */
ldc.waveform.Region = function(info) {
	this.beg = info.beg;
	this.dur = info.dur;
	this.id = info.id;
}

/**
 * @method start
 * @return {Number} The start time of the region.
 */
ldc.waveform.Region.prototype.start = function() {
	return this.beg;
}

/**
 * @method duration
 * @return {Number} The duration of the region.
 */
ldc.waveform.Region.prototype.duration = function() {
	return this.dur;
}

/**
 * @method id
 * @return {Number|String} Unique ID of the region.
 */
ldc.waveform.Region.prototype.duration = function() {
	return this.id;
}
