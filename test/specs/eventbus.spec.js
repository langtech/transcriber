goog.require('ldc.event.EventBus');

var expect = chai.expect;

describe("EventBus", function() {

	// shared variables
	var eventbus = new ldc.event.EventBus();
	var event_source_one = {
		handleEvent: function(event) {
			this.callback(event);
		},
		callback: function(event) {
			// do nothing by default
		}
	}
	var event_source_two = {
		handleEvent: function(event) {
			this.callback(event);
		},
		callback: function(event) {
			// do nothing by default
		}
	}

	it("should register a handler and relay event", function(done) {
		event_source_one.callback = function(event) {
			done();
		}

		eventbus.connect(ldc.event.TestEvent, event_source_one);

		var an_event = new ldc.event.TestEvent(event_source_two);

		eventbus.queue(an_event);
	})

	it("should NOT relay event to the sender", function(done) {
		event_source_one.callback = function(event) {
			throw "the event was relayed back to the sender";
		}

		eventbus.connect(ldc.event.TestEvent, event_source_one);

		var an_event = new ldc.event.TestEvent(event_source_one);

		eventbus.queue(an_event);

		// if the callback is not called in 1800 ms, it's a success
		setTimeout(function(){done();}, 1800);
	})

	it("should register only one hander per event and event source", function(done) {
		var counter = 0;
		event_source_one.callback = function(event) {
			counter += 1;
		}

		eventbus.connect(ldc.event.TestEvent, event_source_one);
		eventbus.connect(ldc.event.TestEvent, event_source_one);
		eventbus.connect(ldc.event.TestEvent, event_source_one);
		eventbus.connect(ldc.event.TestEvent, event_source_one);
		eventbus.connect(ldc.event.TestEvent, event_source_one);

		var an_event = new ldc.event.TestEvent(event_source_two);

		eventbus.queue(an_event);

		setTimeout(function() {
			expect(counter).to.equal(1);
			done();
		}, 1800)
	})

	it("should disconnect handler", function(done) {
		event_source_one.callback = function(event) {
			throw "event source is still connect to the event";
		}

		eventbus.connect(ldc.event.TestEvent, event_source_one);
		eventbus.disconnect(ldc.event.TestEvent, event_source_one);

		var an_event = new ldc.event.TestEvent(event_source_two);

		eventbus.queue(an_event);

		setTimeout(function() {done();}, 1800);
	})
})