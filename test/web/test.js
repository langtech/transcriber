goog.require('ldc.textdisplay.TextEdit');
goog.require('ldc.event.EventBus');
goog.require('ldc.waveform');
goog.require('goog.net.XhrIo');
goog.require('goog.cssom');

jQuery(function($) {

	var ebus = new ldc.event.EventBus;
	var table = new ldc.datamodel.Table(['start','end','message'], ebus);
	var textedit = new ldc.textdisplay.TextEdit('textpanel', ebus);

	// initialize event bus connections
	ebus.connect(ldc.event.DataUpdateEvent, textedit);
	ebus.connect(ldc.event.DataUpdateEvent, table);

	// initialize the data model
	table.addRow([0.0, 2.0, "hello"]);
	table.addRow([2.1, 3.0, "hi"]);
	table.addRow([3.5, 4.2, "how are you?"]);

	// a hook for debugger
	G = {
		table: table
	}

	textedit.setTable(table);

	// waveform setup
	function setup_waveform(raw_data) {
		var buffer = new ldc.waveform.WaveformBuffer(raw_data);
		var $canvas = $('#waveform');
		$canvas.attr('width', '500px');
		$canvas.attr('height', '100px');
		var $scrollbar = $('#scrollbar');
		var waveform = new ldc.waveform.Waveform(buffer, $canvas[0], 0);
		scrollbar = new ldc.waveform.Scrollbar($scrollbar[0]);
		scrollbar.setWidth(500);
		scrollbar.addWaveform(waveform);
		waveform.display(0, 3);
	}

	// download shape file and call setup_waveform()
	var xhr = new goog.net.XhrIo;
	xhr.setResponseType(goog.net.XhrIo.ResponseType.ARRAY_BUFFER);
	goog.events.listen(xhr, goog.net.EventType.COMPLETE, function(e) {
		setup_waveform(e.target.getResponse());
	});
	xhr.send('test/data/test.shape');

});
