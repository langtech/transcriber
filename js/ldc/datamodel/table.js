(function() {

/**
 * @module ldc
 * @submodule datamodel
 */
goog.provide('ldc.datamodel.Table');
goog.provide('ldc.datamodel.TableRow');

/**
 * Provides an interface for table-like data structure. Allows to add and
 * retrieve rows.
 * 
 * @class Table
 * @constructor
 * @param {List} header A list of strings defining the names of the columns.
 */
ldc.datamodel.Table = function(header) {
	// TODO: validate header
	this.header = header;
	this.rows = [];
}

/**
 * Add a row.
 *
 * @method addRow
 * @param {Array} row An array of strings and numbers.
 */
ldc.datamodel.Table.prototype.addRow = function(row) {
	var newrow = [];
	for (var i=0; i < this.header.length; ++i) {
		var v = row[i];
		// TODO: make sure that the value is either a string or a number
		newrow.push(v);
	}
	this.rows.push(newrow);
}

/**
 * Find rows by specified field and value. If both field and value are not
 * given, returns everything.
 *
 * @method find
 * @param {String} field
 * @param {String|Number} value
 * @return {Array} An array of rows indices.
 */
ldc.datamodel.Table.prototype.find = function(field, value) {
	var rows = [];
	var idx = this.header.indexOf(field);
	for (var i=0; i < this.rows.length; ++i) {
		var row = this.rows[i];
		if (row[idx] == value) {
			rows.push(i);
		}
	}
	return rows;
}

/**
 * @method getRow
 * @param {Number} row_i Row index.
 * @return {Object}
 */
ldc.datamodel.Table.prototype.getRow = function(row_i) {
	return this._copy_row(this.rows[row_i]);
}

/**
 * @method getCell
 * @param {Number} row_i
 * @param {String} field
 * @return {String|Number}
 */
ldc.datamodel.Table.prototype.getCell = function(row_i, field) {
	var idx = this.header.indexOf(field);
	return this.rows[row_i][idx];
}

// private utilitty functions

ldc.datamodel.Table.prototype._copy_row = function(row) {
	var newrow = [];
	for (var i=0; i < row.length; ++i) {
		newrow.push(row[i]);
	}
	return newrow;
}


})();