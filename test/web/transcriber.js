goog.require('ldc');
goog.require('goog.net.XhrIo');
goog.require('goog.cssom');

jQuery(function($) {
	var WAVEFORM = {
		width: 600,
		beg: 0,
		dur: 30
	};

	var main = this;
	var play_pos = 0.0;
	var sel_beg = 0.0;
	var sel_dur = 0.0;
	var sel_waveform;
	var sel_rid;
	var sel_sl;
	var map_beg = 0.0;
	var map_dur = 0.0;

	var ebus = new ldc.event.EventBus;
	var table = new ldc.datamodel.Table([
		'waveform',    // waveform id (only meaningful for current session)
		'offset',      // start offset of the region
		'length',      // lenght of the region
		'transcript',  // transcript for the region
		'swimlane',    // swimlane id; null if waveform id is not null, or vice versa
		'mapoff',      // if this is re-spoken region, offset into the respeaking
		'maplen'       // length of the respeaking
		], ebus);
	var textedit = new ldc.textdisplay.TextEdit('textpanel', ebus, function(seg) {
		return seg.value('waveform') != null;
	});
	var waveforms = {};

	function jplayer(slid) {
		return $('#player-' + slid);
	}

	$('#play-btn').on('click', function(e) {
		var text = $(this).text().trim();
		if (text == 'Play') {
			$('#player').jPlayer('play', sel_beg);
			$(this).button('play');
		}
		else if (text == 'Resume') {
			$('#player').jPlayer('play');
			$(this).button('play');
		}
		else if (text == 'Pause') {
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

	$('#play-rspk-btn').on('click', function() {
		var text = $(this).text().trim();
		if (text == 'Play Respeaking') {
			jplayer(sel_sl).jPlayer('play', map_beg);
			$(this).button('play');
		}
		else if (text == 'Stop') {
			jplayer(sel_sl).jPlayer('stop');
			$(this).button('reset');
		}
	});

	$('#file-dialog').on('show', function() {
		document.forms['local-file-form'].reset();
		$('#open-local-file').prop('disabled', true);
	});

	$('#local-file').on('change', function(e) {
		if ($('#local-file').prop('files').length > 0) {
			$('#open-local-file').prop('disabled', false);
		}
	});

	$('#open-local-file').on('click', function() {
		var file = $('#local-file').prop('files')[0];
		var reader = new FileReader;
		reader.onload = function(e) {
			var obj = JSON.parse(reader.result);
			var wid = Object.keys(waveforms)[0];
			var segs = table.find('waveform', function(v){return v==wid});
			segs.forEach(function(rid) {
				table.deleteRow(rid);
			});
			for (var i=0, item; item = obj.data[i]; ++i) {
				var u = [wid, item.offset, item.length, item.transcript];
				table.addRow(u);
			}
			textedit.setTable(table);
		};
		reader.readAsText(file);
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
	ebus.connect(ldc.aikuma.SwimLaneRegionEvent, {
		handleEvent: function(e) {
			var map = e.args().map;
			var slid = e.args().id;
			jplayer(sel_sl).jPlayer('stop');
			$('#play-rspk-btn').button('reset');
			map_beg = map.offset;
			map_dur = map.length;
			sel_sl = slid;
		}
	});

	// a hook for debugger
	G = {
		table: table
	}

	textedit.setTable(table);

	/**
	 * Create a new jPlayer for the original recording.
	 *
	 * @param {String} audio_url
	 * @param {String} format Audio format, e.g. oga|mp3|...
	 */
	function add_original_audio(audio_url, format) {
		var opts = {};
		opts[format] = audio_url;
		$("#player").jPlayer({
			ready: function() {
				$(this).jPlayer('setMedia', opts);
				$('#play-btn').prop('disabled', false);
			},
			supplied: format,
			timeupdate: function(e) {
				play_pos = e.jPlayer.status.currentTime;
				$('#pos').text(Math.round(play_pos * 10000) / 10000);
				var ev = new ldc.waveform.WaveformCursorEvent(e.jPlayer, play_pos);
				ebus.queue(ev);
				if (play_pos >= sel_beg + sel_dur) {
					$('#stop-btn').trigger('click');
				}
			}
		});
	}

	/**
	 * Create a new jPlayer for given respeaking.
	 *
	 * @param {String} audio_url
	 * @param {String} format Audio format, e.g. oga|mp3|...
	 * @param {Number} id A unique ID for the audio.
	 */
	function add_respeaking_audio(audio_url, format, id) {
		var opts = {};
		opts[format] = audio_url;

		$('<div/>', {id:'player-' + id}).appendTo('#players').jPlayer({
			ready: function() {
				$(this).jPlayer('setMedia', opts);
			},
			supplied: format,
			timeupdate: function(e) {
				if (e.jPlayer.status.currentTime >= map_beg + map_dur) {
					jplayer(sel_sl).jPlayer('stop');
					$('#play-rspk-btn').button('reset');
				}
			}
		});
	}

	function add_swimlane(map) {
		var $picture = $('<div class="swimlane"></div>').appendTo($('#pictures'));
		var $container = $('<div class="swimlane"></div>').appendTo($('#swimlane-containers'));
		var $swimlane = $('<div/>').appendTo($container);
		var swimlane = new ldc.aikuma.SwimLane($swimlane[0], WAVEFORM.width, ebus);
		$swimlane.attr('id', 'swimlane-' + swimlane.id);
		$picture.attr('id', 'picture-' + swimlane.id);

		map.split(/\s+/).forEach(function(line) {
			var a = line.split(/[,:]/)
				.map(function(x){return parseInt(x)});
			if (a.length == 4) {
				table.addRow([
					null,
					a[0] / 16000,
					(a[1] - a[0]) / 16000,
					null,
					swimlane.id,
					a[2] / 16000,
					(a[3] - a[2]) / 16000
				]);
			}
		});

		swimlane.setTable(table);
		swimlane.display(WAVEFORM.beg, WAVEFORM.dur);
		return swimlane;
	}

	function add_user_image(recording_uuid, i) {
		var url = AIKUMA_BASE + '/recordings/' + recording_uuid + '.json';
		download(url)
		.then(function(json) {
			var o = JSON.parse(json);
			var image_url = AIKUMA_BASE + '/images/' + o.creator_uuid + '.small.jpg';

			// face detection
			var image = new Image;
			image.onload = function() {
				var opts = {
					"canvas" : ccv.grayscale(ccv.pre(image)),
					"cascade" : cascade,
					"interval" : 5,
					"min_neighbors" : 1,
					"async" : true,
					"worker" : 1
				}
				ccv.detect_objects(opts)(function(r) {
					var x = 0;
					var y = 0;
					var el = $('#picture-' + i)[0];
					if (r.length > 0) {
						x = el.clientWidth / 2 - (r[0].x + r[0].width / 2);
						y = el.clientHeight / 2 - (r[0].y + r[0].height / 2);
					}
					el.style.backgroundImage = 'url(' + image_url + ')';
					el.style.backgroundPosition = x + 'px ' + y + 'px';
				});

			};
			image.src = image_url;

			var $img = $('<img src="' + image_url + '"/>').appendTo('#hidden-container');
			$('#picture-' + i).popover({
				placement: 'right',
				trigger: 'hover',
				html: true,
				content: $img,
				container: '#popup-container'
			});

		})
		.fail(function(e) {
			console.log('failed to get user image url');
			console.log(e);
		})
	}

	// waveform setup
	function setup_waveform(raw_data) {
		var buffer = new ldc.waveform.WaveformBuffer(raw_data);
		var $canvas = $('#waveform');
		$canvas.attr('width', WAVEFORM.width + 'px');
		$canvas.attr('height', '100px');
		var $scrollbar = $('#scrollbar');
		var waveform = new ldc.waveform.RichWaveform(buffer, $canvas[0], 0, ebus);
		waveforms[waveform.id] = waveform;
		var wset = new ldc.waveform.WaveformSet;
		wset.addWaveform(waveform);
		wset.display(WAVEFORM.beg, WAVEFORM.dur);
		var scrollbar = new ldc.waveform.Scrollbar(wset, $scrollbar[0], ebus);
		scrollbar.setWidth(WAVEFORM.width);
	}

	/**
	 * @method download
	 * @param {String} url
	 * @param {String} [type] If the value is "array_buffer", the url is
	 *   downloaded as an ArrayBuffer. Otherwise, it's downloaded as text.
	 * @return {Promise} A promise for the downloaded data.
	 */
	function download(url, type) {
		var deferred = Q.defer();
		var xhr = new goog.net.XhrIo;
		if (type == 'array_buffer') {
			xhr.setResponseType(goog.net.XhrIo.ResponseType.ARRAY_BUFFER);
		}
		else {
			xhr.setResponseType(goog.net.XhrIo.ResponseType.TEXT);
		}
		xhr.listen(goog.net.EventType.COMPLETE, function(e) {
			deferred.resolve(e.target.getResponse());
		});
		xhr.listen(goog.net.EventType.ERROR, function(e) {
			deferred.reject(e);
		})
		xhr.send(url);
		return deferred.promise;
	}

	function process_aikuma_recording_index(json) {
		var o = JSON.parse(json);

		add_original_audio(AIKUMA_BASE + '/recordings/' + o.original + '.ogg', 'oga');

		download(AIKUMA_BASE + '/recordings/' + o.original + '.shape', 'array_buffer')
		.then(setup_waveform)
		.fail(function(e) {
			console.log('shape file download failed');
			console.log(e);
		});

		o.respeakings.forEach(function(uuid, i) {
			download(AIKUMA_BASE + '/recordings/' + uuid + '.map')
			.then(function(map) {
				var sl = add_swimlane(map);
				add_respeaking_audio(AIKUMA_BASE + '/recordings/' + uuid + '.ogg', 'oga', sl.id);
				add_user_image(uuid, sl.id);
			})
			.fail(function(e) {
				console.log('failed to add swim lane for ' + i);
				console.log(e);
			});
		});
	}

	var AIKUMA_BASE = '/transcriber/test/data/aikuma';

	download(AIKUMA_BASE + '/sample.index.json')
	.then(process_aikuma_recording_index)
	.fail(function(e) {
		console.log('failed starting up the app');
		console.log(e);
	})
});
