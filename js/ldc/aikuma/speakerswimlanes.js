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
	this.container = div;
	this.filter = filter == null ? function() {return true;} : filter;

	if (ebus) {
		this.ebus = ebus;
		ebus.connect(ldc.datamodel.TableUpdateRowEvent, this);
		ebus.connect(ldc.datamodel.TableAddRowEvent, this);
		ebus.connect(ldc.datamodel.TableDeleteRowEvent, this);
		ebus.connect(ldc.waveform.WaveformWindowEvent, this);
	}

	this.width = 100;
	this.swimlanes = {};
	this.window_beg = 0;
	this.window_dur = 0;
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
	this.container.innerHTML = '';
	Object.keys(this.swimlanes).forEach(function(spkr) {
		this.swimlanes[spkr].tearDown();
		delete this.swimlanes[spkr];
	}, this);

	var that = this;
	table.forEach(function(row) {
		var spkr = row.value('speaker');
		if (!that.swimlanes.hasOwnProperty(spkr))
			that.new_swimlane_for_speaker_(spkr);
		row.set('swimlane', that.swimlanes[spkr].id);
	}, this.filter);

	Object.keys(this.swimlanes).sort().forEach(function(spkr) {
		var sl = this.swimlanes[spkr];
		sl.setTable(table);
		sl.display(this.window_beg, this.window_dur);
	}, this);
}

/**
 * Implements the event handler interface.
 *
 * @method handleEvent
 * @param {event.Event} event
 */
ldc.aikuma.SpeakerSwimLanes.prototype.handleEvent = function(event) {
	if (event instanceof ldc.datamodel.TableUpdateRowEvent) {
	}
	else if (event instanceof ldc.datamodel.TableAddRowEvent) {
		var data = event.args().data;
		var speaker = data['speaker'];
		if (!this.swimlanes.hasOwnProperty(speaker)) {
			var sl = this.new_swimlane_for_speaker_(speaker);
			sl.display(this.window_beg, this.window_dur);
			sl.handleEvent(event);
		}
	}
	else if (event instanceof ldc.datamodel.TableDeleteRowEvent) {
	}
	else if (event instanceof ldc.waveform.WaveformWindowEvent) {
		this.window_beg = event.args().beg;
		if (event.args().dur)
			this.window_dur = event.args().dur;
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


/**
 * Set the width of the managed swimlanes.
 *
 * @method setWidth
 * @param {number} w Width in pixels.
 */
ldc.aikuma.SpeakerSwimLanes.prototype.setWidth = function(w) {
	this.width = w;
	Object.keys(this.swimlanes).forEach(function(spkr) {
		this.swimlanes[spkr].setWidth(w);
	}, this);
}


/**
 * Return a SwimLane object corresonding to the given speaker.
 *
 * @method getSwimLaneForSpeaker
 * @param {String} spkr
 */
ldc.aikuma.SpeakerSwimLanes.prototype.getSwimLaneForSpeaker = function(spkr) {
	return this.swimlanes[spkr];
}

/**
 * @method new_swimlane_for_speaker_
 * @private
 * @param {String} spkr
 */
ldc.aikuma.SpeakerSwimLanes.prototype.new_swimlane_for_speaker_ = function(spkr) {
	var that = this
	var div = document.createElement('div');
	div.style.backgroundColor = '#f5f5f0';
	div.style.width = this.width + 'px';
	this.container.appendChild(div);
	var sl = new ldc.aikuma.SwimLane(div, this.width, this.ebus, function(row) {
		return row.value('waveform') != null && row.value('speaker') == spkr;
	});
	this.swimlanes[spkr] = sl;
	return sl;
}

})();