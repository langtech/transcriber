(function() {

/**
 * @module ldc
 * @submodule textdisplay
 * @namespace textdisplay
 */
goog.provide("ldc.textdisplay.SegmentEdit");
goog.require('goog.dom');

/**
 * A widget displaying a Segment object. SegmentEdit modifies data model.
 * The following fields are modified by SegmentEdit.
 *
 * - transcript
 *
 * @class SegmentEdit
 * @constructor
 * @param {TableRow} row A table row of Transcript table.
 */
ldc.textdisplay.SegmentEdit = function(row) {
	this.trow = row;

	var rid = row.rid();
	var html_rid = make_html_id(rid);
	var dom = goog.dom.getElement(html_rid);
	if (dom == null) {
		var sub = goog.dom.createDom('div', {
			'class': 'segmentedit-textwidget',
			value: row.value('transcript'),
			contentEditable: 'true'
		});
		var attr = {class: 'segmentedit', id: html_rid};
		dom = goog.dom.createDom('div', attr, sub);
		dom.style.backgroundColor = '#EEEEFF';
		dom.style.margin = '1px';
	}
	this._dom = dom;
}

/**
 * @method text
 * @return {String}
 */
ldc.textdisplay.SegmentEdit.prototype.text = function() {
	return goog.dom.getFirstElementChild(this._dom).textContent;
}

/**
 * @method setText
 * @param {String} text
 */
ldc.textdisplay.SegmentEdit.prototype.setText = function(text) {
	goog.dom.getFirstElementChild(this._dom).textContent = text;
}

/**
 * Returns the dom object representing the segment.
 * @method dom
 * @return {jQuery} The jQuery object associated with the underlying HTML element.
 */
ldc.textdisplay.SegmentEdit.prototype.dom = function() {
	return this._dom;
}

/**
 * Give broswer focus to the text widget.
 * @method focus
 */
ldc.textdisplay.SegmentEdit.prototype.focus = function() {
	goog.dom.getFirstElementChild(this._dom).focus();
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
ldc.textdisplay.SegmentEdit.installEventListener = function(subject, listener) {
	goog.events.listen(subject, 'blur', function(event) {
		var dom = ldc.textdisplay.SegmentEdit.findDom(event.target, subject);
		if (dom) {
			listener({
				eventType: ldc.textdisplay.SegmentEdit.EventType.CHANGE,
				browserEvent: event,
				rid: parse_html_id(dom.id),
				data: {
					transcript: event.target.textContent
				}
			});
		}
	}, true);
	goog.events.listen(subject, 'click', function(event) {
		var dom = ldc.textdisplay.SegmentEdit.findDom(event.target, subject);
		if (dom) {
			listener({
				eventType: ldc.textdisplay.SegmentEdit.EventType.SELECT,
				browserEvent: event,
				rid: parse_html_id(dom.id)
			});
		}
	}, true);
}

ldc.textdisplay.SegmentEdit.EventType = {
	/**
	 * @property EventType.CHANGE
	 * @type String
	 * @static
	 * @final
	 */
	CHANGE: 'change',
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
ldc.textdisplay.SegmentEdit.findDom = function(origin, root) {
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