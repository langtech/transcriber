// datamodel module
goog.addDependency(
	"../../../ldc/datamodel/table.js",
	["ldc.datamodel.Table"],
	[]);
goog.addDependency(
	"../../../ldc/datamodel/update.js",
	["ldc.datamodel.Update"],
	[]);
goog.addDependency(
	"../../../ldc/datamodel/segment.js",
	["ldc.datamodel.Segment"],
	["ldc.datamodel.Table"]);
goog.addDependency(
	"../../../ldc/datamodel/index.js",
	["ldc.datamodel"],
	["ldc.datamodel.Segment", "ldc.datamodel.Update"]);


goog.addDependency(
	"../../../ldc/textdisplay/segmentedit.js",
	["ldc.textdisplay.SegmentEdit"],
	["ldc.datamodel.Segment"]);
goog.addDependency(
	"../../../ldc/textdisplay/textedit.js",
	["ldc.textdisplay.TextEdit"],
	["ldc.textdisplay.SegmentEdit", "ldc.event.Event"]);

// event module
goog.addDependency(
	"../../../ldc/event/events.js",
	["ldc.event.Event"],
	[]);
goog.addDependency(
	"../../../ldc/event/eventbus.js",
	["ldc.event.EventBus"],
	["ldc.event.Event"]);
goog.addDependency(
	"../../../ldc/event/index.js",
	["ldc.event"],
	["ldc.event.Event", "ldc.event.EventBus"]);
