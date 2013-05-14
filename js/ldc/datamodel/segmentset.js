/**
 * @module ldc
 * @submodule datamodel
 * @namespace datamodel
 */
goog.provide('ldc.datamodel.SegmentSet');

/**
 * @class SegmentSet
 * @constructor
 * @param {Table} table
 * @param {Function} filter A boolean function that takes a segment.
 */
ldc.datamodel.SegmentSet = function(table, filter) {
	this.table = table;
	this.filter = filter;
	this.segments = [];
	var rows = table.find();
	for (var i=0; i < rows.length; ++i) {
		var segment = new ldc.datamodel.Segment(table, rows[i]);
		if (this.filter(segment)) {
			this.segments.push(segment);
		}
	}
}

/**
 * @method each
 * @param {Function} callback A function taking a segment.
 */
ldc.datamodel.SegmentSet.prototype.each = function(callback) {
	for (var i=0; i < this.segments.length; ++i) {
		callback(this.segments[i]);
	}
}
