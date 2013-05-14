(function() {

/**
 * @module ldc
 * @submodule textdisplay
 * @namespace textdisplay
 */
goog.provide('ldc.textdisplay.TextEdit');
goog.require('ldc.textdisplay.SegmentEdit');
goog.require('ldc.datamodel.Segment');
goog.require('ldc.event.Event');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.structs.AvlTree');

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

function comp_seg(a, b) {
	var c = comp(a.value('start'), b.value('start'));
	if (c == 0) {
		c == comp(a.value('end'), b.value('end'));
		return c == 0 ? comp(a.rid(), b.rid()) : c;
	}
	else {
		return c;
	}
}

/**
 * @class TextEdit
 * @constructor
 * @param {String} id Id of a div element.
 * @param {EventBus} [eventBus]
 * @param {Function} [segFilter] Boolean function taking a Segment object.
 */
ldc.textdisplay.TextEdit = function(id, eventBus, segFilter) {
	this.ebus = eventBus;
	this.container = goog.dom.createDom('div', {'class':'textedit'});
	goog.dom.append(goog.dom.getElement(id), this.container);

	this.rid2se = new goog.structs.AvlTree(comp_seg);
	this.table = null;
	var that = this;
	ldc.textdisplay.SegmentEdit.implantListener(this.container, function(rid, update) {
		if (that.table) {
			var e = new ldc.datamodel.TableUpdateRowEvent(that, rid, update);
			eventBus.queue(e);
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
		var segment = new ldc.datamodel.Segment(table, rid);
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
 	var segment = new ldc.datamodel.Segment(this.table, rid);
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

ldc.textdisplay.TextEdit.prototype.add_seg_ = function(rid, before) {
	if (this.table) {
		var seg = new ldc.datamodel.Segment(this.table, rid);
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

})();
