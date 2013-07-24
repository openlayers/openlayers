

/**
 * Task to launch the Karma test runner.  This task first spawns the server
 * task and waits for Plovr to start listening before running Karma.
 */
var path = require('path');
var karma = require('karma').server;
var plovr = require('./lib/plovr');


/** @param {Object} grunt Grunt DSL object. */
module.exports = function(grunt) {

  grunt.registerMultiTask('karma', 'Launch the Karma test runner.', function() {
    var done = this.async();
    var options = this.options();

    if (options.configFile) {
      options.configFile = path.resolve(options.configFile);
    }

    plovr.start(function(err) {
      if (err) {
        return done(err);
      }
      // start Karma
      karma.start(options, function(code) {
        plovr.stop(function() {
          if (code !== 0) {
            done(new Error('Karma exited with non-zero status: ' + code));
          } else {
            done();
          }
        });
      });
    });

    // exit cleanly on ctrl-c
    process.on('SIGINT', done);

  });

};
