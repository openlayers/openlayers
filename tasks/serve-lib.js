/**
 * This task starts a dev server that provides a script loader for the
 * OpenLayers library.
 */

var path = require('path');

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
      'build/ol.ext/*.js'
    ],
    cwd: path.join(__dirname, '..')
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
 * Try listening for incoming connections on a range of ports.
 * @param {number} min Minimum port to try.
 * @param {number} max Maximum port to try.
 * @param {http.Server} server The server.
 * @param {function(Error)} callback Callback called with any error.
 */
function listen(min, max, server, callback) {
  function _listen(port) {
    server.once('error', function(err) {
      if (err.code === 'EADDRINUSE') {
        log.warn(name, 'Port %d in use, trying next one', port);
        ++port;
        if (port < max) {
          _listen(port);
        } else {
          callback(new Error('Could not find an open port'));
        }
      } else {
        callback(err);
      }
    });
    server.listen(port);
  }
  server.once('listening', function() {
    callback(null);
  });
  _listen(min);
}

/**
 * If running this module directly start the server.
 */
if (require.main === module) {
  var options = nomnom.options({
    port: {
      abbr: 'p',
      default: 3000,
      help: 'Port for incoming connections (will try additional ports if used)',
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
    listen(options.port, options.port + 4, server, function(err) {
      if (err) {
        log.error(name, 'Server failed to start: ' + err.message);
        process.exit(1);
      }
      log.info(name, 'Debug server running http://localhost:' +
          server.address().port + '/loader.js (Ctrl+C to stop)');
    });
  });

}
