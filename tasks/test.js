/**
 * This task starts a dev server that provides a script loader for OpenLayers
 * and Closure Library and runs tests in PhantomJS.
 */

var path = require('path');
var spawn = require('child_process').spawn;

var phantomjs = require('phantomjs');

var serve = require('./serve');

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
    server.listen(port, callback);
  }
  _listen(min);
}


/**
 * Create the debug server and run tests.
 */
serve.createServer(function(err, server) {
  if (err) {
    process.stderr.write(err.message + '\n');
    process.exit(1);
  }

  listen(3001, 3005, server, function(err) {
    if (err) {
      process.stderr.write('Server failed to start: ' + err.message + '\n');
      process.exit(1);
    }

    var address = server.address();
    var url = 'http://' + address.address + ':' + address.port;
    var args = [
      path.join(__dirname,
          '../node_modules/mocha-phantomjs/lib/mocha-phantomjs.coffee'),
      url + '/test/index.html'
    ];

    var child = spawn(phantomjs.path, args, {stdio: 'inherit'});
    child.on('exit', function(code) {
      process.exit(code);
    });
  });

});
