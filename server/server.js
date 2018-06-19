'use strict';

var express = require('express');
var app = express();

// prepare server routing
app.use('/', express.static(__dirname + '/../www')); // redirect static calls
app.set('port', process.env.PORT || 3000); // main port

// prepare our API endpoint routing
var oauth = require('./oauthtoken');
var oss = require('./oss');
var modelderivative = require('./ModelDerivative');
app.use('/', oauth); // redirect oauth API calls
app.use('/', oss); // redirect OSS API calls
app.use('/', modelderivative); // redirect model derivative API calls

module.exports = app;