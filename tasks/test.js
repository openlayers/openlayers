/**
 * This task starts a dev server that provides a script loader for OpenLayers
 * and Closure Library and runs tests in PhantomJS.
 */

var path = require('path');
var spawn = require('child_process').spawn;

var phantomjs = require('phantomjs-prebuilt');

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
    server.listen(port, '127.0.0.1');
  }
  server.once('listening', function() {
    callback(null);
  });
  _listen(min);
}


function runTests(conf, callback) {
  var coverage = 'coverage' in conf ? conf.coverage : false;
  var reporter = 'reporter' in conf ? conf.reporter : 'spec';
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
        require.resolve('mocha-phantomjs-core'),
        url + '/test/index.html',
        reporter
      ];
      var config = {
        ignoreResourceErrors: true,
        useColors: true
      };

      if (coverage) {
        config.hooks = path.join(__dirname, '../test/phantom_hooks.js');
      }

      args.push(JSON.stringify(config));

      var child = spawn(phantomjs.path, args, {stdio: 'inherit'});
      child.on('exit', function(code) {
        callback(code);
      });
    });
  });
}

if (require.main === module) {
  runTests({coverage: false, reporter: 'spec'}, function(code) {
    process.exit(code);
  });
}

module.exports = {
  runTests: runTests,
  listen: listen
};
