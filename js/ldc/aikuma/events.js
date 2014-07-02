(function() {

/**
 * @module ldc
 * @submodule aikuma
 * @namespace aikima
 */
goog.provide('ldc.aikuma.SwimLaneRegionEvent');
goog.require('ldc.event.Event');

/**
 * Signals that a region of a SwimLane has been clicked on.
 *
 * @class SwimLaneRegionEvent
 * @extends event.Event
 * @constructor
 * @param {Object} source Object that is the source of the event.
 * @param {Number} slid SwimLane ID.
 * @param {Object} region Object with two properties: offset, length.
 *   Specifies the region on the original recording.
 * @param {Object} map Object with two properties: offset, length.
 *   Specifies the region on the respeaking.
 */
ldc.aikuma.SwimLaneRegionEvent = function(source, slid, region, map) {
	goog.base(this, source, {id:slid, region:region, map:map});
}
goog.inherits(ldc.aikuma.SwimLaneRegionEvent, ldc.event.Event);
ldc.aikuma.SwimLaneRegionEvent.type = ldc.event.Event.newTypeId();

/**
 * Returns the argument of the event.
 *
 * @method args
 * @return {Object} Object with the following properties:
 *
 *   - id: SwimLane ID.
 *   - region: Object with two properties: offset, length.
 *     Specifies a region on the original recording.
 *   - map: Object with two properties: offset, length.
 *     Specifies a region on the respeaking.
 */


})();