/**
 * @module ldc
 * @submodule waveform
 * @namespace waveform
 */
goog.provide('ldc.waveform.WaveformCursorEvent');
goog.provide('ldc.waveform.WaveformRegionEvent');
goog.provide('ldc.waveform.WaveformWindowEvent');
goog.provide('ldc.waveform.WaveformSelectEvent');
goog.require('ldc.event.Event');

/**
 * A waveform can have a cursor that marks a position on the waveform. For
 * example, the cursor can follow the user's mouse movement, or mark where
 * the audio playback is happening currently. An object can signal this event
 * when it wants to change the cursor position. The listening objects, e.g.
 * waveform or a label widget, can update itself when receiving the event.
 *
 * @class WaveformCursorEvent
 * @constructor
 * @extends Event
 * @param {Object} source The object creating this event.
 * @param {Number} time The new position of the cursor.
 */
ldc.waveform.WaveformCursorEvent = function(source, time) {
	goog.base(this, source, time);
}
goog.inherits(ldc.waveform.WaveformCursorEvent, ldc.event.Event);
ldc.waveform.WaveformCursorEvent.type = ldc.event.Event.newTypeId();

/**
 * Returns the argument of the event.
 *
 * @method args
 * @return {Number} The position of the cursor in seconds.
 */

/**
 * A waveform can have a region that marks what user selected. Objects
 * interested in changes in the region, e.g. a change in duration of the
 * region, can subscribe to the event. For example, label widgets that
 * show the start and end times of user selection can update themselves
 * when receiving the event.
 *
 * @class WaveformRegionEvent
 * @constructor
 * @extends Event
 * @param {Object} source The object creating this event.
 * @param {Number} beg Start time of the region in seconds.
 * @param {Number} dur Duration of the region inseconds.
 * @param {Number} waveform Waveform ID.
 */
ldc.waveform.WaveformRegionEvent = function(source, beg, dur, waveform) {
	goog.base(this, source, {beg:beg, dur:dur, waveform:waveform});
}
goog.inherits(ldc.waveform.WaveformRegionEvent, ldc.event.Event);
ldc.waveform.WaveformRegionEvent.type = ldc.event.Event.newTypeId();

/**
 * Returns the argument of the event.
 *
 * @method args
 * @return {Object} Object with 3 properties:
 *
 *   - beg: start time of the region
 *   - dur: length of the region
 *   - waveform: waveform id
 */

/**
 * An event acknowledging the movement of the waveform window.
 *
 * @class WaveformWindowEvent
 * @constructor
 * @extends Event
 * @param {Object} source The object creating this event.
 * @param {Number} beg Start time.
 * @param {Number} [dur] Duration of the window.
 */
ldc.waveform.WaveformWindowEvent = function(source, beg, dur) {
	goog.base(this, source, {beg:beg, dur:dur});
}
goog.inherits(ldc.waveform.WaveformWindowEvent, ldc.event.Event);
ldc.waveform.WaveformWindowEvent.type = ldc.event.Event.newTypeId();

/**
 * Returns the argument of the event.
 *
 * @method args
 * @return {Object} Object with two properties:
 *
 *   - beg: start time of the region
 *   - dur: length of the region
 */

/**
 * Acknowledges that an item in the data model (a row in the table) has been
 * "selected".
 *
 * @class WaveformSelectEvent
 * @constructor
 * @extends Event
 * @param {Object} source The object creating this event.
 * @param {Number} beg Start time of the region in seconds.
 * @param {Number} dur Duration of the region inseconds.
 * @param {Number} waveform Waveform ID.
 * @param {Number} rid
 */
ldc.waveform.WaveformSelectEvent = function(source, beg, dur, waveform, rid) {
	goog.base(this, source, {beg:beg, dur:dur, waveform:waveform, rid:rid});
}
goog.inherits(ldc.waveform.WaveformSelectEvent, ldc.event.Event);
ldc.waveform.WaveformSelectEvent.type = ldc.event.Event.newTypeId();

/**
 * Returns the argument of the event.
 *
 * @method args
 * @return {Object} Object with the following properties:
 *
 *   - beg: start time of the region
 *   - dur: length of the region
 *   - waveform: waveform id
 *   - rid: rid for a Table object associated with this event
 */
