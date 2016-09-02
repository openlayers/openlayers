/**
 * This task starts a dev server that provides a script loader for OpenLayers
 * and Closure Library and runs rendering tests in SlimerJS.
 */

var path = require('path');
var spawn = require('child_process').spawn;

var slimerjs = require('slimerjs');

var serve = require('./serve');
var listen = require('./test').listen;


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
    var profile = path.join(__dirname, '../build/slimerjs-profile');
    var args = [
      '-profile',
      profile,
      path.join(__dirname,
          '../test_rendering/test.js'),
      url + '/test_rendering/index.html'
    ];

    // TODO
    // Workaround for https://github.com/laurentj/slimerjs/issues/333. When a
    // version with the fix is released, replace block below with:
    // var child = spawn(slimerjs.path, args, {stdio: 'pipe'});
    // child.on('exit', function(code) {
    //   process.exit(code);
    // }

    var child = spawn(slimerjs.path, args, {stdio: 'pipe'});
    child.stdout.on('data', function(data) {
      process.stdout.write(data);
      if (data == 'All tests passed.\n') {
        process.exit(0);
      }
    });
    child.on('exit', function() {
      process.exit(1);
    });
  });

});
