/**
 * This task compiles all custom build configurations in the folder
 * `test_custom_builds`.
 */

var path = require('path');
var async = require('async');
var closure = require('closure-util');
var fs = require('fs-extra');

var build = require('./build');
var buildTools = require('./build-tools');

var log = closure.log;
log.level = 'info';

var srcDir = path.join(__dirname, '..', 'test_custom_builds');
var destDir = path.join(__dirname, '..', 'build', 'test_custom_builds');

function buildConfig(configFile, callback) {
  log.info('Compiling ' + configFile);
  var targetFile = configFile.replace('json', 'js');

  async.waterfall([
    buildTools.readConfig.bind(null, path.join(srcDir, configFile)),
    build,
    fs.outputFile.bind(fs, path.join(destDir, targetFile))
  ], function(err) {
    if (err) {
      log.error(err.message);
      process.exit(1);
    } else {
      callback(null);
    }
  });
}

var files = fs.readdirSync(srcDir);
async.eachSeries(files, buildConfig, function(err) {
  log.info('All custom build configs compile');
  process.exit(0);
});
