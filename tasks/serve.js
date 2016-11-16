/**
 * This task starts a dev server that provides a script loader for OpenLayers
 * and Closure Library.  In addition, a static server hosts all files in the
 * repository.
 */

var path = require('path');
var url = require('url');

var Gaze = require('gaze').Gaze;
var closure = require('closure-util');
var debounce = require('debounce');
var fs = require('fs-extra');
var nomnom = require('nomnom');

var buildExamples = require('./build-examples');
var log = closure.log;


/**
 * Create a debug server for ol and Closure Library sources.
 * @param {function(Error, closure.Server)} callback Callback.
 */
var createServer = exports.createServer = function(callback) {
  var server;
  var manager = new closure.Manager({
    lib: [
      'src/**/*.js',
      'build/ol.ext/*.js',
      'test/spec/**/*.test.js',
      'test_rendering/spec/**/*.test.js',
      'build/test_requires.js',
      'build/test_rendering_requires.js'
    ],
    main: 'build/examples/*.js'
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
      loader: /^\/(?:(?:build\/examples)|(?:test(?:_rendering)?))\/loader\.js/,
      getMain: function(req) {
        var main;
        var query = url.parse(req.url, true).query;
        var referer = req.headers.referer;
        var pathName = url.parse(referer).pathname;
        if (pathName.indexOf('/test/') === 0) {
          main = path.resolve(
            path.join(process.cwd(), 'build'), 'test_requires.js');
        } else if (pathName.indexOf('/test_rendering/') === 0) {
          main = path.resolve(
            path.join(process.cwd(), 'build'), 'test_rendering_requires.js');
        } else {
          if (query.id) {
            if (referer) {
              var from = path.join(process.cwd(),
                  path.dirname(url.parse(referer).pathname));
              main = path.resolve(from, query.id + '.js');
            }
          }
        }
        return main;
      }
    });
    callback(null, server);
  });
};

/**
 * Build the examples and exit on any error.
 * @param {Function=} opt_callback Called when done building examples.
 */
function buildExamplesOrFatal(opt_callback) {
  log.info('serve', 'Building examples.');
  buildExamples(function(err) {
    if (err) {
      log.error('serve', 'Building examples failed.');
      log.error('serve', err.message);
      log.error('serve', 'Use "verbose" logging to see the full stack trace.');
      log.verbose('serve', err.stack);
      process.exit(1);
    }
    // This is awkward, but then so is CSS itself
    var src = path.join(__dirname, '..', 'css', 'ol.css');
    var dest = path.join(__dirname, '..', 'build', 'css', 'ol.css');
    fs.copy(src, dest, function(err2) {
      if (err2) {
        log.error('serve', 'Failed to copy CSS.');
        log.error('serve', err.message);
        log.error('serve',
            'Use "verbose" logging to see the full stack trace.');
        log.verbose('serve', err.stack);
        process.exit(1);
      }
      log.verbose('serve', 'Done building examples.');
      if (opt_callback) {
        opt_callback();
      }
    });
  });
}

/**
 * If running this module directly start the server.
 */
if (require.main === module) {
  var options = nomnom.options({
    port: {
      abbr: 'p',
      default: 3000,
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

  buildExamplesOrFatal(function() {
    log.info('serve', 'Parsing dependencies.');
    createServer(function(err, server) {
      if (err) {
        log.error('serve', 'Parsing failed');
        log.error('serve', err.message);
        process.exit(1);
      }
      server.listen(options.port, function() {
        log.info('serve', 'Listening on http://localhost:' +
            options.port + '/ (Ctrl+C to stop)');
      });
      server.on('error', function(err) {
        log.error('serve', 'Server failed to start: ' + err.message);
        process.exit(1);
      });
    });

    var gaze = new Gaze('examples/**/*');
    var debouncedBuild = debounce(buildExamplesOrFatal, 250);
    gaze.on('all', function(event, filepath) {
      log.verbose('serve', 'Watch event: ' + event + ' ' + filepath);
      debouncedBuild();
    });
  });

}
