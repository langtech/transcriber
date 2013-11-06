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

	this.handlers = {'add':[], 'delete':[], 'update':[]};
	this.thisobjs = {'add':[], 'delete':[], 'update':[]};

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
ldc.datamodel.Table.prototype.header = function() {
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
	if (rid == null)
		rid = ldc.datamodel.Table.getNewRid();
	this.rows[rid] = newrow;

	// invoke "add" handlers
	for (var i=0; i < this.handlers['add'].length; ++i) {
		var handler = this.handlers['add'][i];
		var thisobj = this.thisobjs['add'][i];
		var row = new ldc.datamodel.TableRow(this, rid);
		if (thisobj == null)
			handler(rid, row);
		else
			handler.call(thisobj, rid, row);
	}

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

		// invoke "delete" handlers
		for (var i=0; i < this.handlers['delete'].length; ++i) {
			var handler = this.handlers['delete'][i];
			var thisobj = this.thisobjs['delete'][i];
			if (thisobj == null)
				handler(rid);
			else
				handler.call(thisobj, rid);
		}
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
 * Run the given callback function for each row of the table filtered by
 * the matcher function. If matcher is not given, every row is applied to the
 * callback.
 *
 * @method forEach
 * @param {Function} callback Function taking a TableRow object.
 * @param {Function} [matcher] A filter taking a TableRow object.
 */
ldc.datamodel.Table.prototype.forEach = function(callback, matcher) {
	var f = matcher == null ? function() {return true} : matcher;
	for (var k in this.rows) {
		if (this.rows.hasOwnProperty(k)) {
			var trow = this.getRow(parseInt(k));
			if (f(trow) == true) {
				callback(trow);
			}
		}
	}
}


/**
 * @method getRow
 * @param {Number} rid Row index.
 * @return {Object}
 */
ldc.datamodel.Table.prototype.getRow = function(rid) {
	if (this.rows.hasOwnProperty(rid)) {
		return new ldc.datamodel.TableRow(this, parseInt(rid));
	}
}

/**
 * Return a row as an object.
 *
 * @method getObj
 * @param {Number} rid Row index,
 * @return {Object}
 */
ldc.datamodel.Table.prototype.getObj = function(rid) {
	if (this.rows.hasOwnProperty(rid)) {
		var obj = {};
		for (var i=0; i < this.header_.length; ++i) {
			obj[this.header_[i]] = this.rows[rid][i];
		}
		return obj;
	}
}

/**
 * @method getCell
 * @param {Number} rid
 * @param {String} field
 * @return {Any type}
 */
ldc.datamodel.Table.prototype.getCell = function(rid, field) {
	if (this.rows.hasOwnProperty(rid)) {
		var idx = this.header_.indexOf(field);
		return this.rows[rid][idx];
	}
}

/**
 * Update cells in a row.
 *
 * @method updateRow
 * @param {Number} rid
 * @param {Object} update An Update object.
 */
ldc.datamodel.Table.prototype.updateRow = function(rid, update) {
	var row = this.rows[rid];
	if (row != null) {
		var old_values = {};
		var new_values = {};
		for (var i=0; i < this.header_.length; ++i) {
			var k = this.header_[i];
			if (update.hasOwnProperty(k)) {
				old_values[k] = row[i];
				new_values[k] = update[k];
				if (is_hash(row[i]) && is_hash(update[k])) {
					update_object(row[i], update[k]);
				}
				else {
					row[i] = update[k];
				}
			}
		}
		if (Object.keys(old_values).length > 0) {
			// invoke "update" handlers
			for (var i=0; i < this.handlers['update'].length; ++i) {
				var handler = this.handlers['update'][i];
				var thisobj = this.thisobjs['update'][i];
				if (thisobj == null)
					handler(rid, old_values, new_values);
				else
					handler.call(thisobj, rid, old_values, new_values);
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
	if (event instanceof ldc.datamodel.TableUpdateRowEvent) {
		var args = event.args();
		this.updateRow(args.rid, args.data);
	}
	else if (event instanceof ldc.datamodel.TableAddRowEvent) {
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
	else if (event instanceof ldc.datamodel.TableDeleteRowEvent) {
		var rid = event.args().rid;
		this.deleteRow(rid);
	}
}


/**
 * Register callback for an event.
 *
 * @method addListener
 * @param {String} event One of 'add', 'delete', and 'update'.
 * @param {Function} callback
 * @param {Object} [thisObj]
 */
 ldc.datamodel.Table.prototype.addListener = function(event, callback, thisObj) {
 	// check if event type is recognized
 	if (event != 'add' && event != 'delete' && event != 'update')
 		return false;

 	// check if handler already exists
 	var i = this.handlers[event].indexOf(callback);
 	var j = this.thisobjs[event].indexOf(thisObj);
 	if (i >= 0 && j >= 0)
 		return false;

 	// add handler
 	this.handlers[event].push(callback);
 	this.thisobjs[event].push(callback);
 	return true;
 }

/**
 * Unregister event callback.
 *
 * @method removeListener
 * @param {String} event One of 'add', 'delete', and 'update'.
 *    callback will be removed from all event types.
 * @param {Function} callback
 * @param {Object} [thisObj]
 */
ldc.datamodel.Table.prototype.removeListener = function(event, callback, thisObj) {
	// make sure the event type is recognized
	if (event != 'add' && event != 'delete' && event != 'update')
		return false;

 	// check if handler exists
 	var i = this.handlers[event].indexOf(callback);
 	while (i >= 0 && thisObj != this.thisobjs[event][i])
 		i = this.handlers[event].indexOf(callback, i + 1);
 	if (i < 0)
 		return false;

 	// remove handler
 	this.handlers[event].splice(i, 1);
 	this.thisobjs[event].splice(i, 1);
 	return true;
}

})();