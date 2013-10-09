(function() {

/**
 * @module ldc
 * @submodule aikuma
 * @namespace aikuma
 */
goog.provide('ldc.aikuma.AikumaSegment');
goog.require('goog.dom');

var UI_CLASS = 'segmentedit';
var UI_TEXT_CLASS = 'segmentedit-textwidget';

/**
 * A segment widget for ldc.textdisplay.TextEdit.
 *
 * @class AikumaSegment
 * @constructor
 * @param {Number} rid Rid of the corresponding TableRow object.
 * @param {Object} data An object with transcript and translation properties
 *    which are strings.
 */
ldc.aikuma.AikumaSegment = function(rid, data) {
	this.ui_style = {
		text_bg_color: '#EEEEFF',
		margin: '5px'
	}

	var html_rid = make_html_id(rid);
	var dom = goog.dom.getElement(html_rid);
	if (dom == null) {
		var bullet = goog.dom.createDom('div', {
			style: 'display: table-cell'
		}, '\u2022\u00a0\u00a0');
		var text = goog.dom.createDom('div', {
			class: UI_TEXT_CLASS,
			contentEditable: 'true',
			style: 'display: table-cell; width: 100%'
		}, data['transcript']);
		var wrapper1 = goog.dom.createDom('div', {
			style: 'display: table-row'
		}, bullet, text);

		var empty = goog.dom.createDom('div', {
			style: 'display: table-cell'
		});
		var trans = goog.dom.createDom('div', {
			class: UI_TEXT_CLASS,
			contentEditable: 'true',
			style: 'display: table-cell; width: 100%'
		}, data['translation']);
		var wrapper2 = goog.dom.createDom('div', {
			style: 'display: table-row'
		}, empty, trans);

		dom = goog.dom.createDom('div', {
			class: UI_CLASS,
			id: html_rid
		}, wrapper1, wrapper2);
		
		text.style.backgroundColor = this.ui_style.text_bg_color;
		dom.style.margin = this.ui_style.margin;
	}
	this._dom = dom;
}

function textwidget(el) {
	return goog.dom.getElementByClass(UI_TEXT_CLASS, el);
}

/**
 * Returns the text content of the widget.
 *
 * @method text
 * @return {String}
 */
ldc.aikuma.AikumaSegment.prototype.text = function() {
	console.log(this._dom.textContent);
	return textwidget(this._dom).textContent;
}

/**
 * Update data displayed on the widget.
 *
 * @method update
 * @param {Object} update Key-value pairs. Currently, only 'transcript'
 *   property is accepted. Other properties are ignored.
 */
ldc.aikuma.AikumaSegment.prototype.update = function(update) {
	if (update.hasOwnProperty('transcript')) {
		textwidget(this._dom).textContent = update.transcript;
	}
}

/**
 * Returns the dom object representing the segment.
 * @method dom
 * @return {jQuery} The jQuery object associated with the underlying HTML element.
 */
ldc.aikuma.AikumaSegment.prototype.dom = function() {
	return this._dom;
}

/**
 * Give broswer focus to the text widget.
 * @method focus
 */
ldc.aikuma.AikumaSegment.prototype.focus = function() {
	textwidget(this._dom).focus();
}

/**
 * Install an event listener to the specified HTML element, which should
 * be an ancestor node of SegmentEdit nodes. The listener is supposed to be
 * activated when user interacts with any instance of SegmentEdit to
 * change the data.
 *
 * The listener is installed to an ancestor instead of individual SegmentEdit
 * nodes to avoid having too many event handlers (one for each SegmentEdit).
 * Since the internals of SegmentEdit is not known to other classes, the
 * listener needs to be installed by SegmentEdit although hosting HTML node
 * is not managed by SegmentEdit.
 *
 * @method installListener
 * @static
 * @param {HTMLElement} subject An HTML element.
 * @param {Function} listener A function that takes an object. The object has
 *   the following properties:
 *
 *   - eventType - type of the interpreted event
 *   - browserEvent - the original browser event
 *   - rid - ID of the row where the event originated
 *   - data - object containg table column name and value pairs
 */
ldc.aikuma.AikumaSegment.installEventListener = function(subject, listener) {
	goog.events.listen(subject, 'blur', function(event) {
		var dom = ldc.aikuma.AikumaSegment.findDom(event.target, subject);
		if (dom) {
			listener({
				eventType: ldc.aikuma.AikumaSegment.EventType.CHANGE,
				browserEvent: event,
				rid: parse_html_id(dom.id),
				data: {
					transcript: textwidget(dom).textContent
				}
			});
		}
	}, true);
	goog.events.listen(subject, 'click', function(event) {
		var dom = ldc.aikuma.AikumaSegment.findDom(event.target, subject);
		if (dom) {
			listener({
				eventType: ldc.aikuma.AikumaSegment.EventType.SELECT,
				browserEvent: event,
				rid: parse_html_id(dom.id)
			});
		}
	}, true);
}

ldc.aikuma.AikumaSegment.EventType = {
	/**
	 * @property EventType.CHANGE
	 * @type String
	 * @static
	 * @final
	 */
	CHANGE: 'change',
	/**
	 * @property EventType.SELECT
	 * @type String
	 * @static
	 * @final
	 */
	SELECT: 'select'
};

// Turn the rid to a string uses for an html id attribute.
function make_html_id(rid) {
	return "rid-" + rid;
}

// Turn the html id attribute to rid.
function parse_html_id(s) {
	try {
		return parseInt(/^rid-(\d+)$/.exec(s)[1]);
	}
	catch (err) {
		return null;
	}
}

// Find an html element corresponding to a SegmentEdit object.
// Walk the ancestry path starting from origin. If root is not part of the
// path, the search continues until it meets the document root if root.
// Returns the dom object if search succeeds, or null, otherwise.
ldc.aikuma.AikumaSegment.findDom = function(origin, root) {
	var dom = goog.dom.getAncestor(origin, function(node) {
		if (node == root) {
			return true;
		}
		else if (node.getAttribute('class') == 'segmentedit') {
			return true;
		}
	}, true);
	if (dom != root) {
		return dom;
	}
}

})();