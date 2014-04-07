goog.require('ldc');
goog.require('goog.cssom');

jQuery(function($) {
	var WAVEFORM = {
		width: 720,
		beg: 0,
		dur: 30,
		max_width: 800,
		min_dur: 5
	};

	var AIKUMA_BASE = '/transcriber/test/data/aikuma';

	var main = this;
	var cur_pos = null;
	var play_pos = 0.0;
	var sel_beg = 0.0;
	var sel_dur = 0.0;
	var sel_waveform;
	var sel_rid;
	var sel_sl;
	var map_beg = 0.0;
	var map_dur = 0.0;

	var cur_uuid;   // uuid of currently loaded audio file
	var cur_file_meta;  // metadata of currently loaded transcript
	var cur_audio;  // uuid of currently loaded original audio
	
	var ebus = new ldc.event.EventBus;

	var table = new ldc.datamodel.Table([
		'waveform',    // waveform id (null if not bound to a waveform)
		'offset',      // start offset of the region
		'length',      // lenght of the region
		'speaker',     // speaker
		'transcript',  // transcript for the region
		'translation', // translation of the transcript
		'swimlane',    // swimlane id (null if not bound to a swimlane)
		'mapoff',      // if this is re-spoken region, offset into the respeaking
		'maplen'       // length of the respeaking
		], ebus);

	/**
	 * @return {Array} Array of segments that are not swimlane segments.
	 */
	function transcript_segments() {
		return table.find('swimlane', function(v) {
			return v == null;
		});
	}

	/**
	 * Tells whether the segment is a transcript segment as opposed to a
	 * swimlane segment.
	 *
	 * @return {Boolean}
	 */
	function is_transcript_segment(seg) {
		return seg.value('swimlane') == null;
	};

	var textedit = new ldc.textdisplay.TextEdit(
		'textpanel', ldc.aikuma.AikumaSegment, ebus, is_transcript_segment
	);

	var waveforms = {};

	// swimlanes is for swimlanes of annotation (commentary) segments
	var swimlanes = {
		list: [],

		init: function() {
			var that = this;

			// handle WaveformWindowEvent
			this.wwe_handler = {
				handleEvent: function(e) {
					that.list.forEach(function(sl) {
						sl.display(e.args().beg, e.args().dur);
					});
				}
			};

			ebus.connect(ldc.waveform.WaveformWindowEvent, this.wwe_handler);
		},

		tear_down: function() {
			this.list.forEach(function(sl) {sl.tearDown()});
			this.list = [];
			ebus.disconnect(ldc.waveform.WaveformWindowEvent, this.wwe_handler);
		},

		select_segment: function(param) {
			rspk_players.stop(sel_sl);
			$('#play-rspk-btn').button('reset');
			map_beg = param.mapoff;
			map_dur = param.maplen;
			sel_sl = param.swimlane_id;
			this.list.forEach(function(sl) {
				if (sl.id != sel_sl)
					sl.clearSelection();
			});
			ebus.queue(new ldc.waveform.WaveformRegionEvent(main, param.offset, param.length));
		},

		add: function(map) {
			var $picture = $('<div class="swimlane"></div>').appendTo($('#pictures'));
			var $container = $('<div class="swimlane"></div>').appendTo($('#swimlane-containers'));
			var $swimlane = $('<div/>').appendTo($container);
			var swimlane = new ldc.aikuma.SwimLane($swimlane[0], WAVEFORM.width, table);
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
						null,
						swimlane.id,
						a[2] / 16000,
						(a[3] - a[2]) / 16000
					]);
				}
			});

			swimlane.setTable(table);
			swimlane.display(WAVEFORM.beg, WAVEFORM.dur);

			this.list.push(swimlane);
			swimlane.segmentSelected.connect(this, 'select_segment');

			return swimlane;
		}
	};
	swimlanes.init();

	// swimlane_stack is for the transcription segments
	var swimlane_stack = {
		widget: new ldc.aikuma.SwimLaneStack(
			document.getElementById('speaker-swimlanes'),
			table,
			is_transcript_segment
		),

		init: function(w, beg, dur) {
			var that = this;

			// handle WaveformWindowEvent
			this.wwe_handler = {
				handleEvent: function(e) {
					that.widget.display(e.args().beg, e.args().dur);
				}
			};

			// handle WaveformSelectEvent
			this.wse_handler = {
				handleEvent: function(e) {
					var spkr = table.getCell(e.args().rid, 'speaker');
					var sl = that.widget.getSwimLaneForSpeaker(spkr);
					sl.selectSegment(e.args().rid);
				}
			};

			this.widget.setWidth(w);
			this.widget.display(beg, dur);
			table.rowAdded.connect(this.widget, 'handleRowAdded');
			table.rowDeleted.connect(this.widget, 'handleRowDeleted');
			table.rowUpdated.connect(this.widget, 'handleRowUpdated');
			this.widget.segmentSelected.connect(this, 'select_segment');
			ebus.connect(ldc.waveform.WaveformWindowEvent, this.wwe_handler);
			ebus.connect(ldc.waveform.WaveformSelectEvent, this.wse_handler);
		},

		tear_down: function() {
			this.widget.tearDown();
			ebus.disconnect(ldc.waveform.WaveformWindowEvent, this.wwe_handler);
			ebus.disconnect(ldc.waveform.WaveformSelectEvent, this.wse_handler);
			table.rowAdded.disconnect(this.widget);
			table.rowDeleted.disconnect(this.widget);
			table.rowUpdated.disconnect(this.widget);
		},

		select_segment: function(param) {
			sel_beg = param.offset;
			sel_dur = param.length;
			sel_rid = param.rid;
			sel_waveform = get_waveform_id();
			$('#sel-beg').text(Math.round(sel_beg * 10000) / 10000);
			$('#sel-dur').text(Math.round(sel_dur * 10000) / 10000);
			$('#create-seg-btn').prop('disabled', true);
			$('#remove-seg-btn').prop('disabled', false);

			var rwf = get_waveform();  // rich waveform
			if (rwf != null) {
				var reg = rwf.getSelection();
				rwf.updateRegion(reg.id, sel_beg, sel_dur, rwf.selection_color_dark);
				rwf.linkRegion(reg.id, sel_rid);
			}

			textedit.findSegment(sel_rid).focus();
		}
	};
	swimlane_stack.init(WAVEFORM.width, WAVEFORM.beg, WAVEFORM.dur);


	// Audio player for the original audio.
	var audio = {
		player: new ldc.mediaplayer.AudioPlayer,
		beg_time: 0,
		end_time: 0,

		init: function(url, callback) {
			this.ready_callback = callback;
			this.player.setAudioUrl(url);
			this.player.timeUpdated.connect(this, 'update_time');
			this.player.playerReady.connect(this, 'ready_callback');
		},

		update_time: function(t) {
			play_pos = t;
			document.getElementById('pos').textContent = t.toFixed(4);
			var ev = new ldc.waveform.WaveformCursorEvent(this.player, t);
			ebus.queue(ev);
			if (this.end_time != null && t >= this.end_time)
				document.getElementById('stop-btn').dispatchEvent(new Event('click'));
			move_waveform(t);
		},

		play_span: function(beg, end) {
			this.player.pause();
			this.beg_time = beg;
			this.player.seek(beg);
			this.end_time = end;
			this.player.play();
		},

		pause: function() {
			this.player.pause();
		},

		stop: function() {
			this.player.pause();
			this.player.seek(this.beg_time);
		},

		resume: function() {
			this.player.play();
		}
	};


	// Audio player class for respeaking audio.
	function SimplePlayer(url) {
		this.audio = new Audio;
		this.audio.setAttribute('src', url);
		var that = this;
		this.audio.addEventListener('timeupdate', function(e) {
			if (that.audio.currentTime >= that.cur_end) {
				that.stop();
				$('#play-rspk-btn').button('reset');
			}
		});
	}

	SimplePlayer.prototype.play = function(beg, end) {
		this.cur_beg = beg;
		this.cur_end = end;
		this.audio.currentTime = beg;
		this.audio.play();
	}

	SimplePlayer.prototype.stop = function() {
		this.audio.pause();
	}

	var rspk_players = {
		players: {},

		add: function(id, url) {
			this.players[id] = new SimplePlayer(url);
		},

		play: function(id, beg, end) {
			if (this.players[id])
				this.players[id].play(beg, end);
		},

		stop: function(id) {
			if (this.players[id])
				this.players[id].stop();
		}
	}


	var aikuma = new ldc.aikuma.AikumaFolder;

	function get_waveform_id() {
		for (var k in waveforms) {
			if (waveforms.hasOwnProperty(k)) {
				return waveforms[k].id;
			}
		}
	}

	function get_waveform() {
		for (var k in waveforms) {
			if (waveforms.hasOwnProperty(k)) {
				return waveforms[k];
			}
		}
	}

	function select_segment(rid) {
		var beg = table.getCell(rid, 'offset');
		var dur = table.getCell(rid, 'length');
		var wid = get_waveform_id();
		var e = new ldc.waveform.WaveformSelectEvent(main, beg, dur, wid, rid);
		ebus.queue(e);
	}

	function alert2(msg, cls) {
		$('<div/>')
		.addClass('alert alert-dismissable fade in')
		.addClass('alert-' + cls)
		.appendTo($('#error-pane'))
		.text(msg)
		.prepend(
			$('<button>&times</button>')
			.addClass('close')
			.attr({
				type: 'button',
				'data-dismiss': 'alert'
			})
		);
	}

	function warn(msg) {
		alert2(msg, 'warning');
	}

	$('#play-btn').on('click', function(e) {
		var text = $(this).text().trim();
		if (text == 'Play') {
			var end = sel_beg + sel_dur;
			if (sel_beg == end)
				end = get_waveform().length();
			audio.play_span(sel_beg, end);
			$(this).button('play');
		}
		else if (text == 'Resume') {
			audio.resume();
			$(this).button('play');
		}
		else if (text == 'Pause') {
			audio.pause();
			$(this).button('pause');
		}
		$('#stop-btn').prop('disabled', false);
	});

	$('#stop-btn').on('click', function() {
		audio.stop();
		$('#play-btn').button('reset');
		$('#stop-btn').prop('disabled', true);
	});

	$('#create-seg-btn').on('click', function() {
		var rid = ldc.datamodel.Table.getNewRid();
		ebus.queue(new ldc.datamodel.TableAddRowEvent(main, rid, {
			offset: sel_beg,
			length: sel_dur,
			waveform: sel_waveform,
			speaker: 'speaker'
		}));
	});

	$('#remove-seg-btn').on('click', function() {
		var wid = table.getCell(sel_rid, 'waveform');
		var waveform = waveforms[wid];
		waveform.unlinkRegion(waveform.getSelection().id);
		var e = new ldc.datamodel.TableDeleteRowEvent(table, sel_rid);
		table.deleteRow(sel_rid);
		ebus.queue(e);
		$('#remove-seg-btn').prop('disabled', true);
		$('#create-seg-btn').prop('disabled', false);
	});

	$('#play-rspk-btn').on('click', function() {
		var text = $(this).text().trim();
		if (text == 'Play Respeaking') {
			rspk_players.play(sel_sl, map_beg, map_beg + map_dur);
			$(this).button('play');
		}
		else if (text == 'Stop') {
			rspk_players.stop(sel_sl);
			$(this).button('reset');
		}
	});

	// New Transcript menu
	$('#new-transcript-menu').on('click', table_clear_transcript);

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
		parse_transcription_file(file, ldc.aikuma.AikumaTranscript.parse)
		.then(load_transcript)
		.fail(handle_error);
	});

	// Open Elan Transcript menu

	$('#dialog-open-elan').on('shown.bs.modal', function() {
		document.forms['form-elan-file'].reset();
		$('#btn-open-elan-file').prop('disabled', true);
	});

	$('#input-elan-file').on('change', function(e) {
		if ($('#input-elan-file').prop('files').length > 0) {
			$('#btn-open-elan-file').prop('disabled', false);
		}
	});

	$('#btn-open-elan-file').on('click', function() {
		var file = $('#input-elan-file').prop('files')[0];
		parse_transcription_file(file, ldc.aikuma.ElanTranscript.parse)
		.then(load_transcript)
		.fail(handle_error);

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
				$('#close-folder-dialog-btn').prop('disabled', false);
				set_recording_list();
			}
		});
	});


	$('#open-selected-recording').on('click', function(e) {
		var $option = $('#recording-list option:selected').first();
		var uuid = $option.attr('value');
		open_audio_group(uuid);
	});

	// Download Transcription Menu

	$('#download-file-dialog').on('shown.bs.modal', function() {
	});

	$('#download-file-btn').on('click', function(e) {
		var uuid = cur_uuid == null ? cur_file_meta.original_uuid : cur_uuid;
		var blob = ldc.aikuma.AikumaTranscript.toBlob(table, {
			original_uuid: uuid
		});
		var filename = $('#download-file-input').val();
		saveAs(blob, filename);
	});

	// Download ELAN menu

	$('#download-elan-dialog').on('shown.bs.modal', function() {
	});

	$('#download-elan-btn').on('click', function(e) {
		var uuid = cur_uuid == null ? cur_file_meta.original_uuid : cur_uuid;
		var blob = ldc.aikuma.ElanTranscript.toBlob(table, {
			original_uuid: uuid
		});
		var filename = $('#download-elan-input').val();
		saveAs(blob, filename);
	});
	
	// open remote sample files

	$('#open-remote-trans').on('click', function() {
		download(AIKUMA_BASE + '/index.json')
		.then(function(data) {
			aikuma.loadStaticWebIndex(JSON.parse(data), AIKUMA_BASE);
			set_recording_list();
		})
		.fail(handle_error);
		// TODO: notify user of the error
	});


	// open from aikuma app

	$('#open-from-aikuma').on('click', function() {
		download('/index.json')
		.then(function(data) {
			aikuma.loadWebIndex(JSON.parse(data));
			set_recording_list();
		})
		.fail(handle_error);
	});


	// initialize event bus connections
	ebus.connect(ldc.waveform.WaveformCursorEvent, {
		handleEvent: function(e) {
			cur_pos = e.args();
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
			rspk_players.stop(sel_sl);
			$('#play-rspk-btn').button('reset');
			map_beg = map.offset;
			map_dur = map.length;
			sel_sl = slid;
		}
	});

	// a hook for debugger
	G = {
		table: table,
		textedit: textedit,
		aikuma: aikuma
	}

	textedit.setTable(table);



	/**
	Re-populate the recording list dropdown.
	@method set_recording_list
	*/
	function set_recording_list() {
		var $list = $('#recording-list');
		$list[0].innerHTML = '';

		var originals = aikuma.getOriginals();
		Object.keys(originals).sort(function(a,b) {
			var s = originals[a].name.toLowerCase();
			var t = originals[b].name.toLowerCase();
			return s < t ? -1 : (s > t ? 1 : 0);
		}).forEach(function(uuid) {
			var json = originals[uuid];
			if (json) {
				var title = json['name'];
				var el = $('<option>' + title + '</option>').appendTo($list);
				el.attr('value', uuid);
				if (aikuma.getRecordingUrl(uuid) == null) {
					el.attr('disabled', true);
				}
			}
		});
	}


	/**
	Parse a transcription File object.
	
	@method parse_transcription_file
	@param {File} file A File object containing json.
	@param {Function} parse_func A parser function. 
	@return A promise on parsed object.
	*/
	function parse_transcription_file(file, parse_func) {
		var deferred = Q.defer();
		var reader = new FileReader;
		reader.onload = function(e) {
			try {
				var obj = parse_func(reader.result);
				deferred.resolve(obj);
			} catch (e) {
				deferred.reject(e);
			}
		};
		reader.readAsText(file);
		return deferred.promise;
	}


	/**
	Load transcript and audio into the tool.
	@param {object} obj Parsed transcript.
	  @param {object} meta
	  @param {array} data An array of objects with the following properties
	    - offset
	    - length
	    - speaker
	    - transcript
	    - translation
	*/
	function load_transcript(obj) {
		return open_audio_group(obj.meta.original_uuid)
		.then(function() {
			return obj;
		}, function(e) {
			warn(e);
			return obj;
		})
		.then(function(obj) {
			table_clear_transcript();
			cur_file_meta = obj.meta;
			var wid = get_waveform_id();
			for (var i=0, item; item = obj.data[i]; ++i) {
				var u = [wid, item.offset, item.length, item.speaker, item.transcript, item.translation];
				table.addRow(u);
			}
			textedit.setTable(table);
		});
	}

	/**
	 * Remove transcript segments from table.
	 *
	 * @method table_clear_transcript
	 */
	function table_clear_transcript() {
		var segs = table.find('swimlane', function(v) {return v==null});
		segs.forEach(function(rid) {
			table.deleteRow(rid);
		});
	}


	/**
	 * Remove swimlane segments from table.
	 *
	 * @method table_clear_swimlane
	 */
	function table_clear_swimlane() {
		var segs = table.find('swimlane', function(v) {return v!=null});
		segs.forEach(function(rid) {
			table.deleteRow(rid);
		});
	}


	/**
	Download and decode audio file.

	@param {String} url
	@param {Function} callback A function taking an AudioBuffer object.
	*/
	function decode_audio_url(url, callback) {
		download(url, 'array_buffer')
		.then(function(data) {
			var context = new webkitAudioContext;
			context.decodeAudioData(data, callback, function() {
				console.log('decoding error');
			});
		});
	}


	/**
	Render shape file. Re-associate segments to the new waveform.

	@method display_waveform
	@param {ldc.waveform.WaveformBuffer} shape
	*/
	function display_waveform(shape) {
		setup_waveform(shape);

		var w = get_waveform_id();
		transcript_segments().forEach(function(rid) {
			table.updateRow(rid, {waveform:w});
		});
	}


	/**
	Load a recording and its respeakings.

	@method open_audio_group
	@param {String} uuid UUID of the original audio.
	@return {Promise} A promise for null.
	*/
	function open_audio_group(uuid) {
		$('#players')[0].innerHTML = '';
		$('#pictures')[0].innerHTML = '';
		$('#swimlane-containers')[0].innerHTML = '';

		cur_uuid = uuid;

		var deferred = Q.defer();
		var url = aikuma.getRecordingUrl(uuid);

		if (url == null)
			return Q.reject('No original audio by UUID: ' + uuid);

		add_original_audio(url, 'wav');

		// generate waveform on the fly
		var generate_waveform = function(audio_url) {
			decode_audio_url(audio_url, function(audio_buffer) {
				var shape = ldc.waveform.Utils.makeShapeFile(
					WAVEFORM.max_width, WAVEFORM.min_dur, audio_buffer, 1
				);
				display_waveform(shape);
			});			
		};

		var shape_url = aikuma.getShapeFileUrl(uuid);

		if (shape_url == null) {
			generate_waveform(url);
			deferred.resolve();
		}
		else {
			download(shape_url, 'array_buffer')
			.then(function(array_buffer) {
				display_waveform(array_buffer);
				deferred.resolve();
			})
			.fail(function(e) {
				if (e instanceof NotFoundError) {
					generate_waveform(url);
					deferred.resolve();
				}
				else {
					deferred.reject(e);
				}
			});
		}

		var process_respeaking = function(rspkuuid) {
			download(aikuma.getMapFileUrl(rspkuuid))
			.then(function(data) {
				var sl = swimlanes.add(data);
				// TODO: should be able to support multiple speakers
				var spkruuids = aikuma.getSpeakersUUIDs(rspkuuid);
				if (spkruuids != null) {
					var image_url = aikuma.getSmallSpeakerImageUrl(spkruuids[0]);
					add_user_image(image_url, sl.id);
				}
				var audio_url = aikuma.getRecordingUrl(rspkuuid);
				add_respeaking_audio(audio_url, 'wav', sl.id);
			})
			.fail(handle_error);
		};

		swimlanes.tear_down();
		table_clear_swimlane();
		swimlanes.init();

		var respeakings = aikuma.getCommentaryUUIDs(uuid);
		if (respeakings != null) {
			respeakings.forEach(function(rspkuuid) {
				process_respeaking(rspkuuid);
			});
		}

		return deferred.promise;
	}


	/**
	 * Create a new player for the original recording.
	 *
	 * @param {String} audio_url
	 * @param {String} format Audio format, e.g. oga|mp3|...
	 */
	function add_original_audio(audio_url, format) {
		audio.init(audio_url, function() {
			$('#play-btn').prop('disabled', false);
		});
	}


	/**
	 * Create a new player for given respeaking.
	 *
	 * @param {String} audio_url
	 * @param {String} format Audio format, e.g. oga|mp3|...
	 * @param {Number} id A unique ID for the audio.
	 */
	function add_respeaking_audio(audio_url, format, id) {
		rspk_players.add(id, audio_url);
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

	// Move the waveform to the new position.
	// Use event bus so that other components like scrollbar are updated
	// as well.s
	function move_waveform(t) {
		var w = get_waveform();
		if (w) {
			var wbeg = w.windowStartTime();
			var wdur = w.windowDuration();
			if (t < wbeg || t > wbeg + wdur) {
				t -= wdur / 2;
				t = Math.max(0, Math.min(t, w.length() - wdur));
				var e = new ldc.waveform.WaveformWindowEvent(main, t);
				ebus.queue(e);
			}
		}
	}

	// thrown when download() encounters 404
	function NotFoundError(msg) {
		this.name = 'NotFoundError';
		this.message = msg;
		this.stack = (new Error(msg)).stack;
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
		var xhr = new XMLHttpRequest;
		xhr.onload = function(e) {
			if (xhr.status == 404)
				deferred.reject(new NotFoundError('Not found: ' + url));
			else
				deferred.resolve(type == 'array_buffer' ? this.response : this.responseText);
		}
		xhr.onerror = function() {
			deferred.reject(e);
		}
		xhr.open('get', url, true);
		if (type == 'array_buffer')
			xhr.responseType = 'arraybuffer';
		xhr.send();
		return deferred.promise;
	}


	function handle_error(e) {
		if (e.stack)
			console.log(e.stack);
		else
			console.log((new Error(e)).stack);
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
			$('#play-btn').trigger('click');
		}
		else if (e.keyCode == 8 && e.ctrlKey && special.length == 1) {  // ctrl+backspace
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
		else if (e.keyCode == 13 && e.shiftKey && special.length == 1) {
			if (sel_rid != null)
				return;
			if (sel_dur < 0.000001)
				return;
			e.preventDefault();
			var rid = ldc.datamodel.Table.getNewRid();
			ebus.queue(new ldc.datamodel.TableAddRowEvent(main, rid, {
				waveform: get_waveform_id(),
				offset: sel_beg,
				length: sel_dur,
				speaker: 'speaker'
			}));
		}
		else if (e.keyCode == 13) {  // return (split)
			if (cur_pos == null) {
				return;
			}
			var t = cur_pos;
			e.preventDefault();

			// find overlapping segments
			var row_to_split = null;
			var overlaps = 0;
			var gap_beg = 0;
			var gap_end = get_waveform().length();
			table.forEach(function(row) {
				if (row.value('waveform') != null) {
					// this is a real segment, a segment on the original audio
					var beg = row.value('offset');
					var end = beg + row.value('length');
					if (t > beg && t < end) {
						if (row.rid() == sel_rid) {
							row_to_split = row;
						}
						overlaps += 1;
					}
					if (end <= t && end > gap_beg) {
						gap_beg = end;
					}
					if (beg >= t && beg < gap_end) {
						gap_end = beg;
					}
				}
			});

			if (overlaps == 0) {
				// There's no overlapping segments. Two new segments should be created.
				// Find a span to split.
				var rid;

				rid = ldc.datamodel.Table.getNewRid();
				ebus.queue(new ldc.datamodel.TableAddRowEvent(main, rid, {
					offset: gap_beg,
					length: t - gap_beg,
					waveform:get_waveform_id(),
					speaker: 'speaker'
				}));

				rid = ldc.datamodel.Table.getNewRid();
				ebus.queue(new ldc.datamodel.TableAddRowEvent(main, rid, {
					offset: t,
					length: gap_end - t,
					waveform: get_waveform_id(),
					speaker: 'speaker'
				}));
			}
			else if (row_to_split != null) {
				var beg = row_to_split.value('offset');
				var end = beg + row_to_split.value('length');
				var new_length = t - beg;
				var update = {length:new_length};
				var e = new ldc.datamodel.TableUpdateRowEvent(main, row_to_split.rid(), update);
				ebus.queue(e);
				var new_rid = ldc.datamodel.Table.getNewRid();
				ebus.queue(new ldc.datamodel.TableAddRowEvent(main, new_rid, {
					offset: t,
					length: end - t,
					waveform: get_waveform_id(),
					speaker: 'speaker'
				}));
				select_segment(new_rid);
			}
		}
		//console.log('key code: ' + e.keyCode);
	});

});

