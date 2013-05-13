goog.require('ldc.textdisplay.TextEdit');
goog.require('ldc.event');
goog.require('goog.dom.query');
goog.require('goog.testing.events');

var expect = chai.expect;

describe("TextEdit", function() {
	var G = {}  // golbal context

	before(function() {
		$('<div id="text"/>').appendTo('body');
		G.ebus = new ldc.event.EventBus;

		G.textedit = new ldc.textdisplay.TextEdit("text", G.ebus);

		G.table = new ldc.datamodel.Table(["start", "end", "message"], G.ebus);
		G.rid0 = G.table.addRow([1.0, 1.23, 'hello']);
		G.rid1 = G.table.addRow([1.89, 2.08, 'hi']);
		G.rid2 = G.table.addRow([3.55, 4.0, 'how are you']);

		G.textedit.setTable(G.table);
	})

	it("should update data model when the view changes", function(done) {
		var text = 'some random text ' + Math.random();

		// find the event source (textarea element) and change the text
		var se = G.textedit.findSegment(G.rid1);
		se.setText(text);

		// emulate browser event
		var e = new goog.testing.events.Event('blur', se.dom());
		goog.testing.events.fireBrowserEvent(e);

		setTimeout(function() {
			expect(G.table.getCell(G.rid1, 'message')).to.equal(text);
			done();
		}, 500);
	})
})
