/**
 * This task starts a dev server that provides a script loader for OpenLayers
 * and Closure Library.  In addition, a static server hosts all files in the
 * repository.
 */

var path = require('path');
var url = require('url');

var closure = require('closure-util');
var log = closure.log;

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
  server.listen(3000, function() {
    log.info('ol', 'Listening on http://localhost:3000/ (Ctrl+C to stop)');
  });
});
