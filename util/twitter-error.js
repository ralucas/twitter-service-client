function TwitterError(error, params) {
    this.name = 'Twitter Error';
    this.message = error.message + ' ' + JSON.stringify(params);
    this.code = error.code;
    this.params = params;
    this.stack = (new Error()).stack;
}

TwitterError.prototype = Object.create(Error.prototype);
TwitterError.prototype.constructor = TwitterError;

module.exports = TwitterError;
