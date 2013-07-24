/**
 * Eventually, this documentation should move to the readme.
 *
 * This Grunt configuration makes a number of tasks available for OpenLayers 3
 * development.
 *
 * grunt build - Pull down extra dependencies and build the library.
 * grunt serve - Start the Plovr server (for viewing examples).
 * grunt karma - Start the Karma test runner (also runs Plovr).
 *
 * See `grunt --help` for more detail.
 */


/**
 * @param {Object} grunt Grunt DSL object.
 */
module.exports = function(grunt) {

  grunt.initConfig({
    karma: {
      options: {
        configFile: 'test/karma.conf.js'
      },
      // run Karma with options from configFile
      watch: {},
      // run tests with Karma once
      single: {
        options: {
          singleRun: true
        }
      }
    }
  });

  // this is required by the build task
  grunt.loadNpmTasks('grunt-openlayers');

  grunt.loadTasks('tasks');

  grunt.registerTask('default', ['build']);

};
