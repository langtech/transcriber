goog.require("ldc.waveform");
goog.require("goog.net.XhrIo");
goog.require("goog.dom");

describe("ldc.waveform", function() {

	var buffer;
	var waveform;
	var slider;
	
	describe("WaveformBuffer", function() {
		
		it("should download sample shape file", function(done) {
			var xhr = new goog.net.XhrIo;
			xhr.setResponseType(goog.net.XhrIo.ResponseType.ARRAY_BUFFER);
			goog.events.listen(xhr, goog.net.EventType.COMPLETE, function(e) {
				buffer = new ldc.waveform.WaveformBuffer(e.target.getResponse());
				expect(buffer.frames).to.equal(1166);
				done();
			});
			xhr.send('/base/test/data/test.shape');

		});
		
		describe("getSamples", function() {
			var input = [0, 0.05, 6];
			var output = [-3, 3, -2, 2, -1, 1, -1, 1, -1, 1, 0, 0];
			it("should return " + output, function() {
				var arr = buffer.getSamples.apply(buffer, input);
				expect(arr).to.have.length(output.length);
				for (var i in output) {
					expect(arr[i]).to.equal(arr[i]);
				}
			});
			
			input = [0, 0.05, 3];
			output = [-3, 3, -1, 1, -1, 1];
			it("should return " + output, function() {
				var arr = buffer.getSamples.apply(buffer, input);
				expect(arr).to.have.length(output.length);
				for (var i in output) {
					expect(arr[i]).to.equal(arr[i]);
				}
			});

			input = [0, 0.005, 3];
			output = [-3, 3, -3, 3, -3, 3];
			it("should return " + output, function() {
				var arr = buffer.getSamples.apply(buffer, input);
				expect(arr).to.have.length(output.length);
				for (var i in output) {
					expect(arr[i]).to.equal(arr[i]);
				}
			});

			input = [-2, -1, 3];
			output = [0, 0, 0, 0, 0, 0];
			it("should return " + output, function() {
				var arr = buffer.getSamples.apply(buffer, input);
				expect(arr).to.have.length(output.length);
				for (var i in output) {
					expect(arr[i]).to.equal(arr[i]);
				}
			});
		});
	});

	describe("Waveform", function() {
		it("should create a canvas and instantiate the class", function() {
			var canvas = document.createElement("canvas");
			document.body.appendChild(canvas);
			canvas.width = 300;
			waveform = new ldc.waveform.Waveform(buffer, canvas);
			expect(waveform).not.to.be.null;
		});

		describe("canvasWidth", function() {
			it("should return 300", function() {
				expect(waveform.canvasWidth()).to.equal(300);
			});
		});

		describe("windowDuration", function() {
			it("should return correct window duration", function() {
				waveform.display(1.3, 4.5);
				expect(waveform.windowDuration()).to.equal(4.5);
			});
		});

		describe("windowStartTime", function() {
			it("should return correct window start time", function() {
				var spp = 4.5 / 300;
				var x = Math.round(1.3 / spp) * spp;
				expect(waveform.windowStartTime()).to.equal(x);
			});
		});
	});

	describe("Scrollbar", function() {
		var div;

		it("should create a div element and instantiate the class", function() {
			var wset = new ldc.waveform.WaveformSet;
			wset.addWaveform(waveform);
			div = document.createElement("div");
			document.body.appendChild(div);
			slider = new ldc.waveform.Scrollbar(wset, div);
			expect(slider).not.to.be.null;
		});

		describe("setWidth", function() {
			it("should set width correctly", function() {
				slider.setWidth(250);
				expect(div.clientWidth).to.equal(250);
			});
		});
	});

});

