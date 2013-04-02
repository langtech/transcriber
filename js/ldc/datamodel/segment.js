/**
 * @module ldc
 * @submodule datamodel
 */
goog.provide('ldc.datamodel.Segment');

/**
 * Class representing a segment.
 *
 * @class Segment
 * @constructor
 * @param {Table} table
 * @param {Number} rid
 */
ldc.datamodel.Segment = function(table, rid) {
	this.table = table;
	this._rid = rid;
}

/**
 * @method value
 * @param {String} field
 */
ldc.datamodel.Segment.prototype.value = function(field) {
	return this.table.getCell(this._rid, field);
}

/**
 * @method rid
 * @return {Number}
 */
ldc.datamodel.Segment.prototype.rid = function(field) {
	return this._rid;
}
