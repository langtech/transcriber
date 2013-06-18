goog.require('ldc');

window.onload = function() {
		var setup_waveform = function(audio_buffer) {
					var shapefile = ldc.waveform.Utils.makeShapeFile(600, 10, audio_buffer);
					var waveform_buffer = new ldc.waveform.WaveformBuffer(shapefile);
					var canvas = document.getElementById('waveform');
					canvas.width = 600;
					canvas.height = 100;
					var waveform = new ldc.waveform.Waveform(waveform_buffer, canvas, 0);
					waveform.display(0, 30);
		};

		// @param {File} file Audio file.
		// @param {Function} callback A function taking an AudioBuffer object.
		var read_audio_file = function(file, callback) {
			url = URL.createObjectURL(file);
			audio = new Audio(url);

			audio.addEventListener('durationchange', function(e) {
				context = new webkitOfflineAudioContext(channels, 44100 * audio.duration, 44100);
				var node1 = context.createMediaElementSource(audio);
				var node3 = context.destination; //context.createMediaStreamDestination();

				node1.connect(node3);

				context.oncomplete = function(e) {
					callback(e.renderedBuffer);
				};

				context.startRendering();
				audio.play();

			});

			audio.load();
		}

		var widget = document.getElementById('filechooser');
		var channels = 2;

		widget.addEventListener('change', function(e) {
			read_audio_file(e.target.files[0], setup_waveform);
		});

}