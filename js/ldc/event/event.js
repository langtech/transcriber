(function() {

/**
 * @module ldc
 * @submodule event
 */
goog.provide('ldc.event.Event');

/**
 * @class Event
 * @constructor
 * @param {String} type
 * @param {Object} args Data associated with the event.
 * @param {Object} source Object that is the source of the event.
 */
ldc.event.Event = function(type, args, source) {
	this._type = type;
	this._source = source;
	this._args = args;

	if (ldc.event.Event.hasOwnProperty('next_id')) {
		this._id = (ldc.event.Event.next_id += 1);
	}
	else {
		this._id = 0;
		ldc.event.Event.next_id = 1;
	}
}

/**
 * @method id
 * @return {Number} A unique event ID.
 */
ldc.event.Event.prototype.id = function() {
	return this._id;
}

/**
 * @method type
 * @return {String}
 */
ldc.event.Event.prototype.type = function() {
	return this._type;
}

/**
 * @method args
 * @return {Object}
 */
ldc.event.Event.prototype.args = function() {
	return this._args;
}

/**
 * @method source
 * @return {Object}
 */
ldc.event.Event.prototype.source = function() {
	return this._source;
}

/**
 * @property TEST_EVENT
 * @type {String}
 * @static
 * @final
 */
ldc.event.Event.TEST_EVENT = "test_event";

})();