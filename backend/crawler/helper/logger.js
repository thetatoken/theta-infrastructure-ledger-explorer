let loggingEnabled_ = true;

module.exports = {
  isLoggingEnabled: function () {
    return loggingEnabled_;
  },
  setLoggingEnabled: function (enabled) {
    loggingEnabled_ = enabled;
  },
  maybeLog: function (type, ...args) {
    if (this.isLoggingEnabled()) {
      console.log(new Date().toLocaleString() + '[' + type + ']', ...args);
    }
  },
  log: function (...args) {
    this.maybeLog('log', ...args);
  },
  info: function (...args) {
    this.maybeLog('info', ...args);
  },
  warn: function (...args) {
    this.maybeLog('warn', ...args);
  },
  debug: function (...args) {
    this.maybeLog('debug', ...args);
  },
  error: function (...args) {
    this.maybeLog('error', ...args);
  }
}