

/**
 * Start/stop methods for Plovr.  This should be replaced by a dynamically
 * generated script loader and a simple static server.
 */
var cp = require('child_process');
var fs = require('fs');
var glob = require('glob');
var path = require('path');

// assumes process runs from repo root
var base = process.cwd();

// get the most recent plovr.jar
var plovr = glob.sync('build/plovr*.jar', {cwd: base})
    .sort(function(a, b) {
      return fs.statSync(a).mtime.getTime() - fs.statSync(b).mtime.getTime();
    })
    .pop();

if (!plovr) {
  console.error('Unable to find plovr.jar.  Run `npm install` first');
  process.exit(1);
}

var builds = ['buildcfg/ol.json', 'buildcfg/ol-all.json'];
var examples = glob.sync('build/examples/*.json', {cwd: base});
var tests = ['buildcfg/test.json'];

var server;


/**
 * Start the Plovr server.
 * @param {function(Error)} callback Called when server is listening (with
 *     error if server fails to start).
 * @param {number} timeout Optional timeout (default is 7000 ms).
 * @return {Process} The server process.
 */
exports.start = function(callback, timeout) {
  if (server) {
    throw new Error('Server already started');
  }

  // start up the plovr server
  server = cp.spawn(
      'java',
      ['-jar', plovr, 'serve'].concat(builds, examples, tests),
      {cwd: base});

  // fail after timeout
  var timer = setTimeout(function() {
    cleanup();
    callback(new Error('Server failed to start before timeout'));
  }, timeout || 7000);

  function cleanup() {
    clearTimeout(timer);
    server.stderr.removeAllListeners();
    server.removeAllListeners();
  }

  // buffer stderr in case of failed start
  var err = [];

  // plovr logs everything to stderr
  server.stderr.on('data', function(chunk) {
    // check for successful start
    if (String(chunk).indexOf('Listening on') === 0) {
      cleanup();
      callback();
    } else {
      // buffer
      err.push(String(chunk));
    }
  });

  // listen for premature exit
  server.on('exit', function(code) {
    cleanup();
    var msg = err.length ? err.join('\n') : 'Premature exit: ' + code;
    callback(new Error(msg));
  });

};


/**
 * Stop the Plovr server.
 * @param {function} callback Called when server exits.
 */
exports.stop = function(callback) {
  if (server) {
    if (server.connected) {
      server.disconnect();
    }
    server.on('exit', function(code) {
      server = null;
      callback();
    });
    server.kill();
  } else {
    process.nextTick(callback);
  }
};
