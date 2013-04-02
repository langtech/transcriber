/**
 * @module ldc
 * @submodule event
 */
goog.provide('ldc.event.Event');
goog.provide('ldc.event.DataUpdateEvent');
// Probably it's not necessary to list all the subclasses of the Event class.
// The idea is that they all go with Event class, i.e. when someone requires
// this module, he ends up requiring all subclasses of the Event class. Or,
// If someone needs a subclass of the Event class, he has to require this
// module.

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

/**
 * An event where there has been a change in the "data model". For example,
 * when a user edits a text, the text widget would send an instance of this
 * event. Or, when the backend pushes a chage to the data model component,
 * it would send this event so that display widget can update their view.
 *
 * @class DataUpdateEvent
 * @extends Event
 * @constructor
 * @param {Object} source Object that is the source of the event.
 * @param {Update} update An Update object.
 */
ldc.event.DataUpdateEvent = function(source, update) {
	goog.base(this, source, update);
}
goog.inherits(ldc.event.DataUpdateEvent, ldc.event.Event);

ldc.event.DataUpdateEvent.type = ldc.event.Event.newTypeId();

