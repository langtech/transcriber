goog.require('ldc.textdisplay.TextEdit');
goog.require('ldc.event');
goog.require('goog.dom.query');
goog.require('goog.testing.events');

var expect = chai.expect;

describe("TextEdit", function() {
	var ebus = new ldc.event.EventBus;

	var div = $('<div id="text"/>').appendTo('body');
	var textedit = new ldc.textdisplay.TextEdit("text", ebus);

	var table = new ldc.datamodel.Table(["start", "end", "message"], ebus);
	var rid0 = table.addRow([1.0, 1.23, 'hello']);
	var rid1 = table.addRow([1.89, 2.08, 'hi']);
	var rid2 = table.addRow([3.55, 4.0, 'how are you']);

	textedit.setTable(table);
	ebus.connect(ldc.event.DataUpdateEvent, table);
	ebus.connect(ldc.event.DataUpdateEvent, textedit);

	it("should update data model when the view changes", function(done) {
		var text = 'some random text ' + Math.random();

		// find the event source (textarea element) and change the text
		var se = textedit.findSegment(rid1);
		se.setText(text);

		// emulate browser event
		var e = new goog.testing.events.Event('blur', se.dom());
		goog.testing.events.fireBrowserEvent(e);

		setTimeout(function() {
			expect(table.getCell(rid1, 'message')).to.equal(text);
			done();
		}, 500);
	})

	it("should update its view when data model changes", function(done) {
		var text = 'some random text ' + Math.random();

		table.update(new ldc.datamodel.Update(rid1, {
			message: text
		}));

		setTimeout(function() {
			var se = textedit.findSegment(rid1);
			expect(se.text()).to.equal(text);
			done();
		}, 500);
	})

})