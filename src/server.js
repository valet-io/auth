'use strict';

var hapi   = require('hapi');
var _      = require('lodash');
var good   = require('good');
var config = require('./config');

var server = new hapi.Server('0.0.0.0', config.get('PORT'), {
  cors: true
});

if (config.get('ssl')) {
  server.ext('onRequest', function (request, reply) {
    if (request.headers['x-forwarded-proto'] !== 'https') {
      return reply('Forwarding to https')
        .redirect('https://' + request.headers.host + request.path);
    }
    reply();
  });
}


server.pack.register({
  plugin: good,
  options: {
    reporters: [{
      reporter: good.GoodConsole
    }]
  }
}, function (err) {
  if (err) throw err;
});

_.each(require('require-all')(__dirname + '/routes'), function (fn) {
  fn(server);
});


module.exports = server;
