(function() {

/**
 * @module ldc
 * @submodule textdisplay
 */
goog.provide("ldc.textdisplay.SegmentEdit");

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
	this._dom = $('<div>' + segment.value('message') + '</div>');
}

/**
 * Returns the dom object representing the segment.
 * @method dom
 * @return {HTMLElement} The dom object showing the segment.
 */
ldc.textdisplay.SegmentEdit.prototype.dom = function() {
	return this._dom;
}

})();