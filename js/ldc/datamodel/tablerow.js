/**
 * @module ldc
 * @submodule datamodel
 * @namespace datamodel
 */
goog.provide('ldc.datamodel.TableRow');

/**
 * Class representing a row of Table.
 *
 * @class TableRow
 * @constructor
 * @param {Table} table
 * @param {Number} rid
 */
ldc.datamodel.TableRow = function(table, rid) {
	this.table = table;
	this._rid = rid;
}

/**
 * @method value
 * @param {String} field
 * @return {Any type} the value of the cell.
 */
ldc.datamodel.TableRow.prototype.value = function(field) {
	return this.table.getCell(this._rid, field);
}

/**
 * @method set
 * @param {String} field
 * @param {Any type} value
 */
ldc.datamodel.TableRow.prototype.set = function(field, value) {
	var u = {}
	u[field] = value;
	this.table.updateRow(this._rid, u);
}

/**
 * @method rid
 * @return {Number}
 */
ldc.datamodel.TableRow.prototype.rid = function() {
	return this._rid;
}

/**
 * Convert this table row into an key-value pairs object.
 *
 * @method toObj
 * @return {Object}
 */
ldc.datamodel.TableRow.prototype.toObj = function() {
	var obj = {};
	this.table.header().forEach(function(h) {
		obj[h] = this.value(h);
	}, this);
	return obj;
}
