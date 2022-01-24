var fs = require('fs')

let loggingEnabled_ = true;
var fileCount = 0;
var lineCount = 0;
var linesPerFile = 4500;
var file = null;
var prefix = 'crawler';
module.exports = {
  initialize: function (pf) {
    if (pf) prefix = pf;
    makeSurePathExist(`./log/`);
    var filename = makeLogFileName(fileCount);
    file = fs.createWriteStream(filename, { 'flags': 'w', 'encoding': 'utf8', 'mode': 0644 });
  },
  isLoggingEnabled: function () {
    return loggingEnabled_;
  },
  setLoggingEnabled: function (enabled) {
    loggingEnabled_ = enabled;
  },
  maybeLog: function (type, ...args) {
    var msg = args.join(" ");
    file.write(new Date().toLocaleString() + '[' + type + ']');
    if (type === 'error') {
      msg = args[0];
      var exmsg = "";
      if (msg.message) {
        exmsg += msg.message;
      }
      if (msg.stack) {
        exmsg += ' | stack: ' + msg.stack;
      }
      msg = exmsg;
    }
    if (typeof msg !== 'string') {
      msg = JSON.stringify(msg);
    }
    file.write(msg);
    file.write("\r\n");

    lineCount++;
    if (lineCount > linesPerFile) {
      fileCount++;
      lineCount = 0;
      createNewFile();
    }

    if (this.isLoggingEnabled()) {
      console.log(new Date().toLocaleString() + '[' + type + ']', msg);
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
function to2Digit(value) {
  if (value < 10) {
    return "0" + value;
  }
  return value;
}

function makeSurePathExist(path) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }
}

function makeLogFileName(count) {
  var now = new Date();
  var year = 1900 + now.getYear();
  var month = to2Digit(now.getMonth() + 1);
  var date = to2Digit(now.getDate());
  var hour = to2Digit(now.getHours());
  var min = to2Digit(now.getMinutes());
  var index = to2Digit(count);
  return `./log/${prefix}` + '-' + year + "-" + month + "-" + date + "_" + hour + "-" + min + "_" + index + ".txt";
};

function createNewFile() {
  if (file != null) {
    file.end();
  }

  var filename = makeLogFileName(fileCount);
  file = fs.createWriteStream(filename, { 'flags': 'w', 'encoding': 'utf8', 'mode': 0644 });
}