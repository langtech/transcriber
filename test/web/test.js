goog.require('ldc.textdisplay.TextEdit');

jQuery(function($) {
	var table = new ldc.datamodel.Table(['start','end','message']);
	
	table.addRow([0.0, 2.0, "hello"]);
	table.addRow([2.1, 3.0, "hi"]);
	table.addRow([3.5, 4.2, "how are you?"]);

	var textedit = new ldc.textdisplay.TextEdit('textpanel');

	textedit.setTable(table);
});
