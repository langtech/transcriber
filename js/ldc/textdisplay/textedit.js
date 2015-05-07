/**
 * @module ldc
 * @submodule textdisplay
 * @namespace textdisplay
 */
goog.provide('ldc.textdisplay.TextEdit');
goog.require('ldc.datamodel.TableRow');
goog.require('ldc.event.Event');
goog.require('ldc.waveform.WaveformSelectEvent');
goog.require('goog.dom');
goog.require('goog.events');

(function() {

/**
 * Displays Table object as a set of segmeng widgets. TextEdit requires the
 * following fields from Table.
 *
 * - offset
 * - length
 *
 * Listens on the following events.
 *
 * - TableUpdateRowEvent
 * - TableAddRowEvent
 * - TableDeleteRowEvent
 *
 * Emits the following events.
 *
 * - TableUpdateRowEvent (fired when user updates information on a segment widget)
 * - WaveformSelectEvent (fired when user focuses a segment)
 *
 * @class TextEdit
 * @constructor
 * @param {String} id Id of a div element that will contain TextEdit widget.
 * @param {Function} segWidget A widget class that is responsible for rendering
 *   a segment and processing user events about the segment.
 * @param {EventBus} [eventBus]
 * @param {Function} [segFilter] Boolean function taking a Segment object.
 */
ldc.textdisplay.TextEdit = function(id, segWidget, eventBus, segFilter) {
	this.ebus = eventBus;
	this.segWidget = segWidget;
	// The HTML element representing this object.
	this.container = goog.dom.createDom('div', {'class':'textedit'});
	goog.dom.append(goog.dom.getElement(id), this.container);

	this.rids = [];   // list of rids, sorted by offsets
	this.spans = [];  // list of {beg:v1, end:v2}, sorted by beg and then end property
	this.table = null;
	var that = this;
	segWidget.installEventListener(this.container, function(e) {
		if (that.table) {
			if (e.eventType == segWidget.EventType.CHANGE) {
				var ev = new ldc.datamodel.TableUpdateRowEvent(that, e.rid, e.data);
				eventBus.queue(ev);
			}
			else if (e.eventType == segWidget.EventType.SELECT) {
				var beg = that.table.getCell(e.rid, 'offset');
				var dur = that.table.getCell(e.rid, 'length');
				var wid = that.table.getCell(e.rid, 'waveform');
				var ev = new ldc.waveform.WaveformSelectEvent(that, beg, dur, wid, e.rid);
				eventBus.queue(ev);
			}
		}
	});

	if (segFilter) {
		this.filter = segFilter;
	}
	else {
		this.filter = function() {return true;};
	}

	if (eventBus) {
		eventBus.connect(ldc.datamodel.TableUpdateRowEvent, this);
		eventBus.connect(ldc.datamodel.TableAddRowEvent, this);
		eventBus.connect(ldc.datamodel.TableDeleteRowEvent, this);
		eventBus.connect(ldc.waveform.WaveformSelectEvent, this);
	}
}

/**
 * @method setTable
 * @param {Table} table
 */
ldc.textdisplay.TextEdit.prototype.setTable = function(table) {
	this.rids = [];
	this.spans = [];
	this.container.innerHTML = '';
	this.table = table;
	var that = this;
	table.forEach(function(row) {
		insort(that.rids, that.spans, row.rid(), row.toObj());
	}, this.filter);
	this.rids.forEach(function(rid) {
		var se = new that.segWidget(rid, table.getObj(rid));
		goog.dom.appendChild(this.container, se.dom());
	}, this);
}

/**
 * @method findSegment
 * @param {Number} rid
 * @return {Object} An instance of the segment widget.
 */
 ldc.textdisplay.TextEdit.prototype.findSegment = function(rid) {
 	if (this.table && this.table.getCell(rid, 'offset') != null) {
 		return new this.segWidget(rid, this.table.getObj(rid));
 	}
 }

/**
 * @method handleEvent
 * @param {Event} event
 */
ldc.textdisplay.TextEdit.prototype.handleEvent = function(event) {
	if (event instanceof ldc.datamodel.TableUpdateRowEvent) {
		var arg = event.args();  // update object
		var rid = arg.rid;
		var flag = arg.data.hasOwnProperty('offset') || arg.data.hasOwnProperty('length');
		if (flag) {
			this.remove_seg_(rid);
			var seg = this.table.getObj(rid);
			for (var k in arg.data)
				seg[k] = arg.data[k];
			this.add_seg_(rid, seg);
		}
		else {
			var se = this.findSegment(rid);
			se && se.update(arg.data);
		}
	}
	else if (event instanceof ldc.datamodel.TableAddRowEvent) {
		var arg = event.args();
		var obj = {
			value: function(field) {
				return arg.data[field];
			},
			rid: function() {
				return arg.rid;
			}
		};
		if (this.table != null && this.filter(obj) == false)
			return;
		this.add_seg_(arg.rid, arg.data);
		if (this.ebus != null) {
			var e = new ldc.waveform.WaveformSelectEvent(
				this, arg.data.offset, arg.data.length, arg.data.waveform, arg.rid
			);
			this.ebus.queue(e);
		}
	}
	else if (event instanceof ldc.datamodel.TableDeleteRowEvent) {
		this.remove_seg_(event.args().rid);
	}
	else if (event instanceof ldc.waveform.WaveformSelectEvent) {
		var seg = this.findSegment(event.args().rid);
		if (seg) {
			seg.focus();
		}
	}
}

/**
 * Create a new dom object for a table row specified by rid. Insert the new
 * dom object to the display.
 *
 * @method add_seg_
 * @private
 * @param {Number} rid
 * @param {Object} data Object with offset and length properties.
 */
ldc.textdisplay.TextEdit.prototype.add_seg_ = function(rid, data) {
	if (this.table) {
		var se = new this.segWidget(rid, data);
		var i = insort(this.rids, this.spans, rid, data);
		if (i + 1 < this.rids.length) {
			var rid1 = this.rids[i + 1];
			var se1 = new this.segWidget(rid1, this.table.getObj(rid1));
			goog.dom.insertSiblingBefore(se.dom(), se1.dom());
		}
		else {
			goog.dom.appendChild(this.container, se.dom());
		}
		se.focus();
	}
}

/**
 * Take the segment out of display and internal index.
 *
 * @method remove_seg_
 * @private
 * @param {Number} rid
 */
ldc.textdisplay.TextEdit.prototype.remove_seg_ = function(rid) {
	if (this.table) {
		var se = new this.segWidget(rid, null);
		var i = this.rids.indexOf(rid);
		this.rids.splice(i, 1);
		this.spans.splice(i, 1);
		goog.dom.removeNode(se.dom());
	}
}


// Returns -1, 0, or 1 respectively if a < b, a == b, or a > b.
function comp(a, b) {
	if (a < b) {
		return -1;
	}
	else if (a > b) {
		return 1;
	}
	else {
		return 0;
	}
}


// @param {Object} a
// @param {Object} b
// @return {Number} -1 (a<b), 0 (a=b), or 1 (a>b).
function comp_span(a, b) {
	var c = comp(a.beg, b.beg);
	return c == 0 ? comp(a.end, b.end) : c;
}


// @param {Array} rids Array of rids
// @param {Array} spans Array of {beg:v1, end:v2} objects
// @param {Number} rid Rid for the inserted row
// @param {Object} seg An object with offset and length properties.
// @return {Number} Insertion position.
//
// seg is a new segment to be added to the text widget. Insert its rid to
// rids, and create a span object and insert it into spans. Both rids and spans
// are kept sorted by start offset, end offset and rid in that order.
function insort(rids, spans, rid, seg) {
	var s = 0;
	var t = rids.length;
	var span = {beg:seg.offset};
	span.end = span.beg + seg.length;
	while (s < t) {
		var i = Math.floor((t + s) / 2);
		var c = comp_span(spans[i], span);
		if (c == 0)
			c = comp(rids[i], rid);
		if (c < 0)
			s = i + 1;
		else if (c > 0)
			t = i;
		else
			s = t = i;
	}
	rids.splice(s, 0, rid);
	spans.splice(s, 0, span);
	return s;
}


})();
