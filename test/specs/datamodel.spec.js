goog.require('ldc.datamodel.Table');

var expect = chai.expect;

describe("Table", function() {

	var ebus, table, rid0, rid1;

	beforeEach(function() {
		ebus = new ldc.event.EventBus;
		table = new ldc.datamodel.Table(['col1', 'col2', 'col3'], ebus);
		rid0 = table.addRow([1, 2, 2]);
		rid1 = table.addRow([1, 1, 3]);
	});

	describe("Adding and searching rows", function() {
		it("should allow adding and retrieving rows", function() {
			var rids = table.find('col2', function(v) { return v == 1 });
			expect(rids.length).to.equal(1);
			expect(rids[0]).to.equal(rid1);

			rids = table.find('col3', function(v) { return v == 2 });
			expect(rids.length).to.equal(1);
			expect(rids[0]).to.equal(rid0);
		});
	})

	describe("Event handling", function() {
		it("should handle TableUpdateRowEvent", function(done) {
			var new_value = Math.random();

			ebus.queue(new ldc.datamodel.TableUpdateRowEvent({}, rid1, {col3: new_value}));

			setTimeout(function() {
				expect(table.getCell(rid1, 'col3')).to.equal(new_value);
				done();
			}, 1800);
		});
	});

});
