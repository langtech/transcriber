goog.addDependency(
	"../../../ldc/datamodel/table.js",
	["ldc.datamodel.Table", "ldc.datamodel.TableRow"],
	[]);
goog.addDependency(
	"../../../ldc/datamodel/segment.js",
	["ldc.datamodel.Segment"],
	["ldc.datamodel.Table"]);
goog.addDependency(
	"../../../ldc/datamodel/segmentset.js",
	["ldc.datamodel.SegmentSet"],
	["ldc.datamodel.Segment"]);
goog.addDependency(
	"../../../ldc/textdisplay/segmentedit.js",
	["ldc.textdisplay.SegmentEdit"],
	["ldc.datamodel.Segment"]);
goog.addDependency(
	"../../../ldc/textdisplay/textedit.js",
	["ldc.textdisplay.TextEdit"],
	["ldc.datamodel.SegmentSet", "ldc.textdisplay.SegmentEdit"]);
goog.addDependency(
	"../../../ldc/event/event.js",
	["ldc.event.Event"],
	[]);
goog.addDependency(
	"../../../ldc/event/eventbus.js",
	["ldc.event.EventBus"],
	["ldc.event.Event"]);
