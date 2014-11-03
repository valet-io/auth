'use strict';

var config         = require('../config');
var tokenGenerator = require('firebase-token-generator')(config.get('firebase:secret'));
var wreck          = require('wreck');
var boom           = require('boom');
var joi            = require('joi');
var path           = require('path');
var moment         = require('moment');

module.exports = function (server) {
  server.route({
    method: 'GET',
    handler: function (request, reply) {
      wreck.get(path.join(
        'https://cache-aws-us-east-1.iron.io/1/projects/',
        config.get('iron:project_id'),
        'caches',
        'tokens',
        'items',
        request.headers['x-valet-token'] + 
        '?oauth=' + config.get('iron:token')
      ), {
        json: true
      },
      function (err, response, payload) {
        if (response.statusCode >= 400) {
          return reply(boom.forbidden('Token not found'));
        }
        else {
          var campaign = JSON.parse(payload.value);
          var expiration = moment.add(24, 'hours');
          var token = tokenGenerator.createToken({
            uid: campaign.id
          },
          {
            expires: expiration.unix()
          });
          reply({
            firebase_token: token,
            firebase_endpoint: path.join(config.get('firebase:base'), campaign.id),
            expires_at: expiration
          });
        }
      });
    },
    config: {
      validate: {
        headers: joi.object()
          .keys({
            'X-Valet-Token': joi.string().required()
          })
          .unknown(true)
      }
    }
  });
};
