var express = require('express');
var app = express();

app.use('/transcriber', express.static(__dirname));
if (process.argv.length >= 3)
    app.use('/transcriber/test/data/aikuma', express.static(process.argv[2]));

app.listen(3000);
