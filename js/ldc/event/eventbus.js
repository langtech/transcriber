/**
 * @module ldc
 * @submodule event
 */
goog.provide('ldc.event.EventBus');

/**
 * EventBus is an event dispatcher. Objects register themselves with
 * an EventBus for an interested event type. If that type of event enters
 * the bus, the registered objects are notified.
 *
 * @class EventBus
 * @constructor
 */
ldc.event.EventBus = function() {
	this.queued_events = [];
	this.handlers = {};
}

/**
 * Queue an event for propagation.
 *
 * @method queue
 * @param {Event} e Event to propagate.
 */
ldc.event.EventBus.prototype.queue = function(e) {
	this.queued_events.push(e);

	while (this.queued_events.length > 0) {
		var event = this.queued_events.shift();
		var handlers = this.handlers[event.constructor.type];
		if (handlers) {
			for (var i=0; i < handlers.length; ++i) {
				if (event.source() != handlers[i]) {
					handlers[i].handleEvent(event);
				}
			}
		}
	}
}

/**
 * Connect a handler to an event type.
 *
 * @method connect
 * @param {Function} eventClass Constructor of an Event class.
 * @param {EventHandler} handler An object that implements a handleEvent()
 *   method.
 */
ldc.event.EventBus.prototype.connect = function(eventClass, handler) {
	var handlers = this.handlers[eventClass.type];
	if (handlers == null) {
		this.handlers[eventClass.type] = handlers = [handler];
	}
	else if (handlers.indexOf(handler) < 0) {
		handlers.push(handler);
	}
}

/**
 * Disconnect a handler from an event type.
 *
 * @method disconnect
 * @param {Function} eventClass Constructor of an Event class.
 * @param {EventHandler} handler
 */
ldc.event.EventBus.prototype.disconnect = function(eventClass, handler) {
	var handlers = this.handlers[eventClass.type];
	if (handlers != null) {
		var idx = handlers.indexOf(handler);
		if (idx >= 0) {
			handlers.splice(idx, 1);
		}
	}
}
