'use strict';

module.exports = require('nconf')
  .use('memory')
  .env('__');
