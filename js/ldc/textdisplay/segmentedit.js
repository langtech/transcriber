(function() {

/**
 * @module ldc
 * @submodule textdisplay
 */
goog.provide("ldc.textdisplay.SegmentEdit");
goog.require("ldc.datamodel.Update");
goog.require('goog.dom');

/**
 * A widget displaying a Segment object. Segment objects comprise a
 * TextEdit object.
 *
 * @class SegmentEdit
 * @constructor
 * @param {Segment} segment A segment object.
 */
ldc.textdisplay.SegmentEdit = function(segment) {
	this.segment = segment;

	var rid = segment.rid();
	var html_rid = make_html_id(rid);
	var dom = goog.dom.getElement(html_rid);
	if (dom == null) {
		dom = goog.dom.createDom('div', {'class':'segmentedit', id: html_rid},
			goog.dom.createDom('div', {
				'class': 'segmentedit-textwidget',
				value: segment.value('message'),
				contentEditable: 'true'
			}, segment.value('message'))
		);
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
 * Implant an event listener to the specified HTML element. The listener
 * is activated when an event that modifies data managed by a SegmentEdit
 * object. The activated listener calls the registered callback.
 *
 * @method implantDataEventListener
 * @static
 * @param {HTMLElement} subject
 * @param {Function} callback A function that takes an Update object.
 */
ldc.textdisplay.SegmentEdit.implantListener = function(subject, callback) {
	goog.events.listen(subject, 'blur', function(event) {
		var dom = goog.dom.getAncestorByClass(event.target, 'segmentedit');
		var rid = parse_html_id(dom.id);
		callback(new ldc.datamodel.Update(rid, {
			message: event.target.textContent
		}));
	}, true);
}

/**
 *
 */
ldc.textdisplay.SegmentEdit.prototype.getChange = function() {
	return {
		rid: this.segment.rid(),
		change: {
			message: goog.dom.getFirstElementChild(this._dom).textContent
		}
	}
}

/**
 * @method makeHtmlId
 * @static
 */
function make_html_id(rid) {
	return "rid-" + rid;
}

/**
 * @method parseHtmlId
 * @static
 */
 function parse_html_id(s) {
	try {
		return parseInt(/^rid-(\d+)$/.exec(s)[1]);
	}
	catch (err) {
		return null;
	}
}


})();