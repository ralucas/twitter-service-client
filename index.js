var Twitter = require('twitter');
var request = require('request');
var Q = require('q');
var assign = require('object-assign');

function TwitterService(config) {
  this.config = config || {};
  this.log = config.log || {};
  this.logOutput = config.logOutput || console.log;

  if (this.config.client) {
    this.client = this.config.client;
  } else if (this.config.bearer_token) {
    this.client = new Twitter(this.config);
  } else if (this.config.access_token_key &&
      this.config.access_token_secret) {
    assign(this.config, {
      consumer_key: process.env.TWITTER_CONSUMER_KEY,
      consumer_secret: process.env.TWITTER_CONSUMER_SECRET
    });
    this.client = new Twitter(this.config);
  } else {
    try {
      getAppOnlyClient(this.config); 
    } catch (ex) {
      var error = new Error('Missing configuration necessary to create client');
      console.error(error, error.message, error.stack);
      console.error(ex);
    }
  }
}

TwitterService.prototype.callRest = function(method, endpoint, params, cb) {
  params = params || {};
  this.logger(method, endpoint, params);
  return Q.ninvoke(this.client, method, endpoint, params)
    .then(function(response) {
      return {
        request: response[0],
        raw: response[1]
      };
    })
    .catch(function(err) {
      console.error('Twitter response error: ', err);
      throw new Error(err);
    });
};

TwitterService.prototype.logger = function logger(method, endpoint, params) {
  this.log[method] = this.log[method] || {};
  this.log[method][endpoint] = this.log[method][endpoint] || [];

  this.log[method][endpoint].push({
    timestamp: new Date(),
    params: params
  });
  return this.logOutput(this.log[method][endpoint]);
};

TwitterService.prototype.getStream = function(endpoint, params, callback, errorCallback) {
  params = params || {};

  return Q.ninvoke(this.client, 'stream', endpoint, params)
    .then(function handleStream(stream) {
      stream.on('data', callback); 
      stream.on('error', errorCallback);
    });
};

function createToken(key, secret) {
  var token = encodeURIComponent(key) + ':' +
    encodeURIComponent(secret);
  return new Buffer(token).toString('base64');
}

function getAppOnlyClient(config) {
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
      assign(config, { bearer_token: body.access_token });
      var client = new Twitter(config);
      return new TwitterService({client: client});
    })
    .catch(function(err) {
      console.error('Error in requesting twitter bearer token:', err, err.stack);
    });
}

function invalidateToken(config) {
  if (!(config.consumer_key && config.consumer_secret)) {
    throw new Error('Config required');
  }

  var token = createToken(config.consumer_key, config.consumer_secret);
 
  var params = {
    url: 'https://api.twitter.com/oauth2/invalidate_token',
    headers: {
      'Authorization': 'Basic ' + token,
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    },
    form: {
      'access_token': config.bearer_token || config.access_token
    }
  };

  return Q.ninvoke(request, 'post', params)
    .then(function(response) {
      var body = JSON.parse(response[0].body);
      assign(config, body);
      return new TwitterService(config);
    })
    .catch(function(err) {
      console.error('Error in requesting twitter bearer token:', err, err.stack);
    });

}

TwitterService.prototype.createTwitterClient = function createTwitterClient(config) {
  if (!config.access_token_key && !config.access_token_secret) {
    try {
      return getAppOnlyClient(config);
    } catch (ex) {
      console.error('Exception creating twitter client:', ex);
      throw new Error(ex);
    }
  } else {
    var twitterClient = new TwitterService(config);
    return Q(twitterClient);
  }
};

module.exports = TwitterService;

