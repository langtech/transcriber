(function() {

/**
 * @module ldc
 * @submodule waveform
 * @namespace waveform
 */
goog.provide('ldc.waveform.RichWaveform');
goog.require('ldc.waveform.Waveform');
goog.require('ldc.event');
goog.require('goog.dom');
goog.require('goog.style');
goog.require('goog.object');
goog.require('goog.events');

/**
 * Waveform with regions on top of it. Regions are added using the addRegion
 * method. It has a cursor that follows mouse movement, which also updates
 * its position upon receiving WaveformCursorEvent. It also has a default
 * region called 'selection' that is updated when user uses mouse to mark a
 * region or when it receives WaveformRegionEvent.
 *
 * Generates and listens on MouseMoveEvent.
 *
 * @class RichWaveform
 * @extends waveform.Waveform
 * @constructor
 * @param {WaveformBuffer} buffer
 * @param {Canvas} canvas A canvas object on the html page
 * @param {number} channel A channel of the buffer to display
 * @param {EventBus} [ebus] An EventBus object for sending and receiving
 *     mouse events.
 */
ldc.waveform.RichWaveform = function(buffer, canvas, channel, ebus) {
	goog.base(this, buffer, canvas, channel);

	// wrap the canvas element
	this.container = goog.dom.createElement('div');
	this.container.style.position = 'relative';
	this.canvas.style.cursor = 'crosshair';
	goog.dom.insertSiblingAfter(this.container, canvas);
	goog.dom.appendChild(this.container, canvas);
	this.container.style.width = this.canvas.width + 'px';

	this.regions = {}
	// Region is an object representing a region in the waveform. It has
	// following properties:
	//    html  - a DIV element
	//    pos   - start position of the region in seconds
	//    dur   - length of the region in seconds
	//    color - color of the region
	//    rid   - id of table row associated with the region

	this.cursor_id = this.addRegion(0, 0);
	this.selection_id = this.addRegion(0, 0, null, 0); // initially hidden

	// There are two classes of selections: primary and secondary. If the
	// user action on selection originates from this waveform, the selection
	// is primary. The selection is secondary otherwise. Usually, primary
	// selection has more intense color, and secondary is rendered with a
	// lighter color.
	this.selection_color = {
		'primary': 'rgba(255,0,0,0.4)',
		'secondary': 'rgba(255,0,0,0.05)'
	};

	// listen on waveform events
	this.ebus = ebus;
	if (ebus != null) {
		ebus.connect(ldc.waveform.WaveformCursorEvent, this);
		ebus.connect(ldc.waveform.WaveformRegionEvent, this);
		ebus.connect(ldc.waveform.WaveformWindowEvent, this);
		ebus.connect(ldc.waveform.WaveformSelectEvent, this);
	}

	// listen on mouse event so that we animate cursor and selection.
	this.setup_mouse_events_();
}
goog.inherits(ldc.waveform.RichWaveform, ldc.waveform.Waveform);

/**
 * Add a region to the waveform.
 *
 * @method addRegion
 * @param {Number} t Start position of the region in seconds.
 * @param {Number} [dur=0]
 * @param {String} [color=red]
 * @return {String} A unique ID for the region.
 */
ldc.waveform.RichWaveform.prototype.addRegion = function(t, dur, color) {
	var div = goog.dom.createElement('div');
	div.style.cursor = 'crosshair';
	goog.dom.appendChild(this.container, div);
	goog.events.listen(div, 'dragstart', function(e) {
		e.preventDefault();
	});

	var id = Math.random() + '';
	while (this.regions.hasOwnProperty(id)) {
		id = Math.random() + '';
	}

	var region = {
		id: id,
		html: div,
		pos: t,
		dur: dur==null || dur < 0 ? 0 : dur,
		color: color==null ? 'red' : color,
	}

	this.regions[id] = region;
	this.render_region_(region);
	return id;
}

/**
 * Update the position and size of the region.
 *
 * @method updateRegion
 * @param {String} id Region ID.
 * @param {Number} [t] New position in seconds. No change if null.
 * @param {Number} [dur] New size of the region in seconds. No change if null.
 * @param {String} [color] New color of the region.
 */
ldc.waveform.RichWaveform.prototype.updateRegion = function(id, t, dur, color) {
	if (this.regions.hasOwnProperty(id)) {
		var r = this.regions[id];
		var has_change = false;
		if (t != null) {
			if (this.t2p(r.pos) != this.t2p(t)) {
				has_change = true;
			}
			r.pos = t;
		}
		if (dur != null && r.dur != dur) {
			r.dur = dur;
			has_change = true;
		}
		if (color != null && r.color != color) {
			r.color = color;
			has_change = true;
		}
		if (has_change) {
			this.render_region_(r);
		}
	}
}

/**
 * Associate the region with a table row in the data model.
 *
 * @method linkRegion
 * @param {String} id Region ID.
 * @param {Number} rid
 */
ldc.waveform.RichWaveform.prototype.linkRegion = function(id, rid) {
	if (this.regions.hasOwnProperty(id)) {
		var r = this.regions[id];
		r.rid = rid;
		this.render_region_(r);
	}
}

/**
 * Remove the association between the region and the data model.
 *
 * @method unlinkRegion
 * @param {String} id Region ID.
 */
ldc.waveform.RichWaveform.prototype.unlinkRegion = function(id) {
	if (this.regions.hasOwnProperty(id)) {
		var r = this.regions[id];
		delete r.rid;
		this.render_region_(r);
	}
}

/**
 * Get a region object associated with the given ID.
 *
 * @method getRegion
 * @param {String} id This must be the value returned by addRegion.
 * @return {region} A region object on success. Null otherwise.
 */
ldc.waveform.RichWaveform.prototype.getRegion = function(id) {
	if (this.regions.hasOwnProperty(id)) {
		return this.regions[id];
	}
}

/**
 * Get a region object representing the waveform cursor.
 *
 * @method getCursor
 * @return {region} A region object representing the cursor.
 */
ldc.waveform.RichWaveform.prototype.getCursor = function() {
	return this.getRegion(this.cursor_id);
}

/**
 * Get a region object represention the "selected" region.
 *
 * @method getSelection
 * @return {region} A region object representing the region.
 */
ldc.waveform.RichWaveform.prototype.getSelection = function() {
	return this.getRegion(this.selection_id);
}

/**
 * Display waveform at the specified time and duration.
 * 
 * @method display
 * @param {number} t Start time of the drawing window
 * @param {number} [dur] Width of the drawing window in seconds.
 *   If not set, current window duration is kept.
 */
ldc.waveform.RichWaveform.prototype.display = function(t, dur) {
	var old_dur = this.windowDuration();
	var ret = goog.base(this, 'display', t, dur);
	goog.object.every(this.regions, function(r) {
		this.render_region_(r);
		return true; // if false, every() stops iterating
	}, this);

	if (this.ebus) {
		var d = this.windowDuration();
		if (old_dur != d) {
			var e = new ldc.waveform.WaveformWindowEvent(this, t, d);
			this.ebus.queue(e);
		}
	}
	return ret;
}


/**
 * Handle events. This is a part of the EventBus framework. EventBus expects
 * this method to exist for subscribed event receiving objects.
 *
 * @method handleEvent
 * @param {Event} e Event object.
 */
ldc.waveform.RichWaveform.prototype.handleEvent = function(e) {
	if (e instanceof ldc.waveform.WaveformCursorEvent) {
		this.updateRegion(this.cursor_id, e.args());
	}
	else if (e instanceof ldc.waveform.WaveformRegionEvent) {
		var arg = e.args();
		var type = arg.waveform == this.id ? 'primary' : 'secondary';
		this.unlinkRegion(this.selection_id);
		this.update_selection_(type, arg.beg, arg.dur);
	}
	else if (e instanceof ldc.waveform.WaveformWindowEvent) {
		var arg = e.args();
		this.display(arg.beg, arg.dur);
	}
	else if (e instanceof ldc.waveform.WaveformSelectEvent) {
		var arg = e.args();
		var type;
		if (arg.waveform == this.id) {
			type = 'primary';
			this.linkRegion(this.selection_id, arg.rid);
		}
		else {
			type = 'secondary';
			this.unlinkRegion(this.selection_id);
		}
		if (arg.beg + arg.dur < this.windowStartTime() ||
			arg.beg > arg.beg + arg.dur) {
			var t = arg.beg + (arg.dur / 2) - (this.windowDuration() / 2.0);
			this.display(t < 0 ? 0 : t);
		}
		this.update_selection_(type, arg.beg, arg.dur, arg.waveform);
	}
}

/**
 * Render region object.
 * @private
 * @method render_region_
 * @param {Object} r A region object.
 */
ldc.waveform.RichWaveform.prototype.render_region_ = function(r) {
	var x = this.t2p(r.pos);
	var y = this.t2p(r.pos + r.dur);
	if (y < 0 || x >= this.canvas.width) {
		r.html.style.display = 'none';
	}
	else {
		var x0 = x;
		var y0 = y;
		if (x < 0) {
			x = 0;
		}
		if (y >= this.canvas.width) {
			y = this.canvas.width - 1;
		}
		r.html.style.left = x + 'px';
		r.html.style.width = (y - x + 1) + 'px';
		r.html.style.height = this.canvas.height + 'px';
		r.html.style.backgroundColor = r.color;
		r.html.style.position = 'absolute';
		r.html.style.top = '0px';
		r.html.style.display = 'block';
		if (r.rid != null) {
			r.html.style.borderStyle = 'solid';
			r.html.style.borderWidth = '1px';
			r.html.style.borderColor = 'black';
			if (x0 < 0) {
				r.html.style.borderLeftStyle = 'none';
			}
			if (y0 > this.canvas.width) {
				r.html.style.borderRightStyle = 'none';
			}
		}
		else {
			r.html.style.borderStyle = '';
			r.html.style.borderWidth = '';
			r.html.style.borderColor = '';
		}
	}
}

/**
 * Update selection.
 * @private
 * @method update_selection_
 * @param {String} klass Either 'primary' or 'secondary'.
 * @param {Number} beg
 * @param {Number} dur 
 */
 ldc.waveform.RichWaveform.prototype.update_selection_ = function(klass, beg, dur) {
		var color = this.selection_color[klass];
		this.updateRegion(this.selection_id, beg, dur, color);
	};

/**
 * Set up mouse events for updating cursor and selection.
 * @private
 * @method setup_mouse_events_
 */
ldc.waveform.RichWaveform.prototype.setup_mouse_events_ = function() {
	// listen on mouse events
	var mousedown = false;
	var selection_anchor = 0;
	var sel = this.getSelection();
	var edge = null;  // mouse position when it is on an edge

	goog.events.listen(document.body, 'mousemove', function(e) {
		var wbeg = this.windowStartTime();
		var wdur = this.windowDuration();
		var e1 = this.container.getBoundingClientRect();
		var e2 = e.target.getBoundingClientRect();
		var x = e2.left - e1.left + e.offsetX;
		var t = Math.min(Math.max(wbeg + this.p2t(x), 0), this.buffer.len_t);
		var t1 = t;  // new cursor position if window is scrolled by cursor
		             // going out of range during selection
		var wbeg1 = wbeg;  // new window start time if window needs to be scrolled

		if (x < 0) {
			if (wbeg > 0) {
				t = wbeg;
				t1 = Math.max(wbeg - wdur * 0.02, 0);
				wbeg1 = t1;
			}
			else {
				t = 0;
				t1 = 0;
			}
		}
		else if (x >= this.canvas.width) {
			if (wbeg + wdur < this.buffer.len_t) {
				t = wbeg + wdur;
				t1 = Math.min(wbeg + wdur * 1.02, this.buffer.len_t);
				wbeg1 = t1 - wdur;
			}
			else {
				t = this.buffer.len_t;
				t1 = this.buffer.len_t;
			}
		}

		// update selection
		if (mousedown) {
			if (wbeg != wbeg1) {
				// scroll window
				this.display(wbeg1);
				if (this.ebus) {
					this.ebus.queue(new ldc.waveform.WaveformWindowEvent(this, wbeg1));
				}
				t = t1;  // use new cursor position since window scrolled
			}
			var beg = Math.min(t, selection_anchor);
			var dur = Math.max(t, selection_anchor) - beg;
			this.update_selection_('primary', beg, dur);
			if (this.ebus) {
				this.ebus.queue(new ldc.waveform.WaveformRegionEvent(this, beg, dur, this.id));
			}
		}

		this.updateRegion(this.cursor_id, t);
		if (this.ebus) {
			this.ebus.queue(new ldc.waveform.WaveformCursorEvent(this, t));
		}

	}, false, this);

	goog.events.listen(this.container, 'mousedown', function(e) {
		// Assumes that this.container and this.canvas are completely overlap.
		if (e.button == 0) {  // left mouse button
			var x = e.target.offsetLeft + e.offsetX;
			var t = this.p2t(x) + this.windowStartTime();

			if (t < 0 || t > this.buffer.len_t) {
				return
			}			

			if (edge != null) {
				// resizing existing region
				selection_anchor = edge;
			}
			else {
				// starting a new region
				this.unlinkRegion(this.selection_id);
				this.update_selection_('primary', t, 0);
				if (this.ebus) {
					this.ebus.queue(new ldc.waveform.WaveformRegionEvent(this, t, 0));
				}
				selection_anchor = t;
			}
			mousedown = true;
		}
	}, false, this);

	goog.events.listen(sel.html, 'mousemove', function(e) {
		if (e.offsetX < 2) {
			sel.html.style.cursor = "w-resize";
		}
		else if (e.offsetX >= sel.html.offsetWidth - 2) {
			sel.html.style.cursor = "e-resize";
		}
		else {
			sel.html.style.cursor = this.canvas.style.cursor;
		}
	}, false, this);

	goog.events.listen(sel.html, 'mousedown', function(e) {
		if (e.offsetX < 2) {
			edge = sel.pos + sel.dur;
		}
		else if (e.offsetX >= sel.html.offsetWidth - 2) {
			edge = sel.pos;
		}
	});

	goog.events.listen(document.body, 'mouseup', function(e) {
		mousedown = false;
		if (edge != null && sel.rid != null && this.ebus != null) {
			var u = {offset:sel.pos, length:sel.dur};
			var ev = new ldc.datamodel.TableUpdateRowEvent(this, sel.rid, u);
			this.ebus.queue(ev);
		}
		edge = null;
	}, false, this);
}

})();