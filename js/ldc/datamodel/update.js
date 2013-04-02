(function() {

/**
 * @module ldc
 * @submodule datamodel
 */
goog.provide('ldc.datamodel.Update');

/**
 * Represents an update query against a Table object.
 *
 * @class Update
 * @param {Number} rid
 * @param {Object} [changes] A hash of key-value pairs.
 */
ldc.datamodel.Update = function(rid, changes) {
	this.rid_ = rid;
	this.changes = changes || {};
}

/**
 * @method rid
 * @return {Number}
 */
ldc.datamodel.Update.prototype.rid = function() {
	return this.rid_;
}

/**
 * @method get
 * @param {String} k Key.
 * @return {String|Number}
 */
ldc.datamodel.Update.prototype.get = function(k) {
	return this.changes[k];
}

/**
 * Add a new item to the changes hash. If the key already exists, replace
 * the old value with the new one.
 *
 * @method set
 * @param {String} k Key.
 * @param {String|Number} v Value.
 */
ldc.datamodel.Update.prototype.set = function(k, v) {
	this.changes[k] = v;
}

/**
 * Delete an item from the changes hash.
 * @method remove
 * @param {String} k Key.
 */
ldc.datamodel.Update.prototype.remove = function(k) {
	delete this.changes[k];
}

/**
 * Invokes the callback function for each key-value pair in the changes hash.
 *
 * @method each
 * @param {Function} callback
 */
ldc.datamodel.Update.prototype.each = function(callback) {
	for (var k in this.changes) {
		if (this.changes.hasOwnProperty(k)) {
			callback(k, this.changes[k]);
		}
	}
}

})();