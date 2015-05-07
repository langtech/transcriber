goog.require('ldc');

window.onload = function(event) {
    var MSG_BOARD_ID = "message-board";
    var SHAPE_INPUT_ID = "shape-input";
    var AUDIO_INPUT_ID = "audio-input"; 
    var CANVAS_ID = "waveform-canvas";
    var CANVAS_W = 800;
    var CANVAS_H = 200;
    var BACK_BTN_ID = "back-btn";
    var FORWARD_BTN_ID = "forward-btn";
    var ZOOMIN_BTN_ID = "zoomin-btn";
    var ZOOMOUT_BTN_ID = "zoomout-btn";
    var PLAY_BTN_ID = "play-btn";
    var PAUSE_BTN_ID = "pause-btn";
    var RESUME_BTN_ID = "resume-btn";
    var CURSOR_POS_ID = "cursor-pos";

    var app = {
        init: function() {
            // event bus: This is used to listen on waveform events. If supplied,
            // waveform sends out event via the event bus. Client can register
            // event handlers with the event bus.
            this.ebus = new ldc.event.EventBus;
            // listen on waveform cursor event (user moves cursor on the waveform)
            this.ebus.connect(ldc.waveform.WaveformCursorEvent, this.cursor_pos_handler);

            // initialize canvas on which the waveform will be drawn
            this.canvas = document.getElementById(CANVAS_ID);
            this.canvas.width = CANVAS_W;
            this.canvas.height = CANVAS_H;

            // create player object
            this.player = new ldc.mediaplayer.AudioPlayer;
            this.player.timeUpdated.connect(this, "time_updated");
            this.player.playerReady.connect(this, "player_ready");

            // listen on file chooser event
            document.getElementById(SHAPE_INPUT_ID)
            .addEventListener("change", function() {
                app.load_shape_file(this.files[0]);
            });
            document.getElementById(AUDIO_INPUT_ID)
            .addEventListener("change", function() {
                app.set_audio_file(this.files[0]);
            });

            // listen on the "backward" button
            document.getElementById(BACK_BTN_ID)
            .addEventListener("click", function() {
                app.rewind(1);
            });

            // listen on the "forward" button
            document.getElementById(FORWARD_BTN_ID)
            .addEventListener("click", function() {
                app.forward(1);
            });

            // listen on the "zoom in" button
            document.getElementById(ZOOMIN_BTN_ID)
            .addEventListener("click", function() {
                app.resize(0.8);
            });

            // listen on the "zoom out" button
            document.getElementById(ZOOMOUT_BTN_ID)
            .addEventListener("click", function() {
                app.resize(1.25);
            });

            // listen on the "play" button
            document.getElementById(PLAY_BTN_ID)
            .addEventListener("click", function() {
                app.play();
            });

            // listen on the "pause" button
            document.getElementById(PAUSE_BTN_ID)
            .addEventListener("click", function() {
                app.pause();
            });


            // listen on the "resume" button
            document.getElementById(RESUME_BTN_ID)
            .addEventListener("click", function() {
                app.resume();
            });
        },

        load_shape_file: function(file) {
            // turn the file object into a url object, which we can treat
            // like a url on a remote server
            var url_obj = URL.createObjectURL(file);

            Utils.download(url_obj, "array_buffer")
            .then(function(shape_data) {

                // this is how the waveform widget is used
                // 1) create a buffer object with the uploaded shape file
                // 2) create a waveform object using the buffer
                // 3) display a region of the created waveform
                var buffer = new ldc.waveform.WaveformBuffer(shape_data);
                app.waveform = new ldc.waveform.RichWaveform(buffer, app.canvas, 0, app.ebus);
                app.waveform.display(0, 60);
                app.log("waveform is ready");

            })
            .fail(function(e) {

                // failed to obtain the shape file
                app.log("failed to load shape file");

            });
        },

        set_audio_file: function(file) {
            // turn the file object into a url object, which we can treat
            // like a url on a remote server
            var url_obj = URL.createObjectURL(file);

            this.player.setAudioUrl(url_obj);
        },

        log: function(msg) {
            var msg_board = document.getElementById(MSG_BOARD_ID);
            msg_board.innerHTML += msg + "<br>";
        },

        rewind: function(n) {
            var t = Math.max(this.waveform.windowStartTime() - n, 0);
            this.waveform.moveWindow(t);
        },

        forward: function(n) {
            var t = Math.min(this.waveform.windowStartTime() + n, this.waveform.length());
            this.waveform.moveWindow(t);
        },

        resize: function(ratio) {
            var t = this.waveform.windowStartTime();
            var w0 = this.waveform.windowDuration();
            var w = w0 * ratio;
            this.waveform.display(t, w);
        },

        cursor_pos_handler: {
            handleEvent: function(e) {
                if (e instanceof ldc.waveform.WaveformCursorEvent) {
                    document.getElementById(CURSOR_POS_ID).innerHTML = e.args();
                }
            }
        },

        play: function() {
            var region = this.waveform.getSelection();
            this.play_beg = region.pos;
            if (region.dur > 0)
                this.play_end = region.pos + region.dur;
            else
                this.play_end = this.waveform.length();
            this.player.seek(region.pos);
            this.player.play();
        },

        pause: function() {
            this.player.pause();
        },

        resume: function() {
            this.player.play();
        },

        player_ready: function() {
            this.log("player is ready");
            if (this.waveform == null) {
                this.log("waveform is not ready yet");
            }
        },

        time_updated: function(t) {
            if (t >= this.play_end) {
                this.player.pause();
                this.player.seek(this.play_end);
                t = this.play_beg;
            }
            var ev = new ldc.waveform.WaveformCursorEvent(this.player, t);
            this.ebus.queue(ev);
        }
    }

    app.init();
}

