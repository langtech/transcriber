(function() {

/**
 * @module ldc
 * @submodule datamodel
 * @namespace datamodel
 */
goog.provide('ldc.datamodel.Table');
goog.require('ldc.datamodel.TableUpdateRowEvent');

/**
 * Provides an interface for table-like data structure. Allows to add and
 * retrieve rows.
 * 
 * @class Table
 * @constructor
 * @param {Array} header A list of strings defining the names of the columns.
 * @param {EventBus} [eventBus]
 */
ldc.datamodel.Table = function(header, eventBus) {
	this.ebus = eventBus;
	// TODO: validate header
	this.header = header;
	this.rows = {};

	if (eventBus) {
		eventBus.connect(ldc.datamodel.TableUpdateRowEvent, this);
		eventBus.connect(ldc.datamodel.TableAddRowEvent, this);
		eventBus.connect(ldc.datamodel.TableDeleteRowEvent, this);
	}
}

var next_rid = 0;
var rid_pool = [];
ldc.datamodel.Table.getNewRid = function() {
	if (rid_pool.length > 0) {
		return rid_pool.shift();
	}
	else {
		return next_rid++;
	}
}

/**
 * Add a row.
 *
 * @method addRow
 * @param {Array} row An array of strings and numbers.
 * @param {Number} [rid] If specified, use this as the rid.
 * @return {Number} Row id, a.k.a. rid.
 */
ldc.datamodel.Table.prototype.addRow = function(row, rid) {
	var newrow = [];
	for (var i=0; i < this.header.length; ++i) {
		var v = row[i];
		// TODO: make sure that the value is either a string or a number
		newrow.push(v);
	}
	if (rid == null) {
		rid = ldc.datamodel.Table.getNewRid();
	}
	this.rows[rid] = newrow;
	return rid;
}

/**
 * Delete a row.
 *
 * @method deleteRow
 * @param {Number} rid
 */
ldc.datamodel.Table.prototype.deleteRow = function(rid) {
	if (this.rows.hasOwnProperty(rid)) {
		rid_pool.push(rid);
		delete this.rows[rid];
	}
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
	for (var k in this.rows) {
		if (this.rows.hasOwnProperty(k)) {
			if (this.rows[k][idx] == value) {
				rows.push(parseInt(k));
			}
		}
	}
	return rows;
}

/**
 * @method getRow
 * @param {Number} rid Row index.
 * @return {Object}
 */
ldc.datamodel.Table.prototype.getRow = function(rid) {
	return this._copy_row(this.rows[rid]);
}

/**
 * @method getCell
 * @param {Number} rid
 * @param {String} field
 * @return {String|Number}
 */
ldc.datamodel.Table.prototype.getCell = function(rid, field) {
	var idx = this.header.indexOf(field);
	return this.rows[rid][idx];
}

/**
 * Update cells in a row.
 *
 * @method update
 * @param {Update} update An Update object.
 * @param {Boolean} [sendEvent=true] Whether the update should be broadcast.
 */
ldc.datamodel.Table.prototype.updateRow = function(rid, update) {
	var row = this.rows[rid];
	if (row) {
		for (var i=0; i < this.header.length; ++i) {
			var k = this.header[i];
			if (update.hasOwnProperty(k)) {
				row[i] = update[k];
			}
		}
	}
}

/**
 * @method handleEvent
 * @param {Event} event
 */
ldc.datamodel.Table.prototype.handleEvent = function(event) {
	if (event.constructor == ldc.datamodel.TableUpdateRowEvent) {
		var args = event.args();
		this.updateRow(args.rid, args.data);
	}
	else if (event.constructor == ldc.datamodel.TableAddRowEvent) {
		var args = event.args();
		var row = [];
		for (var i=0; i < this.header.length; ++i) {
			var k = this.header[i];
			if (args.data.hasOwnProperty(k)) {
				row.push(args.data[k]);
			}
			else {
				row.push(null);
			}
		}
		this.addRow(row, args.rid);
	}
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