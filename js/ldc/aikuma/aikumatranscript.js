(function() {

/**
@module ldc
@submodule aikuma
@namespace aikuma
*/
goog.provide('ldc.aikuma.AikumaTranscript');

/**
@class AikumaTranscript
*/

/**
Parse Aikuma transcript, which is a tab delimited file with a header.

@method parse
@static
@param {String} text A text string containing an Aikuna transcript.
@return {Object} An object with two properties: meta and data. meta is an
  object with two string properties: user and original_uuid. data is an
  array of objects each of which has 5 properties: offset, length, speaker,
  transcript and trnaslation.
*/
ldc.aikuma.AikumaTranscript.parse = function(text) {
	var arr = text.split('\n');
	var i = 0;
	var meta = {};
	var data = [];
	while (arr[i].slice(0,2) == ';;') {
		var a = arr[i].split(' ');
		meta[a[1]] = a.slice(2).join(' ');
		++i;
	}
	for (; !/^\s*$/.test(arr[i]); ++i) {
		var line = arr[i];
		var a = line.split('\t');
		var beg = parseFloat(a[0]);
		var end = parseFloat(a[1]);
		data.push({
			offset: beg,
			length: end - beg,
			speaker: a[2],
			transcript: a[3],
			translation: a[4]
		});
	}
	return {meta:meta, data:data};
}

/**
Turn a table object into Aikuma transcription format.

@method toBlob
@static
@param {datamodel.Table} table
@return {Blob} A blob of transcription text format.
*/
ldc.aikuma.AikumaTranscript.toBlob = function(table, meta) {
	var rows = [
		';; user someuser',
		';; original_uuid ' + meta.original_uuid
	];
	table.forEach(function(row) {
		rows.push([
			row.value('offset'),
			row.value('offset') + row.value('length'),
			row.value('speaker'),
			row.value('transcript'),
			row.value('translation')
		].join('\t'));
	}, function(row) {
		return row.value('mapoff') == null;
	});
	rows.push('');
	return new Blob([rows.join('\n')], {type: "text/plain;charset=utf-8"});
	var filename = $('#save-file-input').val();
	saveAs(blob, filename);
}

})();