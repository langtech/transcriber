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
 * @param {Array} header A list of strings defining the names of the columns.
 * @param {EventBus} [eventBus]
 */
ldc.datamodel.Table = function(header, eventBus) {
	this.ebus = eventBus;
	// TODO: validate header
	this.header = header;
	this.rows = [];
}

/**
 * Add a row.
 *
 * @method addRow
 * @param {Array} row An array of strings and numbers.
 * @return {Number} Row id, a.k.a. rid.
 */
ldc.datamodel.Table.prototype.addRow = function(row) {
	var newrow = [];
	for (var i=0; i < this.header.length; ++i) {
		var v = row[i];
		// TODO: make sure that the value is either a string or a number
		newrow.push(v);
	}
	this.rows.push(newrow);
	return this.rows.length - 1;
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
		if (this.rows[i][idx] == value) {
			rows.push(i);
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
 * @param {Boolean} sendEvent=true Whether or not broadcast the change.
 */
ldc.datamodel.Table.prototype.update = function(update, sendEvent) {
	var rid = update.rid();
	var row = this.rows[rid];
	if (row) {
		var cleaned_update = new ldc.datamodel.Update(rid);
		var header = this.header;
		update.each(function(k, v) {
			// TODO: this is inefficient
			var i = header.indexOf(k);
			if (i >= 0) {
				row[i] = v;
				cleaned_update.set(k, v);
			}
		});

		if (this.ebus && (sendEvent == null || sendEvent == true)) {
			var e = new ldc.event.DataUpdateEvent(this, cleaned_update);
			this.ebus.queue(e);
		}
	}
}

/**
 * @method handleEvent
 * @param {Event} event
 */
ldc.datamodel.Table.prototype.handleEvent = function(event) {
	if (event.type() == ldc.event.DataUpdateEvent) {
		var eargs = event.args();
		if (eargs != null) {
			this.update(eargs);
		}
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