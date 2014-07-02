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
Container of {{#crossLink "aikuma.SwimLane"}}{{/crossLink}} objects. It
creates a swimlane for each unique speaker found in the
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
	if (table == null)
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
}


/**
Slot for handling {{#crossLink "datamodel.Table/rowAdded:event"}}{{/crossLink}}
signal.
@method handleRowAdded
@param {object} param
  @param {number} rid
  @param {object} row Object representation of a table row.
*/
ldc.aikuma.SwimLaneStack.prototype.handleRowAdded = function(param) {
	var row_emu = {
		value: function(k) {return param.row[k]}
	};
	if (!this.filter(row_emu))
		return;
	var speaker = param.row.speaker;
	var sl = this.swimlanes[speaker];
	if (!sl)
		sl = this.new_swimlane_for_speaker_(speaker);
}


/**
Slot for handling {{#crossLink "datamodel.Table/rowDeleted:event"}}
{{/crossLink}} signal.
@method handleRowDeleted
@param {object} param
  @param {number} rid
*/
ldc.aikuma.SwimLaneStack.prototype.handleRowDeleted = function(param) {
	Object.keys(this.swimlanes).forEach(function(k) {
		this.swimlanes[k].handleRowDeleted(param);
	}, this);
}


/**
Slot for handling {{#crossLink "datamodel.Table/rowUpdated:event"}}
{{/crossLink}} signal.
@method handleRowUpdated
@param {object} param
  @param {number} rid
  @param {object} oldRow Object representation of the table row before update.
  @param {object} newRow Object representation of the table row after update.
*/
ldc.aikuma.SwimLaneStack.prototype.handleRowUpdated = function(param) {
	var row_emu = {
		value: function(k) {return param.oldRow[k]}
	};
	if (!this.filter(row_emu))
		return;
	var speaker = param.oldRow.speaker;
	var sl = this.swimlanes[speaker];
	if (sl)
		sl.handleRowUpdated(param);

	if (param.newRow.speaker != speaker) {
		sl = this.swimlanes[param.newRow.speaker];
		if (sl)
			sl.handleRowUpdated(param);
		else
			this.handleRowAdded({rid:param.rid, row:param.newRow});
	}
}

/**
Handle the {{#crossLink "aikuma.SwimLane/segmentSelected:event"}}
{{/crossLink}} signal.

@method handleSegmentSelected
@param {object} param
  @param {number} param.rid
  @param {number} param.offset
  @param {number} param.length
  @param {number} param.swimlane_id
*/
ldc.aikuma.SwimLaneStack.prototype.handleSegmentSelected = function(param) {
	Object.keys(this.swimlanes).forEach(function(spkr) {
		var sl = this.swimlanes[spkr];
		if (sl.id != param.swimlane_id)
			sl.clearSelection();
	}, this);
	this.segmentSelected.emit({
		rid: param.rid,
		offset: param.offset,
		length: param.length
	});
}


/**
Detach the object from the main application.

@method tearDown
*/
ldc.aikuma.SwimLaneStack.prototype.tearDown = function() {
	if (this.table)
		this.table.rowAdded.disconnect(this);
	Object.keys(this.swimlanes).forEach(function(spkr) {
		this.swimlanes[spkr].segmentSelected.disconnect(this);
	}, this);
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
		this.swimlanes[spkr].setWidth(this.width);
		this.swimlanes[spkr].display();
	}, this);
}


ldc.aikuma.SwimLaneStack.prototype.display = function(beg, dur) {
	if (beg != null)
		this.window_beg = beg;
	if (dur != null)
		this.window_dur = dur;

	Object.keys(this.swimlanes).forEach(function(spkr) {
		this.swimlanes[spkr].display(this.window_beg, this.window_dur);
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
		return that.filter(row) && row.value('speaker') == spkr;
	});
	this.swimlanes[spkr] = sl;
	sl.segmentSelected.connect(this, 'handleSegmentSelected');
	sl.display(this.window_beg, this.window_dur);
	return sl;
}


})();