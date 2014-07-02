#! /bin/sh

python js/closure-library/closure/bin/calcdeps.py \
	-o compiled -c compiler.jar \
	-f '--compilation_level=ADVANCED_OPTIMIZATIONS' \
	-f '--create_name_map_files' \
	--output_file=test/web/transcriber.min.js \
	-i bower_components/q/q.js \
	-i bower_components/FileSaver/FileSaver.js \
	-i test/web/transcriber.js \
	-f '--externs=bower_components/bootstrap/dist/js/bootstrap.min.js' \
	-f '--externs=bower_components/jquery/jquery.js' \
	-f '--externs=bower_components/jplayer/jquery.jplayer/jquery.jplayer.js' \
	-f '--externs=js/ccv/ccv.js' \
	-f '--externs=externs/audio.js' \
	-f '--externs=externs/fileapi.js' \
	-f '--externs=externs/aikuma.js'

