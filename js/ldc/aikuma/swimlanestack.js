(function() {

/**
@module ldc
@submodule aikuma
@namespace aikuma
*/

goog.provide('ldc.aikuma.SwimLaneStack');
goog.require('ldc.datamodel.TableUpdateRowEvent');
goog.require('ldc.datamodel.TableAddRowEvent');
goog.require('ldc.datamodel.TableDeleteRowEvent');

/**
Container of {{#crossLink "aikuma.SwimLane"}}{{/crossLink}} object. It creates
a swimlane for each unique speaker found in the
{{#crossLink "datamodel.Table"}}table{{/crossLink}}. Constructor takes a
container element inside which the created swimlanes are placed.

@class SwimLaneStack
@constructor
@param {HTMLElement} div The container div element.
@param {datamodel.Table} [table] Optional {{#crossLink "datamodel.Table"}}
  {{/crossLink}} object, which can be set using {{#crossLink
  "aikuma.SwimLaneStack/setTable:method"}}setTable{{/crossLink}} method as
  well.
@param {Function} [filter] A boolean function taking a {{#crossLink
  "datamodel.TableRow"}}{{/crossLink}} object. Only rows passing this filter
  is considered. If not specified, all rows are considered.
*/
ldc.aikuma.SwimLaneStack = function(div, table, filter) {
	this.container = div;
	this.filter = filter == null ? function() {return true} : filter;

	this.width = 100;
	this.swimlanes = {};
	this.window_beg = 0;
	this.window_dur = 0;

	this.setTable(table);

	/**
	Signals that a segment on a swimlane is selectged.
	@event segmentSelected
	@param {number} rid Row ID of the selected segment.
	@param {number} offset Start offset of the segment.
	@param {number} length Length of the segment.
	*/
	this.segmentSelected = new ldc.event.Signal;
}


/**
Set a datamodel.Table object that contains a set of transcription segments.
Unique speakers are identified and swimlanes are created for them. The table
is expected to have certain fields described below.

@method setTable
@param {datamodel.Table} table A table with the following fields:
  - offset
  - length
  - speaker
  - swimlane
*/
ldc.aikuma.SwimLaneStack.prototype.setTable = function(table) {
	if (table == null);
		return;
	this.table = table;
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

	table.rowAdded.connect(this, 'handleRowAdded');
}


/**
 * @method new_swimlane_for_speaker_
 * @private
 * @param {String} spkr
 */
ldc.aikuma.SwimLaneStack.prototype.new_swimlane_for_speaker_ = function(spkr) {
	var that = this;
	var div = document.createElement('div');
	div.style.backgroundColor = '#f5f5f0';
	div.style.width = this.width + 'px';
	this.container.appendChild(div);
	var sl = new ldc.aikuma.SwimLane(div, this.width, this.table, function(row) {
		return row.value('waveform') != null && row.value('speaker') == spkr;
	});
	this.swimlanes[spkr] = sl;
	sl.segmentSelected.connect(this, 'selectSegment');
	return sl;
}


/**
 * Implements the event handler interface.
 *
 * @method handleEvent
 * @param {event.Event} event
 */
ldc.aikuma.SwimLaneStack.prototype.handleEvent = function(event) {
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
Slot for handling {{#crossLink "datamodel.Table/rowAdded:event"}}{{/crossLink}}
signal.
@method handleRowAdded
@param {object} param Object emitted by the signal.
*/
ldc.aikuma.SwimLaneStack.prototype.handleRowAdded = function(param) {
	var row_emu = {
		value: function(k) {return param.row[k]}
	};
	if (!this.filter(row_emu))
		return;
	console.log(param.row);
	console.log(this.window_dur);
	var speaker = param.row.speaker;
	if (!this.swimlanes.hasOwnProperty(speaker)) {
		var sl = this.new_swimlane_for_speaker_(speaker);
		sl.display(this.window_beg, this.window_dur);
	}
}


/**
Slot for handling the {{#crossLink "aikuma.SwimLane/segmentSelected:event"}}
{{//crossLink}} signal.

@method selectSegment
@param {object} param Object emitted by the signal.
*/
ldc.aikuma.SwimLaneStack.prototype.selectSegment = function(param) {
	console.log('select segment');
	console.log(param);
}


/**
Detach the object from the main application.

@method tearDown
*/
ldc.aikuma.SwimLaneStack.prototype.tearDown = function() {
	if (this.table)
		this.table.rowAdded.disconnect(this);
}


/**
 * Set the width of the managed swimlanes.
 *
 * @method setWidth
 * @param {number} w Width in pixels.
 */
ldc.aikuma.SwimLaneStack.prototype.setWidth = function(w) {
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
ldc.aikuma.SwimLaneStack.prototype.getSwimLaneForSpeaker = function(spkr) {
	return this.swimlanes[spkr];
}

})();