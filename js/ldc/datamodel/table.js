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
 * retrieve rows. Value of the table cell can be any type.
 * 
 * @class Table
 * @constructor
 * @param {Array} header A list of strings defining the names of the columns.
 * @param {EventBus} [eventBus]
 */
ldc.datamodel.Table = function(header, eventBus) {
	this.ebus = eventBus;
	// TODO: validate header
	this.header_ = header;
	this.rows = {};

	if (eventBus) {
		eventBus.connect(ldc.datamodel.TableUpdateRowEvent, this);
		eventBus.connect(ldc.datamodel.TableAddRowEvent, this);
		eventBus.connect(ldc.datamodel.TableDeleteRowEvent, this);
	}
}

/**
 * Returns a new unique rid.
 * @method getNewRid
 * @static
 * @return {Number} A new unique rid.
 */
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
 * Returns the table header.
 *
 * @method header
 * @return {Array}
 */
ldc.datamodel.Table.header = function() {
	return this.header_;
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
	for (var i=0; i < this.header_.length; ++i) {
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
 * Iterates rows one by one. In each iteration, feeds the value of the
 * specified field to the matcher. Returns a list of rids for which the
 * matcher returned true.
 *
 * If field is null or matcher is null, returns all rids.
 *
 * @method find
 * @param {String} [field]
 * @param {Function} [matcher] Boolean function taking a single parameter.
 * @return {Array} An array of rids.
 */
ldc.datamodel.Table.prototype.find = function(field, matcher) {
	var rows = [];
	var idx = field == null ? 0 : this.header_.indexOf(field);
	var f = matcher == null ? function() {return true} : matcher;
	for (var k in this.rows) {
		if (this.rows.hasOwnProperty(k)) {
			if (f(this.rows[k][idx]) == true) {
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
	return _copy_row(this.rows[rid]);
}

/**
 * @method getCell
 * @param {Number} rid
 * @param {String} field
 * @return {Any type}
 */
ldc.datamodel.Table.prototype.getCell = function(rid, field) {
	var idx = this.header_.indexOf(field);
	return this.rows[rid][idx];
}

/**
 * Update cells in a row.
 *
 * @method update
 * @param {Number} rid
 * @param {Object} update An Update object.
 */
ldc.datamodel.Table.prototype.updateRow = function(rid, update) {
	var row = this.rows[rid];
	if (row) {
		for (var i=0; i < this.header_.length; ++i) {
			var k = this.header_[i];
			if (update.hasOwnProperty(k)) {
				if (is_hash(row[i]) && is_hash(update[k])) {
					update_object(row[i], update[k]);
				}
				else {
					row[i] = update[k];
				}
			}
		}
	}
}

function is_hash(obj) {
	return (obj instanceof Object) && 
		!(obj instanceof Array) &&
		!(obj instanceof Function);
}

function update_object(obj, updater) {
	for (var k in updater) {
		if (updater.hasOwnProperty(k)) {
			if (k[k.length-1] == '$') {
				obj[k.slice(0,-1)] = updater[k];
			}
			else if (obj.hasOwnProperty(k) && is_hash(obj[k]) && is_hash(updater[k])) {
				// recurse
				update_object(obj[k], updater[k]);
			}
			else {
				obj[k] = updater[k];
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
		for (var i=0; i < this.header_.length; ++i) {
			var k = this.header_[i];
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

var _copy_row = function(row) {
	var newrow = [];
	for (var i=0; i < row.length; ++i) {
		newrow.push(row[i]);
	}
	return newrow;
}

})();