/**
 * This task builds OpenLayers with the Closure Compiler.
 */
var path = require('path');

var async = require('async');
var closure = require('closure-util');
var fse = require('fs-extra');
var fs = require('graceful-fs');
var sourceMapGenerator = require('inline-source-map');
var nomnom = require('nomnom');
var temp = require('temp').track();
var exec = require('child_process').exec;

var generateExports = require('./generate-exports');

var log = closure.log;
var root = path.join(__dirname, '..');

var umdWrapper = '(function (root, factory) {' +
    '  if (typeof define === "function" && define.amd) {' +
    '    define([], factory);' +
    '  } else if (typeof exports === "object") {' +
    '    module.exports = factory();' +
    '  } else {' +
    '    root.ol = factory();' +
    '  }' +
    '}(this, function () {' +
    '  var OPENLAYERS = {};' +
    '  %output%\n' +
    '  return OPENLAYERS.ol;' +
    '}));';


/**
 * Apply defaults and assert that a provided config object is valid.
 * @param {Object} config Build configuration object.
 * @param {function(Error)} callback Called with an error if config is invalid.
 */
function assertValidConfig(config, callback) {
  process.nextTick(function() {
    if (!Array.isArray(config.exports)) {
      callback(new Error('Config missing "exports" array'));
      return;
    }
    if (config.namespace && typeof config.namespace !== 'string') {
      callback(new Error('Config "namespace" must be a string'));
      return;
    }
    if (config.compile && typeof config.compile !== 'object') {
      callback(new Error('Config "compile" must be an object'));
      return;
    }
    if (config.jvm && !Array.isArray(config.jvm)) {
      callback(new Error('Config "jvm" must be an array'));
      return;
    }
    if (config.src && !Array.isArray(config.src)) {
      callback(new Error('Config "src" must be an array'));
      return;
    }
    if (config.umd) {
      config.namespace = 'OPENLAYERS';
      if (config.compile) {
        config.compile.output_wrapper = umdWrapper;
      }
    }
    callback(null);
  });
}


/**
 * Read the build configuration file.
 * @param {string} configPath Path to config file.
 * @param {function(Error, Object)} callback Callback.
 */
function readConfig(configPath, callback) {
  fs.readFile(configPath, function(err, data) {
    if (err) {
      if (err.code === 'ENOENT') {
        err = new Error('Unable to find config file: ' + configPath);
      }
      callback(err);
      return;
    }
    var config;
    try {
      config = JSON.parse(String(data));
    } catch (err2) {
      callback(new Error('Trouble parsing config as JSON: ' + err2.message));
      return;
    }
    callback(null, config);
  });
}


/**
 * Write the exports code to a temporary file.
 * @param {string} exports Exports code.
 * @param {function(Error, string)} callback Called with the path to the temp
 *     file (or any error).
 */
function writeExports(exports, callback) {
  temp.open({prefix: 'exports', suffix: '.js'}, function(err, info) {
    if (err) {
      callback(err);
      return;
    }
    log.verbose('build', 'Writing exports: ' + info.path);
    fs.writeFile(info.path, exports, function(err) {
      if (err) {
        callback(err);
        return;
      }
      fs.close(info.fd, function(err) {
        if (err) {
          callback(err);
          return;
        }
        callback(null, info.path);
      });
    });
  });
}


/**
 * Get the list of sources sorted in dependency order.
 * @param {Object} config Build configuration object.
 * @param {string} exports Exports code (with goog.exportSymbol calls).
 * @param {function(Error, Array.<string>)} callback Called with a list of paths
 *     or any error.
 */
function getDependencies(config, exports, callback) {
  writeExports(exports, function(err, exportsPath) {
    if (err) {
      callback(err);
      return;
    }
    log.info('ol', 'Parsing dependencies');
    var options;
    if (config.src) {
      options = {
        lib: config.src,
        cwd: config.cwd
      };
    } else {
      options = {
        lib: ['src/**/*.js', 'build/ol.ext/*.js'],
        cwd: root
      };
    }
    closure.getDependencies(options, function(err, paths) {
      if (err) {
        callback(err);
        return;
      }
      paths.push(exportsPath);
      callback(null, paths);
    });
  });
}


/**
 * Read a file and generate an object representing the file.
 * @param {string} file File path.
 * @param {function(Error, Object)} callback Called with any error and an object
 *     with references to the path and content of the file.
 * @return {[type]} [description]
 */
function readFile(file, callback) {
  fs.readFile(file, function(err, content) {
    if (err) {
      callback(err);
    } else {
      callback(null, {path: file, content: content});
    }
  });
}


/**
 * Get the number of newlines in a string.
 * @param {string} content Content with newlines.
 * @return {number} The number of newlines.
 */
function newlineCount(content) {
  var newlines = content.match(/\n/g);
  return newlines ? newlines.length : 0;
}


var header = '// OpenLayers 3. See http://openlayers.org/\n' +
    '// License: https://raw.githubusercontent.com/openlayers/' +
    'ol3/master/LICENSE.md\n';


/**
 * Concatenate all sources.
 * @param {Array.<string>} paths List of paths to source files.
 * @param {function(Error, string)} callback Called with the concatenated
 *     output or any error.
 */
function concatenate(paths, callback) {
  async.map(paths, readFile, function(err, results) {
    if (err) {
      var msg = 'Trouble concatenating sources.  ' + err.message;
      callback(new Error(msg));
    } else {
      var parts = umdWrapper.split('%output%');
      var sourceMap = sourceMapGenerator();

      var src = parts[0] +
          'var goog = this.goog = {};' +
          'this.CLOSURE_NO_DEPS = true;\n';

      var offset = newlineCount(header) + newlineCount(src);
      for (var i = 0, ii = results.length; i < ii; ++i) {
        var content = String(results[i].content);
        src += content;
        sourceMap.addGeneratedMappings(results[i].path, content,
            {line: offset});
        sourceMap.addSourceContent(results[i].path, content);
        offset += newlineCount(content);
      }
      src += '\nOPENLAYERS.ol = ol;' + parts[1] + '\n';
      src += sourceMap.inlineMappingUrl() + '\n';
      callback(null, src);
    }
  });
}


/**
 * Run the compiler.
 * @param {Object} config Build configuration object.
 * @param {Array.<string>} paths List of paths to source files.
 * @param {function(Error, string)} callback Called with the compiled output or
 *     any error.
 */
function build(config, paths, callback) {
  var options = {
    compile: config.compile,
    cwd: config.cwd || root,
    jvm: config.jvm
  };
  if (!options.compile) {
    log.info('ol', 'No compile options found.  Concatenating ' +
        paths.length + ' sources');
    concatenate(paths, callback);
  } else {
    log.info('ol', 'Compiling ' + paths.length + ' sources');
    options.compile.js = paths.concat(options.compile.js || []);
    closure.compile(options, callback);
  }
}


/**
 * Adds a file header with the license and a footer with the most recent tag.
 * @param {string} compiledSource The compiled library.
 * @param {function(Error, string)} callback Called with the output
 *     ready to be written into a file, or any error.
 */
function addHeader(compiledSource, callback) {
  exec('git describe --tags', function(error, stdout, stderr) {
    var source = header + compiledSource;
    if (stdout !== '') {
      // Note that this is appended to the end of the file instead of the start
      // so that source map offsets still work.  If we conditionally add to the
      // header length, then we cannot generate offsets to the sourcemap during
      // compilation.
      source += '\n// Version: ' + stdout + '\n';
    }
    callback(null, source);
  });
}


/**
 * Generate a build of the library.
 * @param {Object} config Build configuration object.  Must have an "exports"
 *     array and a "compile" object with options for the compiler.
 * @param {function(Error, string)} callback Called with the compiled source
 *     or any error.
 */
function main(config, callback) {
  async.waterfall([
    assertValidConfig.bind(null, config),
    generateExports.bind(null, config),
    getDependencies.bind(null, config),
    build.bind(null, config),
    addHeader
  ], callback);
}


/**
 * If running this module directly, read the config file and call the main
 * function.
 */
if (require.main === module) {
  var options = nomnom.options({
    config: {
      position: 0,
      required: true,
      help: 'Path to JSON config file'
    },
    output: {
      position: 1,
      required: true,
      help: 'Output file path'
    },
    loglevel: {
      abbr: 'l',
      choices: ['silly', 'verbose', 'info', 'warn', 'error'],
      default: 'info',
      help: 'Log level',
      metavar: 'LEVEL'
    }
  }).parse();

  /**
   * Set the log level.
   * @type {string}
   */
  log.level = options.loglevel;

  // read the config, run the main function, and write the output file
  async.waterfall([
    readConfig.bind(null, options.config),
    main,
    fse.outputFile.bind(fse, options.output)
  ], function(err) {
    if (err) {
      log.error(err.message);
      process.exit(1);
    } else {
      process.exit(0);
    }
  });
}


/**
 * Export main function.
 */
module.exports = main;
