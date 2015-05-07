/**
 * @module ldc
 * @submodule mediaplayer
 */
goog.provide('ldc.mediaplayer.AudioPlayer');
goog.require('ldc.event.Signal');

(function() {

/**
@class AudioPlayer
@constructor
@param {number} [freq=25] Number of times the the timeUpdated signal
  is emitted in 1 second. The actual frequency depends on the audio backend.
  If the given value is within the supported frequencies, the actual frequency
  will be the smallest frequency equal to or larger than the given value.
  If the given value is beyond the supported maximum, the actual frequency is
  the largest supported frequency.
*/
ldc.mediaplayer.AudioPlayer = function(freq) {
	var AudioContext = window.AudioContext || window.webkitAudioContext;
	if (AudioContext == null)
		throw new Error("Web Audio API is not available");

	// determine buffer size for ScriptProcessorNode
	if (freq != null) {
		if (freq > 44100/256)
			this.buf_size = 256;
		else if (freq <= 44100/16384)
			this.buf_size = 16384;
		else
			this.buf_size = Math.pow(2,Math.floor(Math.log(44100/freq)/Math.LN2));
	}
	else
		this.buf_size = 1024;

	var that = this;

	this.ac = new AudioContext;
	this.audio = new Audio;
	this.audio.addEventListener('loadeddata', function(e) {
		// when new audio is loaded, you should restart audio
		// otherwise, the new audio won't play
		that.ready = true;
		if (that.paused == false) {
			that.pause();
			that.play();
		}
		that.playerReady.emit();
	});
	this.src = this.ac.createMediaElementSource(this.audio);
	this.script = this.ac.createScriptProcessor(this.buf_size);
	this.src.connect(this.script);
	this.script.connect(this.ac.destination);

	this.ready = false;
	this.paused = true;
	this.start_time = 0;
	this.last_pos = 0;
	
	this.script.onaudioprocess = function(e) {
		if (that.paused == false)
			that.timeUpdated.emit(that.currentPos());
		for (var c=0; c < e.inputBuffer.numberOfChannels; ++c)
    		e.outputBuffer.getChannelData(c).set(e.inputBuffer.getChannelData(c));
	};

	/**
	Signals that the player is ready.
	@event playerReady
	*/
	this.playerReady = new ldc.event.Signal;

	/**
	Signals that player position has changed.
	@event timeUpdated
	@param {number} time
	*/
	this.timeUpdated = new ldc.event.Signal;
}


/**
@method setAudioUrl
@param {String} url
*/
ldc.mediaplayer.AudioPlayer.prototype.setAudioUrl = function(url) {
	this.ready = false;
	this.audio.setAttribute('src', url);
}

/**
@method play
*/
ldc.mediaplayer.AudioPlayer.prototype.play = function() {
	if (this.ready && this.paused) {
		this.paused = false;
		this.start_time = this.ac.currentTime;
		this.audio.play();
		this.audio.currentTime = this.last_pos;
	}
}

/**
@method pause
*/
ldc.mediaplayer.AudioPlayer.prototype.pause = function() {
	if (this.ready && this.paused == false) {
		this.paused = true;
		this.last_pos = this.currentPos();
		this.audio.pause();
	}
}

/**
@method seek
@param {Number} t
*/
ldc.mediaplayer.AudioPlayer.prototype.seek = function(t) {
	if (this.ready) {
		this.audio.currentTime = this.last_pos = t;
		this.start_time = this.ac.currentTime;
	}
}

/**
@method currentPos
@return {number}
*/
ldc.mediaplayer.AudioPlayer.prototype.currentPos = function() {
	if (this.ready)
		return this.last_pos + this.ac.currentTime - this.start_time;
}

})();
