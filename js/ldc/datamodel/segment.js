(function() {

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
 * @param {Number} row_i
 */
ldc.datamodel.Segment = function(table, row_i) {
	this.table = table;
	this.row_i = row_i;
}

/**
 * @method value
 * @param {String} field
 */
ldc.datamodel.Segment.prototype.value = function(field) {
	return this.table.getCell(this.row_i, field);
}

/**
 * @method setUpdateCallback
 * @param {Fucntion} callback A function that is called when there's an
 *   update in the table.
 */
})();