var Twitter = require('twitter');
var request = require('request');
var Q = require('q');
var assign = require('object-assign');

function TwitterService(config) {
  this.config = config || {};

  if (this.config.client) {
    this.client = this.config.client;
  } else if (this.config.access_token) {
    this.client = new Twitter(this.config);
  } else if (this.config.access_token_key &&
      this.config.access_token_secret) {
    assign(this.config, {
      consumer_key: process.env.TWITTER_CONSUMER_KEY,
      consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    });
    this.client = new Twitter(clientConfig);
  } else {
    try {
      return getAccessToken(this.config); 
    } catch (ex) {
      console.error(new Error('Missing configuration necessary to create client'));
    }
  }
}

TwitterService.prototype.callRest = function(method, endpoint, params) {
  params = params || {};
  return Q.ninvoke(this.client, method, endpoint, params)
    .catch(function(err) {
      console.error('Twitter response error: ', err);
      throw new Error(err);
    });
};

function createToken(key, secret) {
  var token = encodeURIComponent(key) + ':' +
    encodeURIComponent(secret);

  return new Buffer(token).toString('base64');
}

function getAccessToken(config) {
  if (!(config.consumer_key && config.consumer_secret)) {
    throw new Error('Config required');
  }

  var token = createToken(config.consumer_key, config.consumer_secret);
 
  var params = {
    url: 'https://api.twitter.com/oauth2/token',
    headers: {
      'Authorization': 'Basic ' + token,
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    },
    form: {
      'grant_type': 'client_credentials'
    }
  };

  return Q.ninvoke(request, 'post', params)
    .then(function(response) {
      var body = JSON.parse(response[0].body);
      console.log('tokens', body);
      assign(config, body);
      return new TwitterService(options);
    })
    .catch(function(err) {
      console.error('Error in requesting twitter bearer token:', err, err.stack);
    });
}

exports.createTwitterClient = function createTwitterClient(config) {
  if (!config.access_token_key && !config.access_token_secret) {
    try {
      return getAccessToken(config);
    } catch (ex) {
      console.error('Exception creating twitter client:', ex);
    }
  } else {
    return new TwitterService(config);    
  }
};

module.exports = TwitterService;

