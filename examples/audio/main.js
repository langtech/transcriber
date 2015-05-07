goog.require('ldc');

window.onload = function(event) {
    var MSG_BOARD_ID = "message-board";
    var FILE_INPUT_ID = "file-input";
    var PLAY1_BTN_ID = "btn1";
    var PLAY2_BTN_ID = "btn2";
    var PLAYER_POS_ID = "player-pos";

    var app = {
        player: new ldc.mediaplayer.AudioPlayer,

        init: function() {
            // create player object
            this.player = new ldc.mediaplayer.AudioPlayer;
            // listen on "time updated" signal
            this.player.timeUpdated.connect(this, "time_updated");
            // listen on "player ready" signal
            this.player.playerReady.connect(this, "player_ready");

            // listen on file chooser event
            document.getElementById(FILE_INPUT_ID)
            .addEventListener("change", function() {
                app.set_audio_file(this.files[0]);
            });

            // listen on the "backward" button
            var btn1 = document.getElementById(PLAY1_BTN_ID);
            btn1.addEventListener("click", function() {
                app.play(0, 10);
            });

            // listen on the "forward" button
            var btn2 = document.getElementById(PLAY2_BTN_ID);
            btn2.addEventListener("click", function() {
                app.play(5, 15);
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

        time_updated: function(t) {
            document.getElementById(PLAYER_POS_ID).innerHTML = t;
            if (t >= this.end_at) {
                this.player.pause();
            }
        },

        player_ready: function() {
            this.log("player ready");
        },

        play: function(beg, end) {
            this.end_at = end;
            this.player.seek(beg);
            this.player.play();
        }
    }

    app.init();
}

