(function() {

/**
 * @module ldc
 * @submodule event
 */
goog.provide('ldc.event.EventBus');

/**
 * @class EventBus
 * @constructor
 */
ldc.event.EventBus = function() {
	this.queued_events = [];
	this.handlers = {};
}

/**
 * @method queue
 * @param {Event} event
 */
ldc.event.EventBus.prototype.queue = function(event) {
	this.queued_events.push(event);

	while (this.queued_events.length > 0) {
		var event = this.queued_events.shift();
		var handlers = this.handlers[event.type()];
		for (var i=0; i < handlers.length; ++i) {
			if (event.source() != handlers[i]) {
				handlers[i].handleEvent(event);
			}
		}
	}
}

/**
 * @method connect
 * @param {String} eventType
 * @param {EventHandler} handler An object that implements a handleEvent()
 *   method.
 */
ldc.event.EventBus.prototype.connect = function(eventType, handler) {
	var handlers = this.handlers[eventType];
	if (handlers == null) {
		this.handlers[eventType] = handlers = [handler];
	}
	else if (handlers.indexOf(handler) < 0) {
		handlers.push(handler);
	}
}

/**
 * @method disconnect
 * @param {String} eventType
 * @param {EventHandler} handler
 */
ldc.event.EventBus.prototype.disconnect = function(eventType, handler) {

}

})();
