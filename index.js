var Twitter = require('twitter');
var request = require('request');
var Q = require('q');
var assign = require('object-assign');
var EventEmitter = require('events');
var TwitterError = require('twitter-error');

function TwitterService(config) {
  this.config = config || {};

  if (this.config.monitor) {
    this.log = config.log || {};
    this.logOutput = config.logOutput || console.log;
  }

  if (this.config.events) {
    this.emitter = new EventEmitter();
  }

  if (this.config.client) {
    this.client = this.config.client;
  } else if (this.config.bearer_token &&
      this.config.consumer_key && 
      this.config.consumer_secret) {
    this.client = new Twitter(this.config);
  } else if (this.config.access_token_key &&
      this.config.access_token_secret &&
      this.config.consumer_key && 
      this.config.consumer_secret) {
    this.client = new Twitter(this.config);
  } else {
    try {
      this.getAppOnlyClient(this.config); 
    } catch (ex) {
      var error = new TwitterError('Missing configuration necessary to create client', 'none');
      console.error(error, error.message, error.stack);
      console.error(ex);
    }
  }
}

/**
 * Calls the twitter rest client
 * @param {String} method
 * @param {String} endpoint
 * @param {Object} params
 **/
TwitterService.prototype.callRest = function(method, endpoint, params, cb) {
  var _this = this;

  params = params || {};
  method = method || 'get';

  if (!this.client) {
    // Create one and then call this again
    // TODO: There needs to be a better way here
    return this.getAppOnlyClient()
      .then(_this.callRest.bind(_this, method, endpoint, params));
  }

  this.logger(method, endpoint);
  this.eventEmitter('rest_call_fired', {method: method, endpoint: endpoint});

  return Q.ninvoke(this.client, method, endpoint, params)
    .then(function(response) {
      return {
        request: response[0],
        raw: response[1]
      };
    })
    .catch(function(err) {
      var error = _this.errorParser(err, endpoint);
      console.error('Twitter response error: ', error.code, error.message);
      throw new TwitterError(error.message, error.code);
    });
};

/**
 * Gets a stream from twitter
 * @param {String} endpoing
 * @param {Object} params
 * @param {Function} callback - handles stream onData
 * @param {Function} errorCallback - handles stream onError
 **/ 
TwitterService.prototype.getStream = function(endpoint, params, callback, errorCallback) {
  params = params || {};

  return Q.ninvoke(this.client, 'stream', endpoint, params)
    .then(function handleStream(stream) {
      stream.on('data', callback); 
      stream.on('error', errorCallback);
    });
};

TwitterService.prototype.errorParser = function errorParser(err, endpoint) {
  var error = err.shift();
  error.message = error.message + ' : ' + endpoint;
  return error;
};

TwitterService.prototype.getAppOnlyClient = function getAppOnlyClient(config) {
  var _this = this;

  if (!(config.consumer_key && config.consumer_secret)) {
    throw new TwitterError('Config required', 'none');
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
      _this.client = new Twitter(config);
      return _this.client;
    })
    .catch(function(err) {
      console.error('Error in requesting twitter bearer token:', err, err.stack);
    });
};

/**
 * Invalidates a bearer or access token for twitter api calls
 * @param {Object} config
 *
 **/ 
TwitterService.prototype.invalidateToken = function invalidateToken(config) {
  if (!(config.consumer_key && config.consumer_secret)) {
    throw new TwitterError('Config required', 'none');
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
      console.error('Error in invalidating twitter bearer token:', err, err.stack);
    });
};

// This was misnamed, so it's deprecated.  Should be createInstance
TwitterService.prototype.createTwitterClient = function createTwitterClient(config) {
  return this.createInstance(config);
};

/**
 * Creates a new instance of the TwitterService client
 * @param {Object} config
 **/ 
TwitterService.prototype.createInstance = function createInstance(config) {
  if (!config.access_token_key && !config.access_token_secret) {
    try {
      return this.getAppOnlyClient(config)
        .then(function(client) {
          return new TwitterService({client: client}); 
        });
    } catch (ex) {
      console.error('Exception creating twitter client:', ex);
      throw new Error(ex);
    }
  } else {
    var twitterClient = new TwitterService(config);
    return Q(twitterClient);
  }
};

/**
 * Outputs log information for twitter calls
 * @param {String} method
 * @param {String} endpoint
 **/
TwitterService.prototype.logger = function logger(method, endpoint) {
  if (this.log) {
    var key = method + ':' + endpoint;
    this.log[key] = this.log[key] || [];

    this.log[key].push(new Date());
    this.log.len = this.log[key].length;
    return this.logOutput('TwitterService log:', this.log);
  }
};

TwitterService.prototype.eventEmitter = function(evt, data) {
  if (this.emitter) {
    this.emitter.emit(evt, data);
  }
};

// Creates a token for oauth token
function createToken(key, secret) {
  var token = encodeURIComponent(key) + ':' +
    encodeURIComponent(secret);
  return new Buffer(token).toString('base64');
}

module.exports = TwitterService;

