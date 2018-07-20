const express = require('express');
const http = require('http');
const host = process.env.HOST || '0.0.0.0';
const { prodPort } = require('./webpack/constants');
const api = require('./webpack/api');
const root = __dirname;
const history = require('connect-history-api-fallback');

const app = express();

app.use(function (req, res, next) { console.log(req.url); next(); });
app.use('/api', api);
app.use(history());
app.use(express.static(root + '/build'));

const server = http.createServer(app);
server.listen(prodPort, host, serverStarted);

function serverStarted() {
    console.log('Server started at', host, prodPort);
}