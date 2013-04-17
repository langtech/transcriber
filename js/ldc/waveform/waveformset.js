/**
 * @module ldc
 * @submodule waveform
 * @namespace waveform
 */
goog.provide('ldc.waveform.WaveformSet');

/**
 * A set of synchronized Waveforms.
 *
 * @class WaveformSet
 * @construtor
 */
ldc.waveform.WaveformSet = function() {
	this.waveforms = new Array;
	this.max_len_t = 0;
	this.max_len_count = 0;
	this.window_t = null;  // start time of current window
	this.window_w = null;  // duration of the current window
}

/**
 * @method addWaveform
 * @param {Waveform} waveform
 */
ldc.waveform.WaveformSet.prototype.addWaveform = function(waveform) {
	var idx = this.waveforms.indexOf(waveform);
	if (idx < 0) {
		if (this.window_t == null) {
			var t = waveform.windowStartTime();
			var w = waveform.windowDuration();
			if (t != null && w != null) {
				this.window_t = t;
				this.window_w = w;
			}
		}
		else {
			waveform.display(this.window_t, this.window_w);
		}
		this.waveforms.push(waveform);
		if (this.max_len_t < waveform.length()) {
			this.max_len_t = waveform.length();
			this.max_len_count = 1;
		}
		else if (this.max_len_t == waveform.length()) {
			this.max_len_count += 1;
		}
	}
}

/**
 * @method removeWaveform
 * @param {Waveform} waveform
 */
 ldc.waveform.WaveformSet.prototype.removeWaveform = function(waveform) {
	var idx = this.waveforms.indexOf(waveform);
	if (idx >= 0) {
		this.waveforms.splice(idx, 1);
		if (waveform.length() == this.max_len_t) {
			this.max_len_count -= 1;
			if (this.max_len_count <= 0) {
				this.max_len_t = 0;
				this.max_len_count = 0;
				for (var i=0; i < this.waveforms.length; ++i) {
					var t = this.waveforms[i].length();
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
 * Returns the length of the longest waveform in seconds.
 *
 * @method length
 * @return {Number} Length of the longest waveform in seconds.
 */
ldc.waveform.WaveformSet.prototype.length = function() {
	return this.max_len_t;
}

/**
 * @method windowDuration
 * @return {Number}
 */
ldc.waveform.WaveformSet.prototype.windowDuration = function() {
	return this.window_w;
}

/**
 * @method windowStartTime
 * @return {Number}
 */
ldc.waveform.WaveformSet.prototype.windowStartTime = function() {
	return this.window_t;
}

/**
 * @method display
 * @param {Number} beg
 * @param {Number} [dur]
 */
ldc.waveform.WaveformSet.prototype.display = function(beg, dur) {
	this.window_t = beg;
	if (dur != null) {
		this.window_w = dur;
	}
	for (var i=0; i < this.waveforms.length; ++i) {
		this.waveforms[i].display(beg, dur);
	}
}
