goog.require('ldc');
goog.require('goog.net.XhrIo');
goog.require('goog.cssom');

jQuery(function($) {

	var main = this;
	var play_pos = 0.0;
	var sel_beg = 0.0;
	var sel_dur = 0.0;
	var sel_waveform;
	var sel_rid;

	var ebus = new ldc.event.EventBus;
	var table = new ldc.datamodel.Table(['waveform', 'offset','length','transcript'], ebus);
	var textedit = new ldc.textdisplay.TextEdit('textpanel', ebus);
	var waveforms = {};

	$('#play-btn').on('click', function(e) {
		if ($(this).text() == 'Play') {
			$('#player').jPlayer('play', sel_beg);
			$(this).button('play');
		}
		else if ($(this).text() == 'Resume') {
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

		$('.dropdown-menu').dropdown();
	});

	$('#create-seg-btn').on('click', function() {
		var data = {offset:sel_beg, length:sel_dur, waveform:sel_waveform};
		var rid = ldc.datamodel.Table.getNewRid();
		var e = new ldc.datamodel.TableAddRowEvent(main, rid, data);
		ebus.queue(e);
	});

	$('#remove-seg-btn').on('click', function() {
		var wid = table.getCell(sel_rid, 'waveform');
		var waveform = waveforms[wid];
		waveform.unlinkRegion(waveform.getSelection().id);
		var e = new ldc.datamodel.TableDeleteRowEvent(main, sel_rid);
		ebus.queue(e);
		$('#remove-seg-btn').prop('disabled', true);
		$('#create-seg-btn').prop('disabled', false);
	});

	// initialize event bus connections
	ebus.connect(ldc.waveform.WaveformCursorEvent, {
		handleEvent: function(e) {
			$('#pos').text(Math.round(e.args() * 10000) / 10000);
		}
	});
	ebus.connect(ldc.waveform.WaveformRegionEvent, {
		handleEvent: function(e) {
			sel_beg = e.args().beg;
			sel_dur = e.args().dur;
			sel_waveform = e.args().waveform;
			sel_rid = null;
			$('#sel-beg').text(Math.round(sel_beg * 10000) / 10000);
			$('#sel-dur').text(Math.round(sel_dur * 10000) / 10000);
			$('#create-seg-btn').prop('disabled', sel_dur < 0.00005);
			$('#remove-seg-btn').prop('disabled', true);
		}
	});
	ebus.connect(ldc.waveform.WaveformSelectEvent, {
		handleEvent: function(e) {
			sel_beg = e.args().beg;
			sel_dur = e.args().dur;
			sel_waveform = e.args().waveform;
			sel_rid = e.args().rid;
			$('#sel-beg').text(Math.round(sel_beg * 10000) / 10000);
			$('#sel-dur').text(Math.round(sel_dur * 10000) / 10000);
			$('#create-seg-btn').prop('disabled', true);
			$('#remove-seg-btn').prop('disabled', false);
		}
	});

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
		var waveform = new ldc.waveform.RichWaveform(buffer, $canvas[0], 0, ebus);
		var waveform2 = new ldc.waveform.RichWaveform(buffer, $canvas2[0], 1, ebus);
		waveforms[waveform.id] = waveform;
		waveforms[waveform2.id] = waveform2;
		var wset = new ldc.waveform.WaveformSet;
		wset.addWaveform(waveform);
		wset.addWaveform(waveform2);
		wset.display(0, 30);
		var scrollbar = new ldc.waveform.Scrollbar(wset, $scrollbar[0], ebus);
		scrollbar.setWidth(500);

		$("#player").jPlayer({
			ready: function() {
				$(this).jPlayer('setMedia', {
					oga: '/transcriber/test/data/cts.ogg'
				});
				$('#play-btn').prop('disabled', false);
			},
			supplied: "oga",
			timeupdate: function(e) {
				play_pos = e.jPlayer.status.currentTime;
				$('#pos').text(Math.round(play_pos * 10000) / 10000);
				var ev = new ldc.waveform.WaveformCursorEvent(e.jPlayer, play_pos);
				ebus.queue(ev);
				if (play_pos >= sel_beg + sel_dur) {
					$('#stop-btn').click();
				}
			}
		});
	}

	// download shape file and call setup_waveform()
	var xhr = new goog.net.XhrIo;
	xhr.setResponseType(goog.net.XhrIo.ResponseType.ARRAY_BUFFER);
	goog.events.listen(xhr, goog.net.EventType.COMPLETE, function(e) {
		setup_waveform(e.target.getResponse());
	});
	xhr.send('/transcriber/test/data/cts.shape');

});
