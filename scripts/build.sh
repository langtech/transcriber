#! /bin/bash
#
# Builds a min.js and a min.css file for the transcriber application.
# This script depends on the following programs.
#
# Google Closure Compiler: scripts/compile.py requires closure compiler
# (compiler.jar) at the top level directory. Of course, java runtime is
# required too.
#
# UglifyJS: npm install uglifyjs@1
#
# UglifyCSS: npm install uglifycss
#
# Both npm commands needs to run at the top level directory.
#
# This script should be run at the top level directory too. This creates
# two files: transcriber.min.js and transcriber.min.css.
#

# Build min.js file
js_files=(
    bower_components/jquery/dist/jquery.min.js
    js/ccv/*.js bower_components/q/q.js
    bower_components/FileSaver/FileSaver.js
    bower_components/bootstrap/dist/js/bootstrap.min.js
)

:>/tmp/dump.js
for f in "${js_files[@]}"; do
    cat $f >> /tmp/dump.js
    echo >> /tmp/dump.js
done

./node_modules/.bin/uglifyjs -o transcriber.min.js /tmp/dump.js
$(python `dirname $0`/compile.py) >> transcriber.min.js
rm /tmp/dump.js

# Build min.css file
./node_modules/.bin/uglifycss bower_components/bootstrap/dist/css/bootstrap.min.css test/web/transcriber.css > transcriber.min.css

