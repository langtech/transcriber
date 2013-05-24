(function() {

/**
 * @module ldc
 * @submodule waveform
 * @namespace waveform
 */
goog.provide('ldc.waveform.Waveform');
goog.require('goog.array');
goog.require('goog.dom');

/**
 * A class for displaying WaveformBuffer on a canvas. After instantiation,
 * display should be called before calling any other methods. For example,
 * windowDuration() method would return null if display() hadn't been called
 * before.
 *
 * @class Waveform
 * @constructor
 * @param {WaveformBuffer} buffer
 * @param {HTMLCanvasElement} canvas A canvas object on the html page
 * @param {number} channel A channel of the buffer to display
 */
ldc.waveform.Waveform = function(buffer, canvas, channel) {
    /**
     * Unique ID of the waveform.
     * @property {Number} id
     * @readonly
     */
    this.id = counter++;

    /**
     * WaveformBuffer object associated with this Waveform.
     * @property {WaveformBuffer} buffer
     * @readonly
     */
    this.buffer = buffer;

    /**
     * @property {HTMLCanvasElement} canvas
     * @readonly
     */
    this.canvas = canvas;

    /**
     * Channel of the rendered WaveformBuffer
     * @property {Number} channel
     * @readonly
     */
    this.channel = channel;

    // TODO: paramater sanity check

    // start pixel offset of the window
    this._poff = 0;
    // seconds per pixel
    this._spx = -1;
}

counter = 0;

/**
 * Returns the width of the canvas.
 * @method canvasWidth
 */
ldc.waveform.Waveform.prototype.canvasWidth = function() {
    return this.canvas.width;
}

/**
 * Returns the duration of the window.
 *
 * @method windowDuration
 * @return {number} Duration of the window. Null if display() hasn't been
 *    called with duration.
 */
ldc.waveform.Waveform.prototype.windowDuration = function() {
    if (this._spx > 0) {
        return this.canvas.width * this._spx;
    }
}

/**
 * Returns the start time offset of the window.
 * @method windowStartTime
 * @return {number} Start time offset of the window. Null if display() hasn't
 *    been called with duration.
 */
ldc.waveform.Waveform.prototype.windowStartTime = function() {
    if (this._spx > 0) {
        return this._poff * this._spx;
    }
}

/**
 * Finds the pixel index relative to current canvas given the time offset.
 * @method t2p
 * @param {number} t Time offset.
 * @return {number} Pixel index. Null if display() hasn't been called with
 *    duration.
 */
ldc.waveform.Waveform.prototype.t2p = function(t) {
    if (this._spx > 0) {
        return Math.round(t / this._spx) - this._poff;
    }
}

/**
 * Converts pixel offset into time offset.
 * @method p2t
 * @param {number} p Pixel offset.
 * @return {number} Time offset. Null if display() hasn't been called with
 *    duration.
 */
ldc.waveform.Waveform.prototype.p2t = function(p) {
    if (this._spx > 0) {
        return p * this._spx;
    }
}

/**
 * Return the length of the waveform in seconds.
 *
 * @method length
 * @return {Number} Lenght of the waveform in seconds.
 */
ldc.waveform.Waveform.prototype.length = function() {
    return this.buffer.len_t;
}

/**
 * Display waveform at the specified time and duration.
 * 
 * @method display
 * @param {number} t Start time of the drawing window
 * @param {number} [dur] Width of the drawing window in seconds.
 *   If not set, current window duration is kept.
 */
ldc.waveform.Waveform.prototype.display = function(t, dur) {
    var w = this.canvas.width;  // pixel width of the current window
    if (w <= 0) {
        return;  // no space to draw anything
    }
    if (dur == null) {
        if (this._spx > 0) {
            dur = w * this._spx;
        }
        else {
            return; // SPX not defined yet
        }
    }
    
    var i = 0;  // pixel number to start filling from
    var n = w;  // number of pixels to fill
    var t1 = t;       // start time of region to draw waveform for
    var t2 = t + dur; // end time of region to draw waveform for
    var x1 = 0; // start pixel number for the region to shift
    var w1 = 0; // pixel width of the region to shift
    var x2 = 0; // destination pixel number of the shifted region
    
    if (Math.round(dur / this._spx) == w) { // SPX didn't change
        var poff = Math.round(t / this._spx); // pixel offset 
        if (poff == this._poff) {
            // No need to redraw -- same windows, same size
            return;
        }
        
        var delta = poff - this._poff;
        
        if (delta > 0 && delta < w) {
            // Need only partial drawing.
            // Window is shifted to right.
            x1 = delta;
            w1 = w - delta;
            x2 = 0;
            i = w1;
            n = delta;
            t1 = (this._poff + w) * this._spx;
            t2 = t1 + n * this._spx;
        } else if (delta < 0 && -delta < w) {
            // Need only partial drawing.
            // Window is shifted to left.
            x1 = 0;
            w1 = w + delta;
            x2 = -delta;
            i = 0;
            n = -delta;
            t1 = poff * this._spx;
            t2 = this._poff * this._spx;
        } else {
            t1 = Math.round(t1 / this._spx) * this._spx;
            t2 = t1 + w * this._spx;
        }
    } else {
        this._spx = dur / w;
    }
    this._poff = Math.round(t / this._spx);
    
    // start drawing
    var ctx = this.canvas.getContext('2d');
    var h = this.canvas.height;


    if (w1 > 0) {
        // shift a region
        var imgdata = ctx.getImageData(x1, 0, w1, h);
        ctx.putImageData(imgdata, x2, 0);
    }
    ctx.clearRect(i, 0, n, h);

    // draw the ruler first
    this.drawRuler(t1, i, n, ctx);

    // draw new region
    var center = Math.round(h / 2);
    var arr = this.buffer.getSamples(t1, t2, n);
    ctx.fillRect(i, center, n, 1);
    for (var k=0; k < n; ++k, ++i) {
        var f = 2 * (k * this.buffer.channels + this.channel);
        var min = Math.round(arr[f] / 255 * h);
        var max = Math.round(arr[f+1] / 255 * h);
        ctx.fillRect(i, center-max, 1, max-min);
    }
}

/**
 * Move the waveform window to a specified location in the timeline.
 * 
 * @method moveWindow
 * @param {number} t Time offset
 * @param {String} anchor="beg" One of `beg`, `mid` or `end`.
 *   If anchor is `beg`, the window will begin at `t`. If anchor is `end`,
 *   the window will end at `t`. If anchor is `mid`, the center of the
 *   window will be calculated based on the canvas width, and it will be
 *   aligned with the center of the canvas.
 */
ldc.waveform.Waveform.prototype.moveWindow = function(t, anchor) {
    if (anchor === undefined) {
        anchor = 'beg';
    }
    if (anchor == 'beg') {
        this.display(t);
    }
    else if (this._spx > 0) {
        if (anchor == 'mid') {
            this.display(t - this.canvas.width / 2 * this._spx);
        } else if (anchor == 'end') {
            this.display(t - this.canvas.width * this._spx);
        }
    }
}


// Lengths between major ticks
var INTERVAL_SIZES = new Array(
    0.000001, 0.000002, 0.000005,
    0.00001, 0.00002, 0.00005,
    0.0001, 0.0002, 0.0005,
    0.001, 0.002, 0.005,
    0.01, 0.02, 0.05,
    0.1, 0.2, 0.5,
    1, 2, 5,
    10, 20, 30, 60,
    120, 300, 600, 1200,
    1800, 3600, 7200, 18000, 36000
);

// Number of minor intervals between two major ticks
var NUM_MINOR_INTERVALS = new Array(
    2, 2, 5,
    2, 2, 5,
    2, 2, 5,
    2, 2, 5,
    2, 2, 5,
    2, 2, 5,
    2, 2, 5,
    2, 2, 2, 2,
    2, 5, 2, 2,
    3, 2, 2, 5, 2
);

// Minimum major interval
var MIN_MAJOR_INTERVAL = 50;

// Major tick's height
var MAJOR_TICK_HEIGHT = 8;

// Minor tick's height
var MINOR_TICK_HEIGHT = 5;

// FONT size
var FONT_SIZE = 10;

// Ruler height
var RULER_HEIGHT = MAJOR_TICK_HEIGHT + FONT_SIZE + 2;

/**
 * Draw a horizontal ruler in a region defined by the parameters.
 * @method drawRuler
 * @param {number} t1 Start time offset
 * @param {number} p1 Start pixel offset
 * @param {number} n  Number of pixels to fill
 * @param {CanvasRenderingContext2D} ctx 2D canvas context for the canvas.
 *   If not given, a new instance is created.
 */
ldc.waveform.Waveform.prototype.drawRuler = function(t1, p1, n, ctx) {
    if (ctx == null) {
        ctx = this.canvas.getContext('2d');
    }
    ctx.fillRect(p1, 0, n, 1);  // base, horizontal line
    ctx.font = "" + FONT_SIZE + "px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";

    // compute number of seconds taken for 50 pixels
    var idx = goog.array.binarySearch(
        INTERVAL_SIZES, this._spx * MIN_MAJOR_INTERVAL);
    if (idx < 0) {
        idx = -idx;
    }
    var h = this.canvas.height;
    var w = this.canvas.width;
    var t2 = t1 + n * this._spx;  // end time of the region

    if (idx >= INTERVAL_SIZES.length) {
        idx = INTERVAL_SIZES.length - 1;
    }

    var major = INTERVAL_SIZES[idx]; // major inverval size
    var minor = major / NUM_MINOR_INTERVALS[idx]; // minor inverval size
    var a = Math.ceil(t1 / major) * major; // location of 1st major tick
    var b = Math.ceil(t1 / minor) * minor; // location of 1st minor tick

    var draw_minor_ticks = function(t1, t2) {
        for (var i = 0; i < (t2-t1)/minor; ++i) {
            var p = this.t2p(t1 + i * minor);
            ctx.fillRect(p, 0, 1, MINOR_TICK_HEIGHT);
        }
    }
    var draw_major_tick = function(t) {
        var p = this.t2p(t);
        ctx.fillRect(p, 0, 1, MAJOR_TICK_HEIGHT);
        ctx.clearRect(
            p - MIN_MAJOR_INTERVAL/2,
            MAJOR_TICK_HEIGHT,
            MIN_MAJOR_INTERVAL,
            RULER_HEIGHT - MAJOR_TICK_HEIGHT );
        ctx.fillText(t, p, RULER_HEIGHT);
    }

    draw_minor_ticks.call(this, b, a - minor/2);
    for (var i=0; i < (t2-a)/major; ++i) {
        var t = a + i * major;
        draw_major_tick.call(this, a + i * major);
        draw_minor_ticks.call(this, t + minor, t + major - minor/2);
    }
    draw_major_tick.call(this, a - major);
    draw_major_tick.call(this, a + i * major);
}

})();