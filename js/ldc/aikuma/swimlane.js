(function() {

/**
 * @module ldc
 * @submodule aikuma
 * @namespace aikuma
 */

goog.provide('ldc.aikuma.SwimLane');
goog.require('ldc.waveform.WaveformWindowEvent');
goog.require('ldc.aikuma.SwimLaneRegionEvent');
goog.require('goog.dom');
goog.require('goog.events');

/**
 * Display for Aikuma respeaking segments.
 *
 * The respeaking segments are passed along with other segments in the table.
 * A filter is used to select only relevant segments. Filter is a boolean
 * function taking an ldc.datamodel.Segment object.
 *
 * @class SwimLane
 * @constructor
 * @param {HTMLElement} div A div element to wrap to display the widget.
 * @param {Number} [width=100] Width of the widget.
 * @param {event.EventBus} [eventbus]
 * @param {Function} [filter] Boolean function taking an ldc.datamodel.Segment
 *   object. By default, the function is defined as follows:
 *
 *       seg.value('waveform') == null && seg.value('waveform') == this.id
 *
 */
ldc.aikuma.SwimLane = function(div, width, eventbus, filter) {
	this.div = div;
	this.table = null;
	var that = this;
	this.filter = filter != null ? filter : function(seg) {
		return seg.value('waveform') == null && seg.value('swimlane') == that.id;
	};
	this.width = width == null ? 100 : width;
	this.ebus = eventbus;

	/**
     * Unique ID of the SwimLane.
     * @property {Number} id
     * @readonly
     */
	this.id = counter++;

	this.div.style.position = 'relative';
	this.setup_ui_events_();

	this.beg = 0;
	this.dur = 0;
	this.selected = null;  // selected region

	if (this.ebus) {
		this.ebus.connect(ldc.waveform.WaveformWindowEvent, this);
		this.ebus.connect(ldc.aikuma.SwimLaneRegionEvent, this);
	}
}

var counter = 0;

/**
 * Set filter.
 *
 * @method setFilter
 * @param {Function} filter Boolean function taking an ldc.datamodel.Segment
 *   object.
 */
ldc.aikuma.SwimLane.prototype.setFilter = function(filter) {
	this.filter = filter;
	this.load_table_();
	this.display(this.beg, this.dur);
}

/**
 * Display specified region.
 *
 * @method display
 * @param {Number} beg
 * @param {Number} dur
 */
ldc.aikuma.SwimLane.prototype.display = function(beg, dur) {
	this.beg = beg;
	if (dur != null) {
		this.dur = dur;
	}

	// clear the drawing area
	if (this.html != null) {
		goog.dom.removeNode(this.html);
	}
	this.html = goog.dom.createElement('div');
	goog.dom.appendChild(this.div, this.html);
	this.html.style.position = 'relative';
	this.html.style.width = this.width + 'px';

	// abort if there's nothing to draw
	if (this.dur <= 0) {
		return;
	}
	if (this.segs.getCount() == 0) {
		return;
	}

	var that = this;

	var s = {
		value: function(field) {
			if (field == 'offset') {
				return that.beg;
			}
			else if (field == 'length') {
				return 0;
			}
		},
		rid: function() {return -1;}
	}

	var smax = this.segs.getMaximum();
	var smin = this.segs.getMinimum();

	if (comp_seg(s, smax) < 0) {
		// only when there are segments starting after window start time
		this.segs.inOrderTraverse(function(trow) {
			var beg = trow.value('offset');
			var dur = trow.value('length');
			if (beg >= that.beg + that.dur) {
				// abort if segments go out of window
				return true;
			}
			var el = that.render_segment_(beg, dur);
			if (el != null) {
				el.rid = trow.rid();
			}
		}, s);
	}


	if (comp_seg(s, smin) >= 0) {
		// only when there are segments starting before window start offset
		// just for the first segment behind the window start offset
		this.segs.reverseOrderTraverse(function(trow) {
			var beg = trow.value('offset');
			var dur = trow.value('length');
			var el = that.render_segment_(beg, dur);
			if (el != null) {
				el.rid = trow.rid();
			}
			return true; // finish traversal
		}, s);
	}
}

/**
 * Renders a segment.
 *
 * @method render_segment_
 * @private
 * @param {Number} beg
 * @param {Number} dur
 * @return {HTMLElement}
 */
ldc.aikuma.SwimLane.prototype.render_segment_ = function(beg, dur) {
	if (beg < this.beg + this.dur && beg + dur > this.beg &&
		this.width > 0 && this.dur > 0) {
		var r = this.width / this.dur; // pixel-time ratio
		var a = Math.max(this.beg, beg);
		var b = Math.min(this.beg + this.dur, beg + dur);
		a = (a - this.beg) * r;
		b = (b - this.beg) * r;
		a = Math.round(a);
		b = Math.round(b);

		var div = goog.dom.createDom('div', {class:'aikuma-swimlane-segment'});
		goog.dom.appendChild(this.html, div);
		div.style.position = 'absolute';
		div.style.left = a + 'px';
		var width = b - a - 2;
		if (this.beg > beg) {
			div.className = div.className + ' aikuma-swimlane-segment-right';
			width += 1;
		}
		if (this.beg + this.dur < beg + dur) {
			div.className = div.className + ' aikuma-swimlane-segment-left';
			width += 1
		}
		div.style.width = width + 'px';
		return div;
	}
}

/**
 * Set the data model and reset the display.
 *
 * @method setTable
 * @param {datamodel.Table} table A Table object for Aikuma application.
 */
ldc.aikuma.SwimLane.prototype.setTable = function(table) {
	this.table = table;
	this.load_table_();
	this.display(this.beg, this.dur);
}

/**
 * Set the width of the widget.
 *
 * @method setWidth
 * @param {Number} width
 */
ldc.aikuma.SwimLane.prototype.setWidth = function(width) {
	this.html.style.width = width + "px";
	this.display(this.beg, this.dur);
}

/**
 * EventBus event handler.
 *
 * @method handleEvent
 */
ldc.aikuma.SwimLane.prototype.handleEvent = function(e) {
	if (e instanceof ldc.waveform.WaveformWindowEvent) {
		this.display(e.args().beg, e.args().dur);
	}
	else if (e instanceof ldc.aikuma.SwimLaneRegionEvent) {
		if (this.selected != null) {
			unselect_seg(this.selected);
			this.selected = null;
		}
	}
}


ldc.aikuma.SwimLane.prototype.load_table_ = function() {
	if (this.segs == null) {
		this.segs = new goog.structs.AvlTree(comp_seg);
	}
	this.segs.clear();

	var that = this;
	this.table.forEach(function(trow) {
		that.segs.add(trow);
	}, this.filter);
}

ldc.aikuma.SwimLane.prototype.setup_ui_events_ = function() {
	goog.events.listen(this.div, 'click', function(e) {
		if (e.target.rid != null) {
			var trow = this.table.getRow(e.target.rid);
			if (this.selected != null) {
				unselect_seg(this.selected);
			}
			select_seg(this.selected = e.target);
			if (this.ebus != null) {
				var beg = trow.value('offset');
				var dur = trow.value('length');
				var ev1 = new ldc.aikuma.SwimLaneRegionEvent(this, this.id, {
					offset: beg,
					length: dur
				}, {
					offset: trow.value('mapoff'),
					length: trow.value('maplen')
				});
				var ev2 = new ldc.waveform.WaveformRegionEvent(this, beg, dur, null);
				this.ebus.queue(ev1);
				this.ebus.queue(ev2);
			}
		}
	}, false, this);
}

function select_seg(el) {
	el.className += ' aikuma-swimlane-selected-segment';
}

function unselect_seg(el) {
	var a = el.className.split(/\s+/);
	var i = a.indexOf('aikuma-swimlane-selected-segment');
	while (i >= 0) {
		a.splice(i, 1);
		i = a.indexOf('aikuma-swimlane-selected-segment');
	}
	el.className = a.join(' ');
}

// Returns -1, 0, or 1 respectively if a < b, a == b, or a > b.
function comp(a, b) {
	if (a < b) {
		return -1;
	}
	else if (a > b) {
		return 1;
	}
	else {
		return 0;
	}
}

// Comparison function for Segment objects. Comparison is done on start and
// end offsets. -1, 0, or 1 is returned respectively if a precedes b, a and b
// span the same region, or b precedes a.
function comp_seg(a, b) {
	var s1 = a.value('offset');
	var s2 = b.value('offset');
	var c = comp(s1, s2);
	if (c == 0) {
		c == comp(s1 + a.value('length'), s2 + b.value('length'));
		return c == 0 ? comp(a.rid(), b.rid()) : c;
	}
	else {
		return c;
	}
}

})();