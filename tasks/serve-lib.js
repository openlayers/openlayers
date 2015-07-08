/**
 * This task starts a dev server that provides a script loader for the
 * OpenLayers library.
 */

var path = require('path');
var url = require('url');

var closure = require('closure-util');
var nomnom = require('nomnom');

var log = closure.log;
var name = path.basename(__filename, '.js');

/**
 * Create a debug server for the OpenLayers and Closure Library sources.
 * @param {function(Error, closure.Server)} callback Callback.
 */
var createServer = exports.createServer = function(callback) {
  var server;
  var manager = new closure.Manager({
    lib: [
      'src/**/*.js',
      'build/ol.ext/*.js',
    ]
  });
  manager.on('error', function(err) {
    if (server) {
      log.error('serve', err.message);
    } else {
      callback(err);
    }
  });
  manager.on('ready', function() {
    server = new closure.Server({
      manager: manager,
      loader: '/loader.js'
    });
    callback(null, server);
  });
};

/**
 * If running this module directly start the server.
 */
if (require.main === module) {
  var options = nomnom.options({
    port: {
      abbr: 'p',
      default: 3001,
      help: 'Port for incoming connections',
      metavar: 'PORT'
    },
    loglevel: {
      abbr: 'l',
      choices: ['silly', 'verbose', 'info', 'warn', 'error'],
      default: 'info',
      help: 'Log level',
      metavar: 'LEVEL'
    }
  }).parse();

  /** @type {string} */
  log.level = options.loglevel;

  log.info(name, 'Parsing dependencies.');
  createServer(function(err, server) {
    if (err) {
      log.error(name, 'Parsing failed');
      log.error(name, err.message);
      process.exit(1);
    }
    server.listen(options.port, function() {
      log.info(name, 'Debug server running http://localhost:' +
          options.port + '/loader.js (Ctrl+C to stop)');
    });
    server.on('error', function(err) {
      log.error(name, 'Server failed to start: ' + err.message);
      process.exit(1);
    });
  });

}
