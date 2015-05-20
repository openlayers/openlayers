var fs = require('fs');
var path = require('path');

var async = require('async');
var fse = require('fs-extra');

var pkg = require('../package.json');

var root = path.join(__dirname, '..');
var buildDir = path.join(root, 'build', 'ol.ext');


/**
 * Get external module metadata.
 * @return {Array.<Object>} Array of objects representing external modules.
 */
function getExternalModules() {
  return pkg.ext.map(function(name) {
    return {
      name: name,
      main: require.resolve(name)
    };
  });
}


/**
 * Wrap a CommonJS module in Closure Library accessible code.
 * @param {Object} mod Module metadata.
 * @param {function(Error, string)} callback Called with any error and the
 *     wrapped module.
 */
function wrapModule(mod, callback) {
  fs.readFile(mod.main, function(err, data) {
    if (err) {
      callback(err);
      return;
    }
    var wrapped = 'goog.provide(\'ol.ext.' + mod.name + '\');\n' +
        '/** @typedef {function(*)} */\n' +
        'ol.ext.' + mod.name + ';\n' +
        '(function() {\n' +
        'var exports = {};\n' +
        'var module = {exports: exports};\n' +
        '/**\n' +
        ' * @fileoverview\n' +
        ' * @suppress {accessControls, ambiguousFunctionDecl, ' +
        'checkDebuggerStatement, checkRegExp, checkTypes, checkVars, const, ' +
        'constantProperty, deprecated, duplicate, es5Strict, ' +
        'fileoverviewTags, missingProperties, nonStandardJsDocs, ' +
        'strictModuleDepCheck, suspiciousCode, undefinedNames, ' +
        'undefinedVars, unknownDefines, uselessCode, visibility}\n' +
        ' */\n' + data.toString() + '\n' +
        'ol.ext.' + mod.name + ' = module.exports;\n' +
        '})();\n';
    callback(null, wrapped);
  });
}


/**
 * Build external modules.
 * @param {Array.<Object>} modules External modules.
 * @param {function(Error)} callback Called with any error.
 */
function buildModules(modules, callback) {
  async.each(modules, function(mod, done) {
    var output = path.join(buildDir, mod.name) + '.js';
    async.waterfall([
      wrapModule.bind(null, mod),
      fse.outputFile.bind(fse, output)
    ], done);
  }, callback);
}


/**
 * Build all external modules.
 * @param {function(Error)} callback Called with any error.
 */
function main(callback) {
  var modules = getExternalModules();
  buildModules(modules, callback);
}

if (require.main === module) {
  main(function(err) {
    if (err) {
      process.stderr.write(err.message + '\n');
      process.exit(1);
    } else {
      process.exit(0);
    }
  });
}

module.exports = main;
