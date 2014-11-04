'use strict';

var config = require('../src/config');
config.set('firebase', {
  secret: 'fbSecret',
  base: 'https://fbbase'
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
var jwt    = require('jwt-simple');

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

    var auth;
    before(function () {
      mock
        .get('/1/projects/ironProjectId/caches/tokens/items/myToken?oauth=ironToken')
        .reply(200, {
          cache: 'tokens',
          key: 'myToken',
          value: JSON.stringify({
            campaign: {
              id: 'campaignId'
            }
          }),
          cas: 12345,
          flags: 0,
          expires: '9999-01-01T00:00:00Z'
        });
      return server.injectThen({
        url: '/',
        headers: {
          'X-Valet-Token': 'myToken'
        }
      })
      .then(function (response) {
        auth = response.result;
      });
    });

    describe('firebase token', function () {

      it('is included', function () {
        expect(auth.firebase_token).to.be.a('string');
      });

      it('encodes the campaign id as uid', function () {
        expect(jwt.decode(auth.firebase_token, 'fbSecret'))
          .to.have.deep.property('d.uid', 'campaignId');
      });

      it('expires in 24 hours', function () {
        expect(jwt.decode(auth.firebase_token, 'fbSecret'))
          .to.have.property('exp')
          .that.equals(Math.floor(new Date(auth.expires_at).getTime() / 1000));
      });

    });

    it('includes the firebase endpoint', function () {
      expect(auth.firebase_endpoint).to.equal('https://fbbase/campaignId');
    });

    it('includes the expiration as an ISO-8601 string', function () {
      expect(auth.expires_at.toJSON()).to.be.a('string');
      expect(new Date(auth.expires_at).getTime())
        .to.be.within(10, Date.now() + 24 * 60 * 60 * 1000);
    });

  })

});
