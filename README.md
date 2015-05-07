Transcriber
===========

An HTML5 transcription tool for Aikuma

Test/development environment setup
==================================

Install dependencies first.

```sh
npm install
git submodule init
git submodule update
./node_module/.bin/bower install
```

### With HTTP server
Start an HTTP server.

```sh
node server.js # or maybe server-new.js
```

Open http://localhost:3000/transcriber/test/web/transcriber.html.

### Without HTTP server

The tool works without server too. Just open test/web/transcriber.html in a browser.

### API doc

To browse API documentation:

```sh
./node_modules/.bin/yuidoc --server 5000 js/ldc
```

Open http://localhost:5000/.

