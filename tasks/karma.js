

/**
 * Task to launch the Karma test runner.  This task first spawns the server
 * task and waits for Plovr to start listening before running Karma.
 */
var path = require('path');
var server = require('karma').server;


/** @param {Object} grunt Grunt DSL object. */
module.exports = function(grunt) {

  grunt.registerMultiTask('karma', 'Launch the Karma test runner.', function() {
    var done = this.async();
    var options = this.options();

    if (options.configFile) {
      options.configFile = path.resolve(options.configFile);
    }

    var child = grunt.util.spawn({
      grunt: true,
      args: ['serve']
    }, function(error, result, code) {
      if (error || code !== 0) {
        grunt.log.error(result.stderr || result.stdout);
      }
      done(error);
    });

    child.stdout.on('data', function(chunk) {

      // check to see if Plovr is listening
      if (chunk.toString().indexOf('Listening on') === 0) {
        grunt.log.write(String(chunk));
        grunt.log.write('\n');

        // start Karma
        server.start(options, function(code) {
          if (code !== 0) {
            child.kill();
          } else {
            done();
          }
        });

      }
    });

  });

};
