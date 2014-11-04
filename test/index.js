'use strict';

var config = require('../src/config');
config.set('firebase', {
  secret: 'fbSecret',
  base: 'fbBase'
});
config.set('iron', {
  project_id: 'ironProjectId',
  token: 'ironToken'
});

var server = require('../src/server');

describe('auth', function () {

  it('rejects requests missing an token');

  it('responds with 403 for invalid tokens');

  describe('auth object', function () {

    describe('firebase token', function () {

      it('encodes the campaign id as uid');

      it('expires in 24 hours');

    });

    it('includes the firebase endpoint');

    it('includes the expiration as an ISO-8601 string');

  })

});
