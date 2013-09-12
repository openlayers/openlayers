/**
 * Eventually, this documentation should move to the readme.
 *
 * This Grunt configuration makes a number of tasks available for OpenLayers 3
 * development.  See `grunt --help` for task descriptions.
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
      watch: {
        // run continuously with options from configFile
      },
      single: {
        // run once
        options: {
          singleRun: true
        }
      },
      phantom: {
        // run once with PhantomJS
        options: {
          singleRun: true,
          browsers: ['PhantomJS']
        }
      }
    }
  });

  // this is required by the build task
  grunt.loadNpmTasks('grunt-openlayers');

  // pull in all tasks in the tasks dir
  grunt.loadTasks('tasks');

  grunt.registerTask('watch', ['karma:watch']);
  grunt.registerTask('default', ['build']);

};
