goog.require('ldc');
goog.require('goog.net.XhrIo');
goog.require('goog.cssom');

jQuery(function($) {

	$('#play-btn').on('click', function(e) {
		if ($(this).text() == 'Play' || $(this).text() == 'Resume') {
			$('#player').jPlayer('play');
			$(this).button('play');
		}
		else if ($(this).text() == 'Pause') {
			$('#player').jPlayer('pause');
			$(this).button('pause');
		}
		$('#stop-btn').prop('disabled', false);
	});

	$('#stop-btn').on('click', function() {
		$('#player').jPlayer('stop');
		$('#play-btn').button('reset');
		$('#stop-btn').prop('disabled', true);
	});

	var player = $("#player").jPlayer({
		ready: function() {
			$(this).jPlayer('setMedia', {
				oga: '/test/data/cts.ogg'
			});
			$('#play-btn').prop('disabled', false);
		},
		supplied: "oga",
		timeupdate: function(e) {
			var t = e.jPlayer.status.currentTime;
			$('#pos').text(t);
			waveform.updateRegion(region, t);
		}
	});


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
		var $canvas2 = $('#waveform2');
		$canvas.attr('width', '500px');
		$canvas.attr('height', '100px');
		$canvas2.attr('width', '500px');
		$canvas2.attr('height', '100px');
		var $scrollbar = $('#scrollbar');
		waveform = new ldc.waveform.RichWaveform(buffer, $canvas[0], 0);
		waveform2 = new ldc.waveform.RichWaveform(buffer, $canvas2[0], 1);
		var wset = new ldc.waveform.WaveformSet;
		wset.addWaveform(waveform);
		wset.addWaveform(waveform2);
		wset.display(0, 30);
		region = waveform.addRegion(0, 0);
		scrollbar = new ldc.waveform.Scrollbar(wset, $scrollbar[0]);
		scrollbar.setWidth(500);
	}

	// download shape file and call setup_waveform()
	var xhr = new goog.net.XhrIo;
	xhr.setResponseType(goog.net.XhrIo.ResponseType.ARRAY_BUFFER);
	goog.events.listen(xhr, goog.net.EventType.COMPLETE, function(e) {
		setup_waveform(e.target.getResponse());
	});
	xhr.send('/test/data/cts.shape');

});
