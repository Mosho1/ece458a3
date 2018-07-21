/**
 * Webpack Dev Server
 * This file is used to run our local enviroment
 */
const webpack = require('webpack');
const express = require('express');
const WebpackDevMiddleware = require('webpack-dev-middleware');
const WebpackHotMiddleware = require('webpack-hot-middleware');
const history = require('connect-history-api-fallback');
const path = require('path');
const webpackConfig = require('./webpack.config');
const opn = require('opn');
const api = require('./api');
const port = require('./constants').port;
/**
 * Always dev enviroment when running webpack dev server
 * There are other ways to do this, so feel free to do
 * whatever you find suites your taste
 */

const env = {
  dev: process.env.NODE_ENV === 'development',
  port
};

const devServerConfig = {};

try {
  const app = express();
  const compiler = webpack(webpackConfig(env));
  const devMiddleware = WebpackDevMiddleware(compiler, devServerConfig);
  const hotMiddleware = WebpackHotMiddleware(compiler);
  app.use('/api', api);
  app.use(history());
  app.use(devMiddleware);
  app.use(hotMiddleware);
  app.listen(port, 'localhost', err => {
    if (err) {
      console.error(err);
    }
    console.log(`Server listening to port ${port}`);
    // opn(`http://localhost:${port}`);
  });
} catch (e) {
  console.error(e);
}


