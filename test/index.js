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
server.pack.register(require('inject-then'), function (err) {
  if (err) throw err;
});

var expect = require('chai').expect;
var nock   = require('nock');

describe('auth', function () {

  var mock;
  before(function () {
    mock = nock('https://cache-aws-us-east-1.iron.io');
  });

  afterEach(function () {
    mock.done();
  });

  after(function () {
    nock.cleanAll();
  });

  it('rejects requests missing an token', function () {
    return server.injectThen({
      url: '/'
    })
    .then(function (response) {
      // TODO: should be an auth strategy and be 401
      expect(response.statusCode).to.equal(400);
    });
  });

  it('responds with 403 for invalid tokens', function () {
    mock
      .get('/1/projects/ironProjectId/caches/tokens/items/myToken?oauth=ironToken')
      .reply(404, {
        msg: 'Key not found.'
      });
    return server.injectThen({
      url: '/',
      headers: {
        'X-Valet-Token': 'myToken'
      }
    })
    .then(function (response) {
      expect(response.statusCode).to.equal(403);
    });
  });

  it('responds with 500 for IronCache errors', function () {
    mock
      .get('/1/projects/ironProjectId/caches/tokens/items/myToken?oauth=ironToken')
      .reply(400, {
        msg: 'Key not found.'
      });
    return server.injectThen({
      url: '/',
      headers: {
        'X-Valet-Token': 'myToken'
      }
    })
    .then(function (response) {
      expect(response.statusCode).to.equal(500);
    });
  });

  describe('auth object', function () {

    describe('firebase token', function () {

      it('encodes the campaign id as uid');

      it('expires in 24 hours');

    });

    it('includes the firebase endpoint');

    it('includes the expiration as an ISO-8601 string');

  })

});
