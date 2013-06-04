var express = require('express');
var app = express();

app.use('/transcriber', express.static(__dirname));

app.listen(3000);
