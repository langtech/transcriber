goog.require('ldc');
goog.require('goog.net.XhrIo');
goog.require('goog.cssom');

jQuery(function($) {
	var WAVEFORM = {
		width: 750,
		beg: 0,
		dur: 30,
		max_width: 800,
		min_dur: 5
	};

	var AIKUMA_BASE = '/transcriber/test/data/aikuma';

	var main = this;
	var play_pos = 0.0;
	var sel_beg = 0.0;
	var sel_dur = 0.0;
	var sel_waveform;
	var sel_rid;
	var sel_sl;
	var map_beg = 0.0;
	var map_dur = 0.0;

	var cur_audio;  // uuid of currently loaded original audio
	
	var ebus = new ldc.event.EventBus;
	var table = new ldc.datamodel.Table([
		'waveform',    // waveform id (only meaningful for current session)
		'offset',      // start offset of the region
		'length',      // lenght of the region
		'transcript',  // transcript for the region
		'translation', // translation of the transcript
		'swimlane',    // swimlane id; null if waveform id is not null, or vice versa
		'mapoff',      // if this is re-spoken region, offset into the respeaking
		'maplen'       // length of the respeaking
		], ebus);
	var segment_filter = function(seg) {
		return seg.value('waveform') != null;
	};
	var textedit = new ldc.textdisplay.TextEdit(
		'textpanel', ldc.aikuma.AikumaSegment, ebus, segment_filter
	);
	var waveforms = {};


	var aikuma = new ldc.aikuma.AikumaFolder;

	function get_waveform_id() {
		return Object.keys(waveforms)[0];
	}

	function get_waveform() {
		return waveforms[get_waveform_id()];
	}

	function select_segment(rid) {
		var beg = table.getCell(rid, 'offset');
		var dur = table.getCell(rid, 'length');
		var wid = get_waveform_id();
		var e = new ldc.waveform.WaveformSelectEvent(main, beg, dur, wid, rid);
		ebus.queue(e);
	}

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

	// New Transcript menu
	$('#new-transcript-menu').on('click', function() {
		var wid = Object.keys(waveforms)[0];
		var all_rids = table.find('waveform', function(v){return v != null});
		for (var i=0; i < all_rids.length; ++i) {
			var rid = all_rids[i];
			table.deleteRow(rid);
		}
		var big_segment = [wid, 0, waveforms[wid].length()];
		table.addRow(big_segment);
		textedit.setTable(table);
	});

	// Open Transcript menu

	$('#file-dialog').on('shown.bs.modal', function() {
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
		parse_transcription_file(file)
		.then(function(obj) {
			var wid = Object.keys(waveforms)[0];
			var segs = table.find('waveform', function(v){return v==wid});
			segs.forEach(function(rid) {
				table.deleteRow(rid);
			});
			for (var i=0, item; item = obj.data[i]; ++i) {
				var u = [wid, item.offset, item.length, item.transcript, item.translation];
				table.addRow(u);
			}
			textedit.setTable(table);
		})
		.fail(function(e) {
			console.log(e.stack);
			alert('Unable to parse transcription file.');
		});
	});

	// Open Folder menu

	$('#folder-dialog').on('shown.bs.modal', function() {
		document.forms['local-folder-form'].reset();
		$('#progress-bar').css('width', '0%');
		$('#open-local-folder-btn').prop('disabled', true);
		$('#close-folder-dialog-btn').prop('disabled', true);
	});

	$('#local-folder-input').on('change', function(e) {
		if ($('#local-folder-input').prop('files').length > 0) {
			$('#open-local-folder-btn').prop('disabled', false);
		}
	});

	$('#open-local-folder-btn').on('click', function(e) {
		$('#open-local-folder-btn').prop('disabled', true);
		aikuma.loadFolder($('#local-folder-input').prop('files'), function(x) {
			$('#progress-bar').css('width', Math.round(x) + '%');
			if (x >= 100) {
				aikuma.buildRecordingGroups();

				$('#close-folder-dialog-btn').prop('disabled', false);
				var $list = $('#recording-list');
				$list[0].innerHTML = '';
				for (var uuid in aikuma.recording_groups) {
					if (aikuma.recordings.hasOwnProperty(uuid)) {
						var json = aikuma.recordings[uuid].json;
						if (json) {
							var title = json.recording_name;
							var el = $('<option>' + title + '</option>').appendTo($list);
							el.attr('value', uuid);
							if (aikuma.recordings[uuid].wav == null) {
								el.attr('disabled', true);
							}
						}
					}
				}
			}
		});
	});


	$('#open-selected-recording').on('click', function(e) {
		$('#players')[0].innerHTML = '';
		$('#pictures')[0].innerHTML = '';
		$('#swimlane-containers')[0].innerHTML = '';

		var $option = $('#recording-list option:selected').first();
		var uuid = cur_uuid = $option.attr('value');
		var grp = aikuma.recording_groups[uuid];
		var file = aikuma.recordings[grp.original].wav;
		var url = URL.createObjectURL(file);
		add_original_audio(url, 'wav');
		
		decode_audio_file(file, function(audio_buffer) {
			var shape = ldc.waveform.Utils.makeShapeFile(
				WAVEFORM.max_width, WAVEFORM.min_dur, audio_buffer, 1
			);
			setup_waveform(shape);

			// create new transcript
			$('#new-transcript-menu').trigger('click');
		});

		var make_cb = function(respeaking) {
			return function() {
				var sl = add_swimlane(this.result);
				var image_file = aikuma.users[respeaking.json.creator_uuid]['small.jpg'];
				var image_url = URL.createObjectURL(image_file);
				var audio_url = URL.createObjectURL(respeaking.wav);
				add_user_image(image_url, sl.id);
				add_respeaking_audio(audio_url, 'wav', sl.id);
			};
		}

		for (var i=0, item; item = aikuma.recordings[grp.respeakings[i]]; ++i) {
			if (item.json && item.wav) {
				var reader = new FileReader;
				reader.onload = make_cb(item);
				reader.readAsText(item.map);
			}
		}
	});

	// Save Transcription Menu

	$('#save-file-dialog').on('shown.bs.modal', function() {
	});

	$('#save-file-btn').on('click', function(e) {
		var rows = [
			';; user someuser',
			';; original_uuid ' + cur_uuid
		];
		table.forEach(function(row) {
			rows.push([
				row.value('offset'),
				row.value('offset') + row.value('length'),
				'speaker:',
				row.value('transcript'),
				row.value('translation')
			].join('\t'));
		}, function(row) {
			return row.value('mapoff') == null;
		});
		rows.push('');
		var blob = new Blob([rows.join('\n')], {type: "text/plain;charset=utf-8"});
		var filename = $('#save-file-input').val();
		saveAs(blob, filename);
	});

	// open remote sample files

	$('#open-remote-trans').on('click', function() {
		download(AIKUMA_BASE + '/sample.index.json')
		.then(process_aikuma_recording_index)
		.fail(function(e) {
			console.log('failed starting up the app');
			console.log(e);
		});
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
		table: table,
		aikuma: aikuma
	}

	textedit.setTable(table);


	/**
	 * Read PCM samples from the audio file.
	 *
	 * Seems to be a little unreliable. For example, sometimes rendering is
	 * not complete. Also, various random amount of offset was added at the
	 * beginning.
	 *
	 * @param {File} file Audio file.
	 * @param {Number} channels Number of channels to extract (default=1).
	 * @param {Function} callback A function taking an AudioBuffer object.
	 */
	function read_audio_file(file, channels, callback) {
		if (channels == null) {
			channels = 1;
		}
		url = URL.createObjectURL(file);
		audio = new Audio(url);

		audio.addEventListener('durationchange', function(e) {
			var context = new webkitOfflineAudioContext(channels, 44100 * audio.duration, 44100);
			var node1 = context.createMediaElementSource(audio);
			var node3 = context.destination; //context.createMediaStreamDestination();

			node1.connect(node3);

			context.oncomplete = function(e) {
				callback(e.renderedBuffer);
			};

			context.startRendering();
			audio.play();

		});

		audio.load();
	}

	/**
	 * Decode audio file and get PCM samples.
	 *
	 * Seems to be more accurate than the method using OfflineAudioContext.
	 * However, cannot handle large audio file, e.g. those longer than 20 min.
	 *
	 * @param {File} file Audio file.
	 * @param {Function} callback A function taking an AudioBuffer object.
	 */
	function decode_audio_file(file, callback) {
		var reader = new FileReader;
		reader.onload = function(e) {
			var context = new webkitAudioContext;
			context.decodeAudioData(this.result, function(decoded) {
				callback(decoded);
			}, function() {
				console.log('decoding error');
			});
		};
		reader.readAsArrayBuffer(file);
	}

	/**
	 * Parse a transcription File object.
	 *
	 * @method parse_transcription_file
	 * @param {File} file A File object containing json.
	 * @return A promise on parsed object.
	 */
	function parse_transcription_file(file) {
		var deferred = Q.defer();
		var reader = new FileReader;
		reader.onload = function(e) {
			try {
				var obj = ldc.aikuma.AikumaTranscript.parse(reader.result);
				deferred.resolve(obj);
			} catch (e) {
				deferred.reject(e);
			}
		};
		reader.readAsText(file);
		return deferred.promise;
	}


	/**
	 * Create a new jPlayer for the original recording.
	 *
	 * @param {String} audio_url
	 * @param {String} format Audio format, e.g. oga|mp3|...
	 */
	function add_original_audio(audio_url, format) {
		var opts = {};
		opts[format] = audio_url;
		var $player = $('<div id="player"/>').appendTo('#players');
		$player.jPlayer({
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

	function add_user_image(image_url, i) {

		var set_image = function(r) {
			var x = 0;
			var y = 0;
			var el = $('#picture-' + i)[0];
			if (r.length > 0) {
				x = el.clientWidth / 2 - (r[0].x + r[0].width / 2);
				y = el.clientHeight / 2 - (r[0].y + r[0].height / 2);
			}
			el.style.backgroundImage = 'url(' + image_url + ')';
			el.style.backgroundPosition = x + 'px ' + y + 'px';
		};

		var image = new Image;
		image.onload = function() {
			var opts = {
				"canvas" : ccv.grayscale(ccv.pre(image)),
				"cascade" : cascade,
				"interval" : 5,
				"min_neighbors" : 1,
				"async" : false,
				"worker" : 1
			}
			var r = ccv.detect_objects(opts);
			set_image(r);
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
	}

	function add_user_image_from_web(recording_uuid, i) {
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
		waveforms = {};
		$('#waveform-area')[0].innerHTML = '';
		var buffer = new ldc.waveform.WaveformBuffer(raw_data);
		var $canvas = $('<canvas/>').appendTo('#waveform-area');
		var $scrollbar = $('<div/>').appendTo('#waveform-area');
		$canvas.attr('width', WAVEFORM.width + 'px');
		$canvas.attr('height', '100px');
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
				add_user_image_from_web(uuid, sl.id);
			})
			.fail(function(e) {
				console.log('failed to add swim lane for ' + i);
				console.log(e);
			});
		});
	}

	document.addEventListener('keydown', function(e) {
		var special = [];
		if (e.ctrlKey)
			special.push('ctrl');
		if (e.shiftKey)
			special.push('shift');
		if (e.altKey)
			special.push('alt');
		if (e.metaKey)
			special.push('meta');
		var c = String.fromCharCode(e.keyCode);
		if (c == "\t") {
			e.preventDefault();
			if (e.shiftKey) {
				$('#stop-btn').trigger('click');
			}
			if (sel_rid == null) {
				sel_beg = 0;
				sel_dur = get_waveform().length();
			}
			$('#play-btn').trigger('click');
		}
		else if (e.keyCode == 8 && e.ctrlKey) {  // ctrl+backspace
			e.preventDefault();
			if (sel_rid != null) {
				var beg = table.getCell(sel_rid, 'offset');
				var end = beg + table.getCell(sel_rid, 'length');
				var prev_row = null;
				var prev_gap = 999999;
				table.forEach(function(row) {
					if (row.value('waveform') != null) {
						// this is a real segment, a segment on the original audio
						var beg1 = row.value('offset');
						var end1 = beg1 + row.value('length');
						if (end1 <= beg && prev_gap > beg - end1) {
							prev_row = row;
							prev_gap = beg - end1;
						}
					}
				});
				if (prev_row != null) {
					var new_beg = prev_row.value('offset');
					var new_dur = end - new_beg;
					var update = {length: new_dur};
					var e = new ldc.datamodel.TableUpdateRowEvent(main, prev_row.rid(), update);
					ebus.queue(e);
					e = new ldc.datamodel.TableDeleteRowEvent(main, sel_rid);
					ebus.queue(e);
					table.deleteRow(sel_rid);
					select_segment(prev_row.rid());
				}
			}
		}
		else if (e.keyCode == 13) {  // return
			var t = play_pos;
			e.preventDefault();
			var rows = [];
			table.forEach(function(row) {
				if (row.value('waveform') != null) {
					// this is a real segment, a segment on the original audio
					var beg = row.value('offset');
					var end = beg + row.value('length');
					if (t > beg && t < end) {
						rows.push(row);
					}
				}
			});
			for (var i=0, row; row = rows[i]; ++i) {
				var beg = row.value('offset');
				var end = beg + row.value('length');
				var new_length = t - beg;
				var update = {length:new_length};
				var e = new ldc.datamodel.TableUpdateRowEvent(main, row.rid(), update);
				ebus.queue(e);
				var new_row = {offset: t, length: end - t, waveform: get_waveform_id()};
				var new_rid = ldc.datamodel.Table.getNewRid();
				e = new ldc.datamodel.TableAddRowEvent(main, new_rid, new_row);
				ebus.queue(e);
				select_segment(new_rid);
			}
		}
		//console.log('key code: ' + e.keyCode);
	});

});

function Transcriber() {
}

