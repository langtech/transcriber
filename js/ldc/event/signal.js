(function() {

/**
@module ldc
@submodule event
@namespace event
*/
goog.provide('ldc.event.Signal');

/**
Signal is a object that emits a signal to subscribers.
@class Signal
@constructor
*/
ldc.event.Signal = function() {
	this.objs = [];  // should not contain null nor undefined
	this.slot_names = [];  // should not contain null nor undefined
}

/**
Emits a signal.
@method emit
@param {object} p An object whose properties are the parameters of the signal.
*/
ldc.event.Signal.prototype.emit = function(p) {
	var p1 = p || {};
	this.objs.forEach(function(obj,i) {
		obj[this.slot_names[i]](p1);
	}, this);
}

/**
Connect a slot to the signal.
@method connect
@param {object} slotObj Object containing the slot.
@param {string} slotName Name of the slot which is a function taking an object
  with 0 or more properties.
*/
ldc.event.Signal.prototype.connect = function(slotObj, slotName) {
	if (!(slotObj instanceof Object))
		throw new Error('slot container is not an object');
	if (typeof slotName != 'string')
		throw new Error('slot name is not a string');
	for (var i=0; i < this.slot_names.length; ++i)
		if (this.slot_names[i] == slotName && this.objs[i] == slotObj)
			return; // already connected
	this.objs.push(slotObj);
	this.slot_names.push(slotName);
}

/**
Disconnect the signal from slots.
@method disconnect
@param {object} [slotObj] Object of a registered slot. If null or undefined, the
  signal is disconnected from everything.
@param {string} [slotName] Name of the slot of obj to disconnect. Ignored if
  obj is null or undefined.
*/
ldc.event.Signal.prototype.disconnect = function(slotObj, slotName) {
	if (slotObj == null) {
		this.objs = [];
		this.slot_names = [];
		return;
	}
	else if (slotName == null) {
		for (var i=this.objs.lenth-1; i >= 0; --i) {
			if (this.objs[i] == slotObj) {
				this.slot_names.splice(i, 1);
				this.objs.splice(i, 1);
			}
		}
	}
	else if (typeof slotName == 'string') {
		for (var i=this.slot_names.lenth-1; i >= 0; --i) {
			if (this.slot_names[i] == slotName && this.objs[i] == slotObj) {
				this.slot_names.splice(i, 1);
				this.objs.splice(i, 1);
				return;
			}
		}
	}
	else {
		throw new Error('slot name is not a string');
	}
}

})();