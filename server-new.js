var express = require('express');
var app = express();

app.use('/transcriber', express.static(__dirname));
if (process.argv.length >= 3)
    app.use('/transcriber/test/data/aikuma-new', express.static(process.argv[2]));

app.get('/index.json', function(req, res, next) {
	res.sendfile('test/data/aikuma-new/index.json');
});

app.get('/recording/:uuid', function(req, res, next) {
	var a = req.params.uuid.split('-');
	res.sendfile('test/data/aikuma-new/recordings/' + a[0] + '/' + req.params.uuid + '.wav');
});

app.get('/recording/:uuid/mapfile', function(req, res, next) {
	var a = req.params.uuid.split('-');
	res.sendfile('test/data/aikuma-new/recordings/' + a[0] + '/' + req.params.uuid + '.map');
});

app.get('/recording/:uuid/shapefile', function(req, res, next) {
	var a = req.params.uuid.split('-');
	res.sendfile('test/data/aikuma-new/recordings/' + a[0] + '/' + req.params.uuid + '.shape');
});

app.get('/speaker/:uuid/image', function(req, res, next) {
	res.sendfile('test/data/aikuma-new/speakers/' + req.params.uuid + '/' + req.params.uuid + '-image.jpg');
});

app.get('/speaker/:uuid/smallimage', function(req, res, next) {
	res.sendfile('test/data/aikuma-new/speakers/' + req.params.uuid + '/' + req.params.uuid + '-image-small.jpg');
});

app.get('/transcript/:uuid', function(req, res, next) {
	var a = req.params.uuid.split('-');
	res.sendfile('test/data/aikuma-new/recordings/' + a[0] + '/' + req.params.uuid + '.txt');
});

app.listen(3000);
