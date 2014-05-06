/**
 * This task starts a dev server that provides a script loader for OpenLayers
 * and Closure Library.  In addition, a static server hosts all files in the
 * repository.
 */

var path = require('path');
var url = require('url');

var closure = require('closure-util');
var nomnom = require('nomnom');

var log = closure.log;

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

log.info('ol', 'Parsing dependencies ...');
var manager = new closure.Manager({
  closure: true, // use the bundled Closure Library
  lib: [
    'src/**/*.js',
    'test/spec/**/*.test.js'
  ],
  main: 'examples/*.js'
});
manager.on('error', function(e) {
  log.error('ol', e.message);
});
manager.on('ready', function() {
  var server = new closure.Server({
    manager: manager,
    loader: /^\/\w+\/loader.js/,
    getMain: function(req) {
      var main;
      var query = url.parse(req.url, true).query;
      if (query.id) {
        var referer = req.headers.referer;
        if (referer) {
          var from = path.join(process.cwd(),
              path.dirname(url.parse(referer).pathname));
          main = path.resolve(from, query.id + '.js');
        }
      }
      return main;
    }
  });
  server.listen(options.port, function() {
    log.info('ol', 'Listening on http://localhost:' +
        options.port + '/ (Ctrl+C to stop)');
  });
  server.on('error', function(err) {
    log.error('ol', 'Server failed to start: ' + err.message);
    process.exit(1);
  });
});
