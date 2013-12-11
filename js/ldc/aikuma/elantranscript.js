(function() {

/**
@module ldc
@submodule aikuma
@namespace aikuma
*/
goog.provide('ldc.aikuma.ElanTranscript');

/**
@class ElanTranscript
*/

/**
Parses an EAF XML file.

@method parse
@static
@param {String} text Content of an EAF file.
@return {Object} Object with the following properties:

  - meta
    - user
    - original_uuid
  - data: Array of objects each of which has these properties
    - offset
    - length
    - speaker
    - transcript
    - translation
*/
ldc.aikuma.ElanTranscript.parse = function(text) {
	var data = {meta:{}, data:[]}
	var p = new DOMParser;
	var xml = p.parseFromString(text, 'text/xml');
	MYXML = xml;
	var media = xml.querySelector('MEDIA_DESCRIPTOR');
	var re = /(?:.*\/)?([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:\.[^\/]*)?/i;
	var media_url = media.getAttribute('MEDIA_URL');
	var uuid = re.exec(media_url)[1];
	data.meta.original_uuid = uuid == null ? media_url : uuid;

	// build time anchor dictionary
	var time_dict = {};
	forEachNode(xml.getElementsByTagName('TIME_SLOT'), function(e) {
		var key = e.getAttribute('TIME_SLOT_ID');
		var value = e.getAttribute('TIME_VALUE');
		time_dict[key] = parseInt(value);
	});

	// for each transcription tier (tier whose id starts with 'transcription')
	forEachNode(xml.querySelectorAll('TIER[TIER_ID^=transcription]'), function(tier1) {
		var tier_id = tier1.getAttribute('TIER_ID');
		var speaker = tier1.getAttribute('PARTICIPANT');
		var tier2 = xml.querySelector('TIER[LINGUISTIC_TYPE_REF=translation-lt][PARENT_REF='+tier_id+']');

		forEachNode(tier1.getElementsByTagName('ALIGNABLE_ANNOTATION'), function(node) {
			var text = node.querySelector('ANNOTATION_VALUE').textContent;
			var a1 = node.getAttribute('TIME_SLOT_REF1');
			var a2 = node.getAttribute('TIME_SLOT_REF2');
			var aid = node.getAttribute('ANNOTATION_ID');
			var trtext = null;
			if (tier2 != null) {
				var trnode = tier2.querySelector('REF_ANNOTATION[ANNOTATION_REF="' + aid + '"]');
				trtext = trnode==null ? null : trnode.querySelector('ANNOTATION_VALUE').textContent;
			}
			var t1 = time_dict[a1];
			var t2 = time_dict[a2];
			data.data.push({
				offset: t1 / 1000,
				length: (t2 - t1) / 1000,
				speaker: speaker,
				transcript: text,
				translation: trtext
			});
		});
	});

	return data;
}


ldc.aikuma.ElanTranscript.toBlob = function(table, meta) {
	ann_count = 0;
	tier_count = 0;
	var temp = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<ANNOTATION_DOCUMENT AUTHOR="" DATE="" FORMAT="2.7" VERSION="2.7" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.mpi.nl/tools/elan/EAFv2.7.xsd">',
		'<HEADER MEDIA_FILE="" TIME_UNITS="milliseconds">',
		'<MEDIA_DESCRIPTOR MEDIA_URL="" MIME_TYPE="audio/x-wav"/>',
		'</HEADER>',
		'<TIME_ORDER/>',
		'<LINGUISTIC_TYPE GRAPHIC_REFERENCES="false" LINGUISTIC_TYPE_ID="default-lt" TIME_ALIGNABLE="true"/>',
    	'<LINGUISTIC_TYPE CONSTRAINTS="Symbolic_Association" GRAPHIC_REFERENCES="false" LINGUISTIC_TYPE_ID="translation-lt" TIME_ALIGNABLE="false"/>',
    	'<CONSTRAINT DESCRIPTION="Time subdivision of parent annotation\'s time interval, no time gaps allowed within this interval" STEREOTYPE="Time_Subdivision"/>',
    	'<CONSTRAINT DESCRIPTION="Symbolic subdivision of a parent annotation. Annotations refering to the same parent are ordered" STEREOTYPE="Symbolic_Subdivision"/>',
    	'<CONSTRAINT DESCRIPTION="1-1 association with a parent annotation" STEREOTYPE="Symbolic_Association"/>',
    	'<CONSTRAINT DESCRIPTION="Time alignable annotations within the parent annotation\'s time interval, gaps are allowed" STEREOTYPE="Included_In"/>',
    	'</ANNOTATION_DOCUMENT>'
	];
	var xml = (new DOMParser).parseFromString(temp.join(''), 'text/xml');
	xml.documentElement.setAttribute('DATE', (new Date).toISOString());
	xml.querySelector('MEDIA_DESCRIPTOR').setAttribute('MEDIA_URL', meta.original_uuid);
	var time_dict = {};
	var time_dict_size = 0;
	function get_tid(t) {
		if (time_dict.hasOwnProperty(t))
			return time_dict[t];
		var tid = 'ts' + ++time_dict_size;
		time_dict[t] = tid;
		return tid;
	}
	var tiers = {};
	function get_tier(spkr) {
		if (tiers.hasOwnProperty(spkr))
			return tiers[spkr];
		tiers[spkr] = new Tier(spkr, xml);
		return tiers[spkr];
	}
	table.forEach(function(row) {
		var beg = row.value('offset');
		var end = beg + row.value('length');
		var t1 = get_tid(Math.round(beg * 1000));
		var t2 = get_tid(Math.round(end * 1000));
		var tier = get_tier(row.value('speaker'));
		tier.addAnnotation(t1, t2, row.value('transcript'), row.value('translation'));
	}, function(row) {
		return row.value('mapoff') == null;
	});
	var to = xml.querySelector('TIME_ORDER');
	Object.keys(time_dict).forEach(function(t) {
		var ts = xml.createElement('TIME_SLOT');
		setAttributes(ts, {
			TIME_SLOT_ID: time_dict[t],
			TIME_VALUE: t
		});
		to.appendChild(ts);
	});
	var ip = xml.querySelector('LINGUISTIC_TYPE');
	Object.keys(tiers).forEach(function(spkr) {
		xml.documentElement.insertBefore(tiers[spkr].getTrsTier(), ip);
		xml.documentElement.insertBefore(tiers[spkr].getTrnTier(), ip);
	})
	var xmltext = (new XMLSerializer).serializeToString(xml);
	return new Blob([xmltext], {type: "text/xml;charset=utf-8"});
}


function forEachNode(nodes, func) {
	for (var i=0; i < nodes.length; ++i) {
		func(nodes.item(i));
	}
}

function setAttributes(node, obj) {
	Object.keys(obj).forEach(function(att) {
		node.setAttribute(att, obj[att]);
	});
}

var ann_count = 0;
var tier_count = 0;

function Tier(spkr, dom) {
	this.speaker = spkr;
	this.dom = dom;
	this.trs_dict = {};
	this.trn_dict = {};
	this.trs_tier_id = 'transcription-' + ++tier_count;
	this.trn_tier_id = 'translation-' + tier_count;
}

Tier.prototype.addAnnotation = function(t1, t2, trs, trn) {
	var aid1 = 'a' + ++ann_count;
	var aid2 = 'a' + ++ann_count;
	this.trs_dict[aid1] = [t1, t2, trs];
	this.trn_dict[aid2] = [aid1, trn];
}

Tier.prototype.getTrsTier = function() {
	var tier = this.dom.createElement('TIER');
	setAttributes(tier, {
		ANNOTATOR: '',
		LINGUISTIC_TYPE_REF: 'default-lt',
		PARTICIPANT: this.speaker,
		TIER_ID: this.trs_tier_id
	});
	Object.keys(this.trs_dict).forEach(function(aid) {
		var row = this.trs_dict[aid];
		var ann = this.dom.createElement('ANNOTATION');
		var ann1 = this.dom.createElement('ALIGNABLE_ANNOTATION');
		var ann2 = this.dom.createElement('ANNOTATION_VALUE');
		setAttributes(ann1, {
			ANNOTATION_ID: aid,
			TIME_SLOT_REF1: row[0],
			TIME_SLOT_REF2: row[1]
		});
		ann2.textContent = row[2];
		ann.appendChild(ann1);
		ann1.appendChild(ann2);
		tier.appendChild(ann);
	}, this);
	return tier;
}

Tier.prototype.getTrnTier = function() {
	var tier = this.dom.createElement('TIER');
	setAttributes(tier, {
		ANNOTATOR: '',
		LINGUISTIC_TYPE_REF: 'translation-lt',
		PARENT_REF: this.trs_tier_id,
		TIER_ID: this.trn_tier_id
	});
	Object.keys(this.trn_dict).forEach(function(aid) {
		var row = this.trn_dict[aid];
		var ann = this.dom.createElement('ANNOTATION');
		var ann1 = this.dom.createElement('REF_ANNOTATION');
		var ann2 = this.dom.createElement('ANNOTATION_VALUE');
		setAttributes(ann1, {
			ANNOTATION_ID: aid,
			ANNOTATION_REF: row[0]
		});
		ann2.textContent = row[1];
		ann.appendChild(ann1);
		ann1.appendChild(ann2);
		tier.appendChild(ann);
	}, this);
	return tier;
}

})();
