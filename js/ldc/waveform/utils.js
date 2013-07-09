/**
 * @module ldc
 * @submodule waveform
 * @namespace waveform
 */
goog.provide('ldc.waveform.Utils');

/**
 * Set of utility methods.
 *
 * @class Utils
 */
ldc.waveform.Utils = {
	/**
	 * Make LDC Shape File out of AudioBuffer.
	 *
	 * @method makeShapeFile
	 * @param {Number} max_win_px Maximum window size in pixel.
	 * @param {Number} min_win_sec Minimum window size in seconds.
	 * @param {AudioBuffer} audio_buffer AudioBuffer object of Web Audio API.
	 * @param {Number} [num_channels] Number of channels in the audio buffer.
	 * @return {ArrayBuffer} ArrayBuffer containg LDC Shape File.
	 */
	makeShapeFile: function(max_win_px, min_win_sec, audio_buffer, num_channels) {
		var channels = audio_buffer.numberOfChannels;
		if (num_channels != null && num_channels < channels) {
			channels = num_channels;
		}
		var samplerate = Math.ceil(max_win_px / min_win_sec);

		if (audio_buffer.sampleRate <= samplerate) {
			return null;  // requested resoltuion too high
		}

		// number of samplerate to read for each output
		var delta = audio_buffer.sampleRate / samplerate;
		// index of the last sample for next output
		var next = delta;

		var num_frames = Math.ceil(audio_buffer.duration * samplerate);
		var frame_size = 2 * channels;
		var shape = new Int8Array(16 + num_frames * frame_size);

		// write header
		var dv = new DataView(shape.buffer);
		shape.set([76,68,67,87,70,10,0]);   // "LDCWF\n\0"
		dv.setUint16(7, samplerate, false); // 2-byte, samplerate, big-endian
		shape[9] = channels;                // # channels
		shape.set([0,0,0,0,0,0], 10);       // unused

		for (var c=0; c < channels; ++c) {
			var channel_data = audio_buffer.getChannelData(c);
			var idx = 16 + c * 2;
			var min = 10;
			var max = -10;
			for (var i=0; i < channel_data.length; ++i) {
				var sample = channel_data[i];
				sample = sample > 1 ? 1 : sample;
				sample = sample < -1 ? -1 : sample;
				if (i < next) {
					if (sample < min) {
						min = sample;
					}
					if (sample > max) {
						max = sample;
					}
				}
				else {
					shape[idx] = Math.round(min * 127);
					shape[idx + 1] = Math.round(max * 127);
					next += delta;
					min = max = sample;
					idx += frame_size;
				}
			}
			shape[idx] = Math.round(min * 127);
			shape[idx + 1] = Math.round(max * 127);
		}

		return shape.buffer;
	}
};
