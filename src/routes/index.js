'use strict';

var joi = require('joi');

module.exports = function (server) {
  server.route({
    method: 'GET',
    handler: function (request, reply) {
      
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
