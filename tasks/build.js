/**
 * Task to install non-npm based dependencies, generate externs/exports, and
 * build the library.  Ideally the post-install dependencies can be minimized.
 * Currently, this depends on the buildpy task from grunt-openlayers.
 */


/** @param {Object} grunt Grunt DSL object. */
module.exports = function(grunt) {

  var description = 'Build a compiled version of the library.  This task ' +
      'ensures that all development dependencies are met, generates exports ' +
      'and externs, and builds the full library.';

  grunt.registerTask('build', description, function() {
    grunt.task.run([
      'buildpy:build',
      'buildpy:test-deps'
    ]);
  });

};
