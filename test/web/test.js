goog.require('ldc.textdisplay.TextEdit');
goog.require('ldc.event.EventBus');

jQuery(function($) {

	var ebus = new ldc.event.EventBus;
	var table = new ldc.datamodel.Table(['start','end','message'], ebus);

	table.addRow([0.0, 2.0, "hello"]);
	table.addRow([2.1, 3.0, "hi"]);
	table.addRow([3.5, 4.2, "how are you?"]);

	var textedit = new ldc.textdisplay.TextEdit('textpanel', ebus);

	textedit.setTable(table);

	ebus.connect(ldc.event.DataUpdateEvent, textedit);
	ebus.connect(ldc.event.DataUpdateEvent, table);

	G = {
		table: table
	}
});
