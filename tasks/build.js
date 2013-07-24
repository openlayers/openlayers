/**
 * Task to install non-npm based dependencies, generate externs/exports, and
 * build the library.  Ideally the post-install dependencies can be minimized.
 * Currently, this depends on the buildpy task from grunt-openlayers.
 */


/** @param {Object} grunt Grunt DSL object. */
module.exports = function(grunt) {

  grunt.registerTask('build', 'Build the library.', function() {
    grunt.task.run([
      'buildpy:build',
      'buildpy:test-deps'
    ]);
  });

};
