(function() {

/**
 * @module ldc
 * @submodule textdisplay
 * @namespace textdisplay
 */
goog.provide('ldc.textdisplay.TextEdit');
goog.require('ldc.textdisplay.SegmentEdit');
goog.require('ldc.datamodel.TableRow');
goog.require('ldc.event.Event');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.structs.AvlTree');

/**
 * Displays Table object as a set of SegmentEdit. TextEdit requires the
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
 * - TableUpdateRowEvent (fired when user updates SegmentEdit)
 *
 * @class TextEdit
 * @constructor
 * @param {String} id Id of a div element that will contain TextEdit widget.
 * @param {EventBus} [eventBus]
 * @param {Function} [segFilter] Boolean function taking a Segment object.
 */
ldc.textdisplay.TextEdit = function(id, eventBus, segFilter) {
	this.ebus = eventBus;
	// The HTML element representing this object.
	this.container = goog.dom.createDom('div', {'class':'textedit'});
	goog.dom.append(goog.dom.getElement(id), this.container);

	// Rid-to-SegmentEdit index. This is a self-balancing binary search tree.
	// The helper function comp_seg is used to make segments orderd by start
	// and end offsets.
	this.rid2se = new goog.structs.AvlTree(comp_seg);
	this.table = null;
	var that = this;
	ldc.textdisplay.SegmentEdit.installEventListener(this.container, function(e) {
		if (that.table) {
			if (e.eventType == ldc.textdisplay.SegmentEdit.EventType.CHANGE) {
				var ev = new ldc.datamodel.TableUpdateRowEvent(that, e.rid, e.data);
				eventBus.queue(ev);
			}
			else if (e.eventType == ldc.textdisplay.SegmentEdit.EventType.SELECT) {
				var beg = that.table.getCell(e.rid, 'offset');
				var dur = that.table.getCell(e.rid, 'length');
				var ev = new ldc.waveform.WaveformRegionEvent(that, beg, dur);
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
	}
}

/**
 * @method setTable
 * @param {Table} table
 */
ldc.textdisplay.TextEdit.prototype.setTable = function(table) {
	this.table = table;
	var that = this;
	table.find().forEach(function(rid) {
		var segment = new ldc.datamodel.TableRow(table, rid);
		var se = new ldc.textdisplay.SegmentEdit(segment);
		goog.dom.appendChild(that.container, se.dom());
		that.rid2se.add(segment);
	});
}

/**
 * @method findSegment
 * @param {Number} rid
 * @return {SegmentEdit}
 */
 ldc.textdisplay.TextEdit.prototype.findSegment = function(rid) {
 	var segment = new ldc.datamodel.TableRow(this.table, rid);
 	return new ldc.textdisplay.SegmentEdit(segment);
 }

/**
 * @method handleEvent
 * @param {Event} event
 */
ldc.textdisplay.TextEdit.prototype.handleEvent = function(event) {
	if (event.constructor == ldc.datamodel.TableUpdateRowEvent) {
		var arg = event.args();  // update object
		var se = this.findSegment(arg.rid);
		if (se) {
			se.setText(arg.data.message);
		}
	}
	else if (event.constructor == ldc.datamodel.TableAddRowEvent) {
		var arg = event.args();
		var smax = this.rid2se.getMaximum();
		var s = {
			value: function(k) { return arg.data[k]; },
			rid: function() { return arg.rid; }
		};
		if (comp_seg(s, smax) < 0) {
			var before = null;
			this.rid2se.inOrderTraverse(function(x) {
				var se = new ldc.textdisplay.SegmentEdit(x);
				before = se.dom();
				return true;
			}, s);
			this.add_seg_(arg.rid, before);
		}
		else {
			this.add_seg_(arg.rid);
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
 * @param {HTMLElement} before The new dom object for the rid is inserted
 *   before this element.
 */
ldc.textdisplay.TextEdit.prototype.add_seg_ = function(rid, before) {
	if (this.table) {
		var seg = new ldc.datamodel.TableRow(this.table, rid);
		var se = new ldc.textdisplay.SegmentEdit(seg);
		if (before) {
			goog.dom.insertSiblingBefore(se.dom(), before);
		}
		else {
			goog.dom.appendChild(this.container, se.dom());
		}
		this.rid2se.add(seg);
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

// Comparison function for Segment objects. Comparison is done on start and
// end offsets. -1, 0, or 1 is returned respectively if a precedes b, a and b
// span the same region, or b precedes a.
function comp_seg(a, b) {
	var s1 = a.value('offset');
	var s2 = b.value('offset');
	var c = comp(s1, s2);
	if (c == 0) {
		c == comp(s1 + a.value('length'), s2 + b.value('length'));
		return c == 0 ? comp(a.rid(), b.rid()) : c;
	}
	else {
		return c;
	}
}


})();
