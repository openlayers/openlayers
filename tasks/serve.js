

/**
 * Task to run the Plovr server.  This should be replaced by a dynamically
 * generated script loader and a simple static server.
 */
var plovr = require('./lib/plovr');


/** @param {Object} grunt Grunt DSL object. */
module.exports = function(grunt) {

  grunt.registerTask('serve', 'Run the Plovr server.', function() {
    var done = this.async();
    plovr.start(function(err) {
      if (err) {
        return done(err);
      }
      // TODO: accept options (like port)
      grunt.log.writeln('Server running http://localhost:9810/');
    });
  });

};
