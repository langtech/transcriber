(function() {

/**
 * @module ldc
 * @submodule aikuma
 * @namespace aikuma
 */

goog.provide('ldc.aikuma.SpeakerSwimLanes');
goog.require('ldc.datamodel.TableUpdateRowEvent');
goog.require('ldc.datamodel.TableAddRowEvent');
goog.require('ldc.datamodel.TableDeleteRowEvent');

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
 * @param {event.EventBus} [ebus]
 * @param {Function} [filter] A boolean function taking a datamodel.TableRow
 *  object. Only segments passing through this filter is considered in
 *  display. By default, all segments are considered.
 */
ldc.aikuma.SpeakerSwimLanes = function(div, ebus, filter) {
	div.innerHTML = '<p>speaker swimlanes go here</p>';

	this.filter = filter;

	if (ebus) {
		this.ebus = ebus;
		ebus.connect(ldc.datamodel.TableUpdateRowEvent, this);
		ebus.connect(ldc.datamodel.TableAddRowEvent, this);
		ebus.connect(ldc.datamodel.TableDeleteRowEvent, this);
	}

	this.swimlanes = {};
}


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
ldc.aikuma.SpeakerSwimLanes.prototype.setTable = function(table) {
	table.forEach(function(row) {
		console.log(row.value('offset') + ' ' + row.value('length'));
	}, this.filter);
}

/**
 * Implements the event handler interface.
 *
 * @method handleEvent
 * @param {event.Event} event
 */
ldc.aikuma.SpeakerSwimLanes.prototype.handleEvent = function(event) {
	if (event instanceof ldc.datamodel.TableUpdateRowEvent) {
		var update = event.args();
		//this.add_segment_()
		console.log(update.data);
	}
	else if (event instanceof ldc.datamodel.TableAddRowEvent) {
		var data = event.args().data;
		var speaker = data['speaker'];
		if (!this.swimlanes.hasOwnProperty(speaker)) {
			var sl = new ldc.aikuma.SwimLane(div, null, this.ebus,
				function(row) {
					return row.value('speaker') == speaker;
				}
			);
			this.swimlanes[speaker] = sl;
		}
		var end = beg + data['length'];
		console.log('add ' + data['speaker'] + ' ' + data['offset'] + ' ' + data['length']);
	}
	else if (event instanceof ldc.datamodel.TableDeleteRowEvent) {
		console.log('delete');
	}
}

/**
 * Detach the object from the main application, which include unsubscribing
 * from event subscriptions.
 *
 * @method tearDown
 */
ldc.aikuma.SpeakerSwimLanes.prototype.tearDown = function() {
	if (this.ebus) {
		this.ebus.disconnect(ldc.datamodel.TableUpdateRowEvent, this);
		this.ebus.disconnect(ldc.datamodel.TableAddRowEvent, this);
		this.ebus.disconnect(ldc.datamodel.Table.TableDeleteRowEvent, this);
	}
}

})();