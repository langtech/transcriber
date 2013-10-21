(function() {

/**
 * @module ldc
 * @submodule aikuma
 * @namespace aikuma
 */

goog.provide('ldc.aikuma.SpeakerSwimLanes');

/**
 * Creates a swimlane for each unique speaker found in a set of transcription
 * segments. Constructor takes a container element inside which the created
 * swimlanes are rendered. Watches data model events to update display. The
 * following events are listened to.
 *
 *   - datamodel.TableUpdateRowEvent
 *   - datamodel.TableAddRowEvent
 *   - datamodel.TableDeleteRowEvent
 *
 * @class SpeakerSwimLanes
 * @constructor
 * @param {HTMLElement} div A div element to contain rendered swimlanes.
 * @param {event.EventBus} [eventbus]
 * @param {Function} [filter] A boolean function taking a datamodel.TableRow
 *  object. Only segments passing through this filter is considered in
 *  display. By default, all segments are considered.
 */

/**
 * Set a datamodel.Table object that contains a set of transcription segments.
 * Unique speakers are identified and swimlanes are created for them. The table
 * is expected to have certain fields described below.
 *
 * @method setTable
 * @param {datamodel.Table} table A table with the following fields:
 *    - offset
 *    - length
 *    - speaker
 *    - swimlane
 */

/**
 * Implements the event handler interface.
 *
 * @method handleEvent
 * @param {event.Event} event
 */

/**
 * Detach the object from the main application, which include unsubscribing
 * from event subscriptions.
 *
 * @method tearDown
 */

})