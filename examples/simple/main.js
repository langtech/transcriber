goog.require('ldc');

window.onload = function(event) {
    var MSG_BOARD_ID = "message-board";
    var FILE_INPUT_ID = "file-input";
    var CANVAS_ID = "waveform-canvas";
    var CANVAS_W = 800;
    var CANVAS_H = 200;
    var BACK_BTN_ID = "back-btn";
    var FORWARD_BTN_ID = "forward-btn";
    var ZOOMIN_BTN_ID = "zoomin-btn";
    var ZOOMOUT_BTN_ID = "zoomout-btn";

    var app = {
        init: function() {
            // initialize canvas on which the waveform will be drawn
            this.canvas = document.getElementById(CANVAS_ID);
            this.canvas.width = CANVAS_W;
            this.canvas.height = CANVAS_H;

            // listen on file chooser event
            document.getElementById(FILE_INPUT_ID)
            .addEventListener("change", function() {
                app.load_shape_file(this.files[0]);
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
                app.waveform = new ldc.waveform.Waveform(buffer, app.canvas, 0);
                app.waveform.display(0, 60);
                app.log("waveform is ready");

            })
            .fail(function(e) {

                // failed to obtain the shape file
                app.log("failed to load shape file");

            });
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
        }
    }

    app.init();
}

