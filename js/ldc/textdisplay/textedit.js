(function() {

/**
 * @module ldc
 * @submodule textdisplay
 */
goog.provide('ldc.textdisplay.TextEdit');

/**
 * @class TextEdit
 * @constructor
 * @param {String} id Id of a div element.
 */
ldc.textdisplay.TextEdit = function(id) {
	this.container = $('#' + id);
}

/**
 * @method setTable
 * @param {Table} table
 */
ldc.textdisplay.TextEdit.prototype.setTable = function(table) {
	var segset = new ldc.datamodel.SegmentSet(table, function(){return true;});
	var container = this.container;
	segset.each(function(segment) {
		var se = new ldc.textdisplay.SegmentEdit(segment);
		container.append(se.dom());
	});
}

})();