var expect = require('chai').expect;
var sinon = require('sinon');

var EventEmitter = require('events');
var Twitter = require('twitter');

var TwitterService = require('../index.js');
var TwitterError = require('../util/twitter-error.js');

describe('TwitterServiceClient', function() {

  describe('instantiation', function() {

    it('should throw a TwitterError if no config passed', function() {
      expect(function() {
        new TwitterService();
      }).to.throw(TwitterError, /Config required/); 
    });

    it('should have `config` as property', function() {
      var twitter = new TwitterService({
        consumer_key: 'test',
        consumer_secret: 'test'
      });
      expect(twitter).to.have.ownProperty('config');
      expect(twitter.config).to.be.an('object');
    });

    it('should not set `logOutput` if monitor option', function() {
      var twitter = new TwitterService({
        consumer_key: 'test',
        consumer_secret: 'test'
      });
      expect(twitter).to.not.have.ownProperty('logOutput'); 
    });

    it('should set the `logOutput` property if monitor option set', function() {
      var twitter = new TwitterService({
        consumer_key: 'test',
        consumer_secret: 'test',
        monitor: true
      });
      expect(twitter).to.have.ownProperty('logOutput'); 
    });

    it('should not set the event emitter if event option not set', function() {
      var twitter = new TwitterService({
        consumer_key: 'test',
        consumer_secret: 'test'
      });
      expect(twitter).to.not.have.ownProperty('emitter'); 
    });

    it('should set the event emitter if event option set', function() {
      var twitter = new TwitterService({
        consumer_key: 'test',
        consumer_secret: 'test',
        events: true
      });
      expect(twitter).to.have.ownProperty('emitter'); 
      expect(twitter.emitter).to.be.an.instanceof(EventEmitter);
    });

    it('should create a client with bearer_token', function() {
      var twitter = new TwitterService({
        consumer_key: 'test',
        consumer_secret: 'test',
        bearer_token: 'test_token' 
      });
      expect(twitter).to.have.ownProperty('client'); 
      expect(twitter.client).to.be.an.instanceof(Twitter);
    
    });

    it('should create a client with access tokens', function() {
      var twitter = new TwitterService({
        consumer_key: 'test',
        consumer_secret: 'test',
        access_token_key: 'test_token',
        access_token_secret: 'test_secret'
      });
      expect(twitter).to.have.ownProperty('client'); 
      expect(twitter.client).to.be.an.instanceof(Twitter);
    });

  });

  describe('callRest', function() {
  
  });

  describe('getStream', function() {
  
  });

  describe('errorParser', function() {
  
  });

  describe('getAppOnlyClient', function() {
  
  });

  describe('invalidateToken', function() {
  
  });

  describe('createInstance', function() {
  
  });

  describe('logger', function() {
  
  });

});
