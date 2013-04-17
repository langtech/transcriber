/**
 * @module ldc
 * @submodule textdisplay
 */
goog.provide('ldc.textdisplay.TextEdit');
goog.require('ldc.textdisplay.SegmentEdit');
goog.require('ldc.datamodel.Segment');
goog.require('ldc.event.Event');
goog.require('goog.dom');
goog.require('goog.events');

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

	var that = this;
	ldc.textdisplay.SegmentEdit.implantListener(this.container, function(update) {
		if (that.ebus) {
			var e = new ldc.event.DataUpdateEvent(that, update);
			eventBus.queue(e);
		}
	});

	if (segFilter) {
		this.filter = segFilter;
	}
	else {
		this.filter = function() {return true;}
	}
}

/**
 * @method setTable
 * @param {Table} table
 */
ldc.textdisplay.TextEdit.prototype.setTable = function(table) {
	this.table = table;
	var container = this.container;
	table.find().forEach(function(rid) {
		var segment = new ldc.datamodel.Segment(table, rid);
		var se = new ldc.textdisplay.SegmentEdit(segment);
		goog.dom.appendChild(container, se.dom());
	});
}

/**
 * @method findSegment
 * @param {rid}
 * @return {SegmentEdit}
 */
 ldc.textdisplay.TextEdit.prototype.findSegment = function(rid) {
 	var segment = new ldc.datamodel.Segment(this.table, rid);
 	return new ldc.textdisplay.SegmentEdit(segment);
 }

/**
 * @method handleEvent
 * @param {Event}
 */
ldc.textdisplay.TextEdit.prototype.handleEvent = function(event) {
	if (event.type() == ldc.event.DataUpdateEvent) {
		var u = event.args();  // update object
		var se = this.findSegment(u.rid());
		se.setText(u.get('message'));
	}
}
