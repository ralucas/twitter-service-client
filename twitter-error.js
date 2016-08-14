function TwitterError(message, code) {
    this.name = 'Twitter Error';
    this.message = message;
    this.code = code;
    this.stack = (new Error()).stack;
}

TwitterError.prototype = Object.create(Error.prototype);
TwitterError.prototype.constructor = TwitterError;

module.exports = TwitterError;
