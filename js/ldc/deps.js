// This file was autogenerated by js/closure-library/closure/bin/build/depswriter.py.
// Please do not edit.
goog.addDependency('../../../ldc/aikuma/aikumafolder.js', ['ldc.aikuma.AikumaFolder'], []);
goog.addDependency('../../../ldc/aikuma/aikumasegment.js', ['ldc.aikuma.AikumaSegment'], ['goog.dom']);
goog.addDependency('../../../ldc/aikuma/aikumatranscript.js', ['ldc.aikuma.AikumaTranscript'], []);
goog.addDependency('../../../ldc/aikuma/events.js', ['ldc.aikuma.SwimLaneRegionEvent'], ['ldc.event.Event']);
goog.addDependency('../../../ldc/aikuma/index.js', ['ldc.aikuma'], ['ldc.aikuma.AikumaFolder', 'ldc.aikuma.AikumaSegment', 'ldc.aikuma.AikumaTranscript', 'ldc.aikuma.SpeakerSwimLanes', 'ldc.aikuma.SwimLane', 'ldc.aikuma.SwimLaneRegionEvent']);
goog.addDependency('../../../ldc/aikuma/speakerswimlanes.js', ['ldc.aikuma.SpeakerSwimLanes'], ['ldc.datamodel.TableAddRowEvent', 'ldc.datamodel.TableDeleteRowEvent', 'ldc.datamodel.TableUpdateRowEvent']);
goog.addDependency('../../../ldc/aikuma/swimlane.js', ['ldc.aikuma.SwimLane'], ['goog.dom', 'goog.events', 'ldc.aikuma.SwimLaneRegionEvent', 'ldc.waveform.WaveformWindowEvent']);
goog.addDependency('../../../ldc/datamodel/events.js', ['ldc.datamodel.TableAddRowEvent', 'ldc.datamodel.TableDeleteRowEvent', 'ldc.datamodel.TableUpdateRowEvent'], ['ldc.event.Event']);
goog.addDependency('../../../ldc/datamodel/index.js', ['ldc.datamodel'], ['ldc.datamodel.Table', 'ldc.datamodel.TableAddRowEvent', 'ldc.datamodel.TableDeleteRowEvent', 'ldc.datamodel.TableRow', 'ldc.datamodel.TableUpdateRowEvent']);
goog.addDependency('../../../ldc/datamodel/table.js', ['ldc.datamodel.Table'], ['ldc.datamodel.TableUpdateRowEvent']);
goog.addDependency('../../../ldc/datamodel/tablerow.js', ['ldc.datamodel.TableRow'], []);
goog.addDependency('../../../ldc/event/eventbus.js', ['ldc.event.EventBus'], []);
goog.addDependency('../../../ldc/event/events.js', ['ldc.event.Event', 'ldc.event.TextEvent'], []);
goog.addDependency('../../../ldc/event/index.js', ['ldc.event'], ['ldc.event.Event', 'ldc.event.EventBus']);
goog.addDependency('../../../ldc/index.js', ['ldc'], ['ldc.aikuma', 'ldc.datamodel', 'ldc.event', 'ldc.textdisplay', 'ldc.waveform']);
goog.addDependency('../../../ldc/mediaplayer/audioplayer.js', ['ldc.mediaplayer.AudioPlayer'], []);
goog.addDependency('../../../ldc/mediaplayer/index.js', ['ldc.mediaplayer'], ['ldc.mediaplayer.AudioPlayer']);
goog.addDependency('../../../ldc/textdisplay/index.js', ['ldc.textdisplay'], ['ldc.textdisplay.SegmentEdit', 'ldc.textdisplay.TextEdit']);
goog.addDependency('../../../ldc/textdisplay/segmentedit.js', ['ldc.textdisplay.SegmentEdit'], ['goog.dom']);
goog.addDependency('../../../ldc/textdisplay/textedit.js', ['ldc.textdisplay.TextEdit'], ['goog.dom', 'goog.events', 'goog.structs.AvlTree', 'ldc.datamodel.TableRow', 'ldc.event.Event']);
goog.addDependency('../../../ldc/waveform/events.js', ['ldc.waveform.WaveformCursorEvent', 'ldc.waveform.WaveformRegionEvent', 'ldc.waveform.WaveformSelectEvent', 'ldc.waveform.WaveformWindowEvent'], ['ldc.event.Event']);
goog.addDependency('../../../ldc/waveform/index.js', ['ldc.waveform'], ['ldc.waveform.RichWaveform', 'ldc.waveform.Scrollbar', 'ldc.waveform.Utils', 'ldc.waveform.Waveform', 'ldc.waveform.WaveformBuffer', 'ldc.waveform.WaveformCursorEvent', 'ldc.waveform.WaveformRegionEvent', 'ldc.waveform.WaveformSet', 'ldc.waveform.WaveformWindowEvent']);
goog.addDependency('../../../ldc/waveform/richwaveform.js', ['ldc.waveform.RichWaveform'], ['goog.cssom', 'goog.dom', 'goog.events', 'goog.object', 'goog.style', 'ldc.waveform.Waveform', 'ldc.waveform.WaveformCursorEvent']);
goog.addDependency('../../../ldc/waveform/scrollbar.js', ['ldc.waveform.Scrollbar'], ['goog.cssom', 'goog.ui.Slider', 'ldc.waveform.WaveformWindowEvent']);
goog.addDependency('../../../ldc/waveform/utils.js', ['ldc.waveform.Utils'], []);
goog.addDependency('../../../ldc/waveform/waveform.js', ['ldc.waveform.Waveform'], ['goog.array', 'goog.dom']);
goog.addDependency('../../../ldc/waveform/waveformbuffer.js', ['ldc.waveform.WaveformBuffer'], []);
goog.addDependency('../../../ldc/waveform/waveformset.js', ['ldc.waveform.WaveformSet'], []);
