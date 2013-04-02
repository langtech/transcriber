/**
 * @module ldc
 * @submodule waveform
 * @namespace waveform
 */
goog.provide("ldc.waveform.WaveformBuffer");

/**
 * A class for storing and serving waveform data samples for displaying.
 *
 * @class WaveformBuffer
 * @constructor
 * @param {ArrayBuffer} data The raw data contained in the downloaded
 *   LDC shape file. An LDC shape file has a header and body. The header
 *   has the following format:
 * 
 *     [bytes 0-6] "LDCWF\n\0"
 *     [bytes 7-8] sample rate (unsigned integer)
 *     [byte 9] number of channels (unsigned integer)
 *     [bytes 10-15] "\0\0\0\0\0\0"
 * 
 *   The body is a series of frames, each of which corresponds to one of
 *   the consecutive regions of the original signal. Each frame has
 *   2 * C bytes, where C is the number of channels. In each frame, the
 *   first 2 bytes are for the first channel, and the next 2 bytes are for
 *   the second channel, and so on.
 *   The first byte for a channel is the lowest sample value in the
 *   corresponding region of the channel. Similarly, the second byte is the
 *   largest sample value. For instance, the body of a 2-channel shape file
 *   would look like this
 * 
 *     [bytes 16-19]  0 0  -72 75  (frame 1: 0.00~0.01 seconds)
 *     [bytes 20-23] -2 2  -69 68  (frame 2: 0.01~0.02 seconds)
 *     ......
 *   
 */    
ldc.waveform.WaveformBuffer = function(data) {
    // TODO: check if the data is in the right format
    var dv = new DataView(data, 0, 16);  // dave view for header
    
    /**
     * An array containing the original shape file.
     * @property data
     * @type Int8Array
     */
    this.data = new Int8Array(data, 16);
    /**
     * The sampling rate.
     * @property samplerate
     */
    this.samplerate = dv.getUint16(7);
    /**
     * The number of channels in the buffer.
     * @property channels
     */
    this.channels = dv.getUint8(9);
    /**
     * Number of frames contained in the buffer.
     * @property frames
     */
    this.frames = this.data.length / 2 / this.channels;
    /**
     * The length of the buffer in seconds.
     * @property len_t
     */
    this.len_t = this.frames / this.samplerate;
}

/**
 * Returns an array of data samples within the specified time region.
 * The data is resampled to produce the exact number of samples as
 * specified by `frames`.
 * 
 * @method getSamples
 * @param {number} beg Start time of the region.
 * @param {number} end End time of the region.
 * @param {number} frames Number of frames in the return array.
 * @return {Int8Array} The returned array is a series of frames just like
 *   the body of the LDC shape file format. See the constructor
 *   ({{#crossLink "waveform.WaveformBuffer"}}{{/crossLink}}}) for the
 *   description of the frame format. Returns null on error. 
 */
ldc.waveform.WaveformBuffer.prototype.getSamples = function(beg, end, frames) {
    if (frames <= 0) {
        return null;
    }
    
    var a = Math.floor(beg * this.samplerate);  // start frame
    var b = Math.ceil(end * this.samplerate);  // end frame
    var step = (b-a) / frames;  // number of source frames per output frame
    
    if (step <= 0) {
        return null;
    }
    
    var res = new Int8Array(frames * 2 * this.channels);
    
    var i;  // frame index for output array

    // upper bound for i    
    // maximum number of output frames that cat be generated
    // before reaching the last source frame
    var m = (this.frames - a) / step;
    if (frames < m) {
        m = frames;
    }
    
    // left side of frame range that is out of the source shape file        
    for (i = 0; i < -a; ++i) {
        var g = i * 2 * this.channels;
        for (var c = 0; c < this.channels; ++c) {
            res[g + 2 * c] = 0;
            res[g + 2 * c + 1] = 0;
        }
    }
    if (step < 1) {
        for (; i < m; ++i) {
            var k = Math.floor(a + i * step); // frame index for this.data
            var base = k * 2 * this.channels; // byte offset for the frame
            var g = i * 2 * this.channels;    // byte offset for output
            for (var c = 0; c < this.channels; ++c) {
                res[g + 2 * c] = this.data[base + 2 * c];
                res[g + 2 * c + 1] = this.data[base + 2 * c + 1];
            }
        }
    } else {
        for (; i < m; ++i) {
            var x = a + i * step;
            var min = [];
            var max = [];
            for(var c = 0; c < this.channels; ++c) {
                min[c] = 500;
                max[c] = -500;
            }
            for(var f = Math.floor(x); f < Math.ceil(x + step); ++f) {
                var base = f * this.channels * 2;
                for(var c = 0; c < this.channels; ++c) {
                    var minval = this.data[base + 2 * c];
                    var maxval = this.data[base + 2 * c + 1];
                    if(minval < min[c]) {
                        min[c] = minval;
                    }
                    if(maxval > max[c]) {
                        max[c] = maxval;
                    }
                }
            }
            var g = i * 2 * this.channels;
            for(var c = 0; c < this.channels; ++c) {
                res[g + 2 * c] = min[c];
                res[g + 2 * c + 1] = max[c];
            }
        }
    }
    // right side of frame range that is out of the source shape file
    for (; i < frames; ++i) {
        var g = i * 2 * this.channels;
        for (var c = 0; c < this.channels; ++c) {
            res[g + 2 * c] = 0;
            res[g + 2 * c + 1] = 0;
        }
    }
    return res;
}
