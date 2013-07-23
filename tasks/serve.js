

/**
 * Task to run the Plovr server.  This should be replaced by a dynamically
 * generated script loader and a simple static server.
 */
var cp = require('child_process');
var fs = require('fs');
var glob = require('glob');
var path = require('path');

var base = path.join(__dirname, '..');

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


/** @param {Object} grunt Grunt DSL object. */
module.exports = function(grunt) {

  grunt.registerTask('serve', 'Run the Plovr server.', function() {
    var done = this.async();

    var builds = ['buildcfg/ol.json', 'buildcfg/ol-all.json'];
    var examples = glob.sync('build/examples/*.json', {cwd: base});
    var tests = ['buildcfg/test.json'];

    // start up the plovr server
    var child = cp.spawn(
        'java',
        ['-jar', plovr, 'serve'].concat(builds, examples, tests),
        {cwd: base});

    child.stderr.on('data', function(chunk) {
      grunt.log.write(String(chunk));
    });

    child.on('exit', function(code) {
      if (code !== 0) {
        done(new Error('Non-zero exit code: ' + code));
      } else {
        done();
      }
    });

    process.on('exit', function() {
      if (child.connected) {
        child.disconnect();
      }
      // TODO: make sure this is killed elsewhere
      child.kill();
    });

  });

};
