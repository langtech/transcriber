(function() {

/**
 * @module ldc
 * @submodule aikuma
 * @namespace aikuma
 */

goog.provide('ldc.aikuma.SwimLane');
goog.require('ldc.datamodel.TableAddRowEvent');
goog.require('ldc.datamodel.TableDeleteRowEvent');
goog.require('ldc.datamodel.TableUpdateRowEvent');
goog.require('ldc.waveform.WaveformWindowEvent');
goog.require('ldc.aikuma.SwimLaneRegionEvent');
goog.require('goog.dom');
goog.require('goog.events');

/**
Display for Aikuma respeaking segments.

The respeaking segments are passed along with other segments in the table.
A filter is used to select only relevant segments. Filter is a boolean
function taking an ldc.datamodel.TableRow object.

@class SwimLane
@constructor
@param {HTMLElement} div A div element to wrap to display the widget.
@param {Number} [width=100] Width of the widget.
@param {datamodel.Table} table A datamodel.Table object with these fields:

  - offset: start offset of the segment in second
  - length: length of the segment in second
  - mapoff: start offset of a region on a respeaking
  - maplen: length of the respeaking region
  - waveform: null or a numeric ID of the waveform on which the segment is on
  - any other fields required by filter

@param {Function} [filter] Boolean function taking an ldc.datamodel.TableRow
  object. By default, the function is defined as follows:

      row.value('swimlane') == this.id

*/
ldc.aikuma.SwimLane = function(div, width, table, filter) {
	this.div = div;
	var that = this;
	this.filter = filter != null ? filter : function(seg) {
		return seg.value('swimlane') == that.id;
	};
	this.width = width == null ? 100 : width;

	this.segs = new Swimlane('anyone');

	/**
     * Unique ID of the SwimLane.
     * @property {Number} id
     * @readonly
     */
	this.id = counter++;

	this.div.style.position = 'relative';
	this.setup_ui_events_();

	this.beg = 0;
	this.dur = 0;
	this.selected = null;  // selected region

	if (this.ebus) {
		this.ebus.connect(ldc.waveform.WaveformWindowEvent, this);
		this.ebus.connect(ldc.waveform.WaveformSelectEvent, this);
		this.ebus.connect(ldc.aikuma.SwimLaneRegionEvent, this);
	}

	/**
	Signals that a segment has been selected.
	@event segmentSelected
	@param {number} rid
	@param {number} offset
	@param {number} length
	*/
	this.segmentSelected = new ldc.event.Signal;

	this.setTable(table, filter);
}

var counter = 0;


/**
 * Display specified region.
 *
 * @method display
 * @param {Number} beg
 * @param {Number} dur
 */
ldc.aikuma.SwimLane.prototype.display = function(beg, dur) {
	this.beg = beg;
	if (dur != null) {
		this.dur = dur;
	}

	// clear the drawing area
	if (this.html != null) {
		goog.dom.removeNode(this.html);
	}
	this.html = goog.dom.createElement('div');
	goog.dom.appendChild(this.div, this.html);
	this.html.style.position = 'relative';
	this.html.style.width = this.width + 'px';

	var that = this;

	this.segs.iterRange(this.beg, this.beg + this.dur, function(obj) {
		var el = that.render_segment_(obj.offset, obj.length);
		if (el) {
			el.rid = obj.rid;
			obj.div = el;
		}
	});
}

/**
 * Renders a segment.
 *
 * @method render_segment_
 * @private
 * @param {Number} beg
 * @param {Number} dur
 * @return {HTMLElement}
 */
ldc.aikuma.SwimLane.prototype.render_segment_ = function(beg, dur) {
	if (beg < this.beg + this.dur && beg + dur > this.beg &&
		this.width > 0 && this.dur > 0) {
		var r = this.width / this.dur; // pixel-time ratio
		var a = Math.max(this.beg, beg);
		var b = Math.min(this.beg + this.dur, beg + dur);
		a = (a - this.beg) * r;
		b = (b - this.beg) * r;
		a = Math.round(a);
		b = Math.round(b);

		var div = goog.dom.createDom('div', {class:'aikuma-swimlane-segment'});
		goog.dom.appendChild(this.html, div);
		div.style.position = 'absolute';
		div.style.left = a + 'px';
		div.style.boxSizing = 'boder-box';
		var width = b - a;
		if (this.beg > beg) {
			div.className = div.className + ' aikuma-swimlane-segment-right';
		}
		if (this.beg + this.dur < beg + dur) {
			div.className = div.className + ' aikuma-swimlane-segment-left';
		}
		div.style.width = width + 'px';
		return div;
	}
}

/**
Set the data model and reset the display.
@method setTable
@param {datamodel.Table} table A Table object for Aikuma application.
  The table should have 2 numeric columns: `offset` and `length`.
  Offset stores the start time of segments, and length is for their
  size. Both should be in seconds.
@param {function} [filter] A boolean function taking a {{#crossLink
  "datamodel.TableRow"}}{{/crossLink}} object.
*/
ldc.aikuma.SwimLane.prototype.setTable = function(table, filter) {
	if (table == null)
		return;
	if (filter)
		this.filter = filter;

	this.table = table;

	this.segs.clear();

	var that = this;
	table.forEach(function(trow) {
		that.segs.addSegment(trow.rid(), trow.value('offset'), trow.value('length'), {
			mapoff: trow.value('mapoff'),
			maplen: trow.value('maplen'),
			waveform: trow.value('waveform')
		});
	}, this.filter);

	this.display(this.beg, this.dur);

	this.table.rowAdded.connect(this, 'handleRowAdded');
	this.table.rowDeleted.connect(this, 'handleRowDeleted');
	this.table.rowUpdated.connect(this, 'handleRowUpdated');
}

/**
 * Set the width of the widget.
 *
 * @method setWidth
 * @param {Number} width
 */
ldc.aikuma.SwimLane.prototype.setWidth = function(width) {
	this.html.style.width = width + "px";
	this.display(this.beg, this.dur);
}

/**
 * EventBus event handler.
 *
 * @method handleEvent
 */
ldc.aikuma.SwimLane.prototype.handleEvent = function(e) {
	if (e instanceof ldc.datamodel.TableAddRowEvent) {
		var a = e.args();
		// emulate a TableRow instance
		var table_row_object = {
			value: function(k) {return a.data[k]}
		};
		if (this.filter(table_row_object)) {
			if (this.segs.addSegment(a.rid, a.data.offset, a.data.length)) {
				var div = this.render_segment_(a.data.offset, a.data.length);
				if (div) {
					div.rid = a.rid;
					this.segs.getByRid(a.rid).div = div;
				}
			}
		}
	}
	else if (e instanceof ldc.datamodel.TableDeleteRowEvent) {
		if (this.segs.removeSegmentByRid(e.args().rid))
			this.display(this.beg, this.dur);
	}
	else if (e instanceof ldc.datamodel.TableUpdateRowEvent) {
		var a = e.args();
		var seg = this.segs.getByRid(a.rid);
		if (seg) {
			this.segs.removeSegmentByRid(a.rid);
			if (a.data.offset)
				seg.offset = a.data.offset;
			if (a.data.length)
				seg.length = a.data.length;
			if (this.segs.addSegment(a.rid, seg.offset, seg.length, seg.user_data)) {
				var div = this.render_segment_(seg.offset, seg.length)
				if (div) {
					div.rid = a.rid;
					this.segs.getByRid(a.rid).div = div;
				}
			}
		}
	}
	else if (e instanceof ldc.waveform.WaveformWindowEvent) {
		this.display(e.args().beg, e.args().dur);
	}
	else if (e instanceof ldc.waveform.WaveformSelectEvent) {
		if (this.selected != null)
			unselect_seg(this.selected);
		var obj = this.segs.getByRid(e.args().rid);
		if (obj)
			select_seg(this.selected = obj.div);
	}
	else if (e instanceof ldc.aikuma.SwimLaneRegionEvent) {
		if (this.selected != null) {
			unselect_seg(this.selected);
			this.selected = null;
		}
	}
}


/**
Slot handling {{#crossLink "datamodel.Table/rowAdded:event"}}{{/crossLink}}
signal.
@method handleRowAdded
@param {object} param An object emitted by {{#crossLink
  "datamodel.Table/rowAdded:event"}}{{/crossLink}} signal.
*/
ldc.aikuma.SwimLane.prototype.handleRowAdded = function(param) {
	var table_row_emu = {
		value: function(k) {return param.row[k]}
	};
	if (this.filter(table_row_emu)) {
		if (this.segs.addSegment(param.rid, param.row.offset, param.row.length)) {
			var div = this.render_segment_(param.row.offset, param.row.length);
			if (div) {
				div.rid = param.rid;
				this.segs.getByRid(param.rid).div = div;
			}
		}
	}
}


/**
Slot handling {{#crossLink "datamodel.Table/rowDeleted:event"}}{{/crossLink}}
signal.
@method handleRowDeleted
@param {object} param An object emitted by {{#crossLink
  "datamodel.Table/rowDeleted:event"}}{{/crossLink}} signal.
*/
ldc.aikuma.SwimLane.prototype.handleRowDeleted = function(param) {
	if (this.segs.removeSegmentByRid(param.rid))
		this.display(this.beg, this.dur);
}


/**
Slot handling {{#crossLink "datamodel.Table/rowUpdated:event"}}{{/crossLink}}
signal.
@method handleRowUpdated
@param {object} param An object emitted by {{#crossLink
  "datamodel.Table/rowUpdated:event"}}{{/crossLink}} signal.
*/
ldc.aikuma.SwimLane.prototype.handleRowUpdated = function(param) {
	if (!param.newRow.hasOwnProperty('offset') &&
		!param.newRow.hasOwnProperty('length'))
		return;

	var seg = this.segs.getByRid(param.rid);
	if (seg == null)
		return;

	this.segs.removeSegmentByRid(param.rid);
	if (param.newRow.offset)
		seg.offset = param.newRow.offset;
	if (param.newRow.length)
		seg.length = param.newRow.length;
	if (this.segs.addSegment(param.rid, seg.offset, seg.length, seg.user_data)) {
		var div = this.render_segment_(seg.offset, seg.length)
		if (div) {
			div.dir = param.rid;
			this.segs.getByRid(param.rid).div = div;
		}
	}
}


/**
 * Disconnect event handlers from event bus and browser window objects.
 * Call this method before removing the RichWaveform object.
 *
 * @method tearDown
 */
ldc.aikuma.SwimLane.prototype.tearDown = function(e) {
	this.table.rowAdded.disconnect(this);
	this.table.rowDeleted.disconnect(this);
	this.table.rowUpdated.disconnect(this);
	if (this.ebus) {
		this.ebus.disconnect(ldc.datamodel.TableAddRowEvent, this);
		this.ebus.disconnect(ldc.datamodel.TableDeleteRowEvent, this);
		this.ebus.disconnect(ldc.datamodel.TableUpdateRowEvent, this);
		this.ebus.disconnect(ldc.waveform.WaveformWindowEvent, this);
		this.ebus.disconnect(ldc.waveform.WaveformSelectEvent, this);
		this.ebus.disconnect(ldc.aikuma.SwimLaneRegionEvent, this);
	}
	goog.events.unlisten(this.div, 'click', this.handle_ui_events_);
}


ldc.aikuma.SwimLane.prototype.setup_ui_events_ = function() {
	goog.events.listen(this.div, 'click', this.handle_ui_events_, false, this);
}

ldc.aikuma.SwimLane.prototype.handle_ui_events_ = function(e) {
	if (e.target.rid != null) {
		var seg = this.segs.getByRid(e.target.rid);
		var mapoff, maplen, wf;
		if (seg.user_data) {
			mapoff = seg.user_data.mapoff;
			maplen = seg.user_data.maplen;
			wf = seg.user_data.waveform;
		}
		else {
			mapoff = seg.offset;
			maplen = seg.length;
			wf = null;
		}
		if (this.selected != null) {
			unselect_seg(this.selected);
		}
		select_seg(this.selected = e.target);
		this.segmentSelected.emit({
			rid: seg.rid(),
			offset: seg.offset,
			length: seg.length
		});
		if (this.ebus != null) {
			this.ebus.queue(new ldc.aikuma.SwimLaneRegionEvent(this, this.id, {
				offset: seg.offset,
				length: seg.length
			}, {
				offset: mapoff,
				length: maplen
			}));
			var e;
			this.ebus.queue(e);
			if (wf != null)
				e = new ldc.waveform.WaveformSelectEvent(this, seg.offset, seg.length, wf, seg.rid);
			else
				e = new ldc.waveform.WaveformRegionEvent(this, seg.offset, seg.length);
			this.ebus.queue(e);
		}
	}
}

function select_seg(el) {
	el.className += ' aikuma-swimlane-selected-segment';
}

function unselect_seg(el) {
	var a = el.className.split(/\s+/);
	var i = a.indexOf('aikuma-swimlane-selected-segment');
	while (i >= 0) {
		a.splice(i, 1);
		i = a.indexOf('aikuma-swimlane-selected-segment');
	}
	el.className = a.join(' ');
}




// Swimlane class
function Swimlane(speaker) {
	this.index = {};
	this.speaker = speaker;
	this.segments = new SortedObjectArray(['offset', 'length']);
}

// return true if successful, false otherwise
Swimlane.prototype.addSegment = function(rid, offset, length, userData) {
	var obj = {
		rid: rid,
		offset: offset,
		length: length,
		user_data: userData
	};
	this.index[rid] = obj;

	// make sure that there is no overlap
	var i = this.segments.add(obj);
	var obj1 = this.segments.get(i-1);
	var obj2 = this.segments.get(i+1);
	if (obj1 && obj1.offset + obj1.length - offset > 0.000001) {
		this.segments.removeByIndex(i);
		return false;
	}
	else if (obj2 && offset + length - obj2.offset > 0.000001) {
		this.segments.removeByIndex(i);
		return false;
	}
	else {
		return true;
	}
}

Swimlane.prototype.clear = function() {
	this.segments.clear();
	this.index = {};
}

Swimlane.prototype.removeSegmentByRid = function(rid) {
	var obj = this.index[rid];
	if (obj != null) {
		this.segments.remove(obj);
		delete obj['rid'];
		return true;
	}
	else {
		return false;
	}
}

Swimlane.prototype.removeSegmentByOffset = function(offset, length) {
	var i = this.segments.remove({offset:offset, length:length});
	return i != null;  // true if an element was removed
}

Swimlane.prototype.getByRid = function(rid) {
	return this.index[rid];
}

Swimlane.prototype.iterRange = function(beg, end, callback) {
	var s1 = this.segments.indexOf({offset:beg, length:0});
	var s2 = this.segments.indexOf({offset:end, length:0});
	var x1 = this.segments.get(s1.index - 1);
	var x2 = this.segments.get(s2.index);
	var i = s1.index;
	var j = s2.index;
	if (x1 && x1.offset + x1.length > beg)
		i = i - 1;
	if (x2 == null || x2.offset > end)
		j = j - 1;
	for (var k = i; k <= j; ++k) {
		callback(this.segments.get(k));
	}
}

// compare object o1 and o2 by properties listed in keys.
// return -1 if o1 < o2, 1 if o1 > o2, 0 otherwise.
function comp_obj(o1, o2, keys) {
	for (var i=0; i < keys.length; ++i) {
		if (o1[keys[i]] < o2[keys[i]]) {
			return -1;
		}
		else if (o1[keys[i]] > o2[keys[i]]) {
			return 1;
		}
	}
	return 0;
}

// insertion O(log(n))
// deletion  O(n)
// search    O(n)
function SortedObjectArray(keys) {
	this.array = [];
	this.keys = keys;
}

SortedObjectArray.prototype.add = function(obj) {
	var i = this.indexOf_(obj, 0, this.array.length - 1);
	this.array.splice(i, 0, obj);
	return i;
}

SortedObjectArray.prototype.remove = function(obj) {
	var s = this.indexOf(obj);
	if (s.match) {
		this.array.splice(s.index, 1);
		return s.index;
	}
	else {
		return null;
	}
}

SortedObjectArray.prototype.removeByIndex = function(i) {
	if (i >= 0 && i < this.array.length)
		this.array.splice(i, 1);
}

SortedObjectArray.prototype.get = function(i) {
	return this.array[i];
}

SortedObjectArray.prototype.size = function() {
	return this.array.length;
}

SortedObjectArray.prototype.clear = function() {
	this.array = [];
}

SortedObjectArray.prototype.indexOf = function(obj) {
	if (obj == null || !obj.hasOwnProperty('offset') || !obj.hasOwnProperty('length'))
		return;
	var i = this.indexOf_(obj, 0, this.array.length - 1);
	var match = false;
	if (i >= 0 && i < this.array.length)
		match = comp_obj(obj, this.array[i], this.keys) == 0;
	return {
		index: i,
		match: match
	};
}

SortedObjectArray.prototype.indexOf_ = function(obj, beg, end) {
	if (beg > end)
		return beg;
	var m = Math.round((beg + end) / 2);
	var c = comp_obj(this.array[m], obj, this.keys);
	if (c < 0) {
		return this.indexOf_(obj, m+1, end);
	}
	else if (c > 0) {
		return this.indexOf_(obj, beg, m-1);
	}
	else {
		return m;
	}
}

})();
