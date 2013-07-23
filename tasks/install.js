/**
 * Task to install non-npm based dependencies and generate externs etc.
 * Ideally the post-install dependencies are minimized.  Currently, it depends
 * on the buildpy task from grunt-openlayers.
 */


/** @param {Object} grunt Grunt DSL object. */
module.exports = function(grunt) {

  grunt.registerTask('install', 'Install non-npm dependencies.', function() {
    grunt.task.run([
      'buildpy:build',
      'buildpy:test-deps'
    ]);
  });

};
