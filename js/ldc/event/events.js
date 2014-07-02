/**
 * @module ldc
 * @submodule event
 * @namespace event
 */
goog.provide('ldc.event.Event');
goog.provide('ldc.event.TextEvent');

/**
 * @class Event
 * @constructor
 * @param {Object} source Object that is the source of the event.
 * @param {Object} args Data associated with the event.
 */
ldc.event.Event = function(source, args) {
	/**
	 * The object that created this event.
	 * @property _source
	 * @private
	 */
	this._source = source;
	/**
	 * Parameters associated with the event.
	 * @property _args
	 * @private
	 */
	this._args = args;

	/**
	 * A unique ID for this event.
	 * @property _id
	 * @private
	 */
	if (ldc.event.Event.hasOwnProperty('next_id')) {
		this._id = (ldc.event.Event.next_id += 1);
	}
	else {
		this._id = 0;
		ldc.event.Event.next_id = 1;
	}
}

/**
 * Generates a unique IDs. Each event class needs to have a unique value for
 * its type property. Use this method to get a unique type ID for new event
 * classes.
 *
 * @method newTypeId
 * @static
 * @protected
 * @return {Number} Unique ID
 */
 ldc.event.Event.newTypeId = function() {
 	if (ldc.event.Event.next_type_id == null) {
 		ldc.event.Event.next_type_id = 0;
 	}
 	return ldc.event.Event.next_type_id++;
 }

/**
 * A unique identifier for the event type.
 * @property type
 * @static
 */
ldc.event.Event.type = ldc.event.Event.newTypeId();


/**
 * Returns a unique ID of this event.
 *
 * @method id
 * @return {Number} A unique event ID.
 */
ldc.event.Event.prototype.id = function() {
	return this._id;
}

/**
 * Returns the argument of the event.
 *
 * @method args
 * @return {Object}
 */
ldc.event.Event.prototype.args = function() {
	return this._args;
}

/**
 * Returns the object that created this event.
 *
 * @method source
 * @return {Object}
 */
ldc.event.Event.prototype.source = function() {
	return this._source;
}

/**
 * Shows how the Event class can be subclassed.
 *
 * @class TestEvent
 * @constructor
 * @extends Event
 * @param {Object} source Object that is the source of the event.
 */
ldc.event.TestEvent = function(source) {
	goog.base(this, source);
}
goog.inherits(ldc.event.TestEvent, ldc.event.Event);

ldc.event.TestEvent.type = ldc.event.Event.newTypeId();
