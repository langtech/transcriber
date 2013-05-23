/**
 * @module ldc
 * @submodule datamodel
 * @namespace datamodel
 */
goog.provide('ldc.datamodel.TableUpdateRowEvent');
goog.provide('ldc.datamodel.TableAddRowEvent');
goog.provide('ldc.datamodel.TableDeleteRowEvent');
goog.require('ldc.event.Event');

/**
 * An event signaling that there has been changes to the Table.
 *
 * @class TableUpdateRowEvent
 * @extends event.Event
 * @constructor
 * @param {Object} source Object that is the source of the event.
 * @param {Number} rid Row ID of the row having the changes.
 * @param {Object} update Key-value pairs.
 */
ldc.datamodel.TableUpdateRowEvent = function(source, rid, update) {
	goog.base(this, source, {rid:rid, data:update});
}
goog.inherits(ldc.datamodel.TableUpdateRowEvent, ldc.event.Event);

ldc.datamodel.TableUpdateRowEvent.type = ldc.event.Event.newTypeId();

/**
 * An event signaling that a new row has been added to the Table.
 *
 * @class TableAddRowEvent
 * @extends event.Event
 * @constructor
 * @param {Object} source Object that is the source of the event.
 * @param {Number} rid Row ID of the added row.
 * @param {Object} data Key-value pairs.
 */
ldc.datamodel.TableAddRowEvent = function(source, rid, data) {
	goog.base(this, source, {rid:rid, data:data});
}
goog.inherits(ldc.datamodel.TableAddRowEvent, ldc.event.Event);
ldc.datamodel.TableAddRowEvent.type = ldc.event.Event.newTypeId();

/**
 * Returns the arguments of the event.
 *
 * @method args
 * @return {Object} Object with following properties.
 *
 *   - rid: id of table row to update
 *   - data: key-value pairs where keys are the fields of data model
 */


/**
 * An event signaling that a row has been deleted from the Table.
 *
 * @class TableDeleteRowEvent
 * @extends event.Event
 * @constructor
 * @param {Object} source Object that is the source of the event.
 * @param {Number} rid Row ID of the deleted row.
 */
ldc.datamodel.TableDeleteRowEvent = function(source, rid) {
	goog.base(this, source, {rid:rid});
}
goog.inherits(ldc.datamodel.TableDeleteRowEvent, ldc.event.Event);

ldc.datamodel.TableDeleteRowEvent.type = ldc.event.Event.newTypeId();
