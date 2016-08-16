var fs = require('fs-extra');
var glob = require('glob');
var log = require('closure-util').log;
var path = require('path');

var build = require('../tasks/build');

/**
 * Called as callback for the glob call, will receive an array of filenames to
 * JSON-files in this directory.
 *
 * @param {Error} globErr An error or null if the glob call succeeded.
 * @param {Array.<string>} jsonFiles An array of `*.json`-files.
 */
function foundJsonConfigs(globErr, jsonFiles) {
  if (globErr) {
    log.error('compile-check', 'Trouble finding configurations: ' + globErr);
    process.exit(1);
  }
  jsonFiles.forEach(buildWithConfigFile);
}

/**
 * Creates a custom build of OpenLayers with the configuration in the specified
 * file.
 *
 * @param {String} jsonFile The file with the JSON configuration
 */
function buildWithConfigFile(jsonFile) {
  var fileName = path.basename(jsonFile);
  log.info('compile-check', 'Checking compilation config "' + fileName + '"');
  fs.readFile(jsonFile, 'utf8', function(readErr, json) {
    if (readErr) {
      log.error('compile-check', 'Trouble reading configuration: ' + readErr);
      process.exit(1);
    }
    var jsonObj = JSON.parse(json);
    build(jsonObj, compileCallback);
  });
}

/**
 * Called once the build call finishes, this function checks if we had an error
 * and bails out in that case.
 *
 * @param {compileErr} compileErr An error or null if the compile call
 *   succeeded.
 */
function compileCallback(compileErr) {
  if (compileErr) {
    log.error('compile-check', 'Trouble compiling sources: ' + compileErr);
    process.exit(1);
  }
  log.info('compile-check', '…OK');
}

// Find all JSON files in the 'expected-ok'-directory and try to use these as
// build configurations
glob(path.join(__dirname, 'expected-ok', '/*.json'), {}, foundJsonConfigs);
