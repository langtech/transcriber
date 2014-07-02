goog.require('ldc.event.EventBus');

var expect = chai.expect;

describe.skip("EventBus", function() {

	var G = {}  // global context

	before(function() {
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
		G.eventbus = eventbus;
		G.event_source_one = event_source_one;
		G.event_source_two = event_source_two;
	})


	it("should register a handler and relay event", function(done) {
		G.event_source_one.callback = function(event) {
			done();
		}

		G.eventbus.connect(ldc.event.TestEvent, G.event_source_one);

		var an_event = new ldc.event.TestEvent(G.event_source_two);

		G.eventbus.queue(an_event);
	})

	it("should NOT relay event to the sender", function(done) {
		G.event_source_one.callback = function(event) {
			throw "the event was relayed back to the sender";
		}

		G.eventbus.connect(ldc.event.TestEvent, G.event_source_one);

		var an_event = new ldc.event.TestEvent(G.event_source_one);

		G.eventbus.queue(an_event);

		// if the callback is not called in 1800 ms, it's a success
		setTimeout(function(){done();}, 1800);
	})

	it("should register only one hander per event and event source", function(done) {
		var counter = 0;
		G.event_source_one.callback = function(event) {
			counter += 1;
		}

		G.eventbus.connect(ldc.event.TestEvent, G.event_source_one);
		G.eventbus.connect(ldc.event.TestEvent, G.event_source_one);
		G.eventbus.connect(ldc.event.TestEvent, G.event_source_one);
		G.eventbus.connect(ldc.event.TestEvent, G.event_source_one);
		G.eventbus.connect(ldc.event.TestEvent, G.event_source_one);

		var an_event = new ldc.event.TestEvent(G.event_source_two);

		G.eventbus.queue(an_event);

		setTimeout(function() {
			expect(counter).to.equal(1);
			done();
		}, 1800)
	})

	it("should disconnect handler", function(done) {
		G.event_source_one.callback = function(event) {
			throw "event source is still connect to the event";
		}

		G.eventbus.connect(ldc.event.TestEvent, G.event_source_one);
		G.eventbus.disconnect(ldc.event.TestEvent, G.event_source_one);

		var an_event = new ldc.event.TestEvent(G.event_source_two);

		G.eventbus.queue(an_event);

		setTimeout(function() {done();}, 1800);
	})
})
