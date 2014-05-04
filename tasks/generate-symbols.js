var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;

var async = require('async');
var fse = require('fs-extra');
var walk = require('walk').walk;

var sourceDir = path.join(__dirname, '..', 'src', 'ol');
var infoPath = path.join(__dirname, '..', 'build', 'symbols.json');
var jsdoc = path.join(__dirname, '..', 'node_modules', '.bin', 'jsdoc');
var jsdocConfig = path.join(
    __dirname, '..', 'buildcfg', 'jsdoc', 'symbols', 'conf.json');


/**
 * Create a new metadata object.
 * @return {Object} New metadata.
 */
function createInfo() {
  return {symbols: [], defines: []};
}


/**
 * Read symbols & defines metadata from info file.
 * @param {function(Error, Object, Date)} callback Callback called with any
 *     error, the metadata, and the mtime of the info file.
 */
function readInfo(callback) {
  fs.stat(infoPath, function(err, stats) {
    if (err) {
      if (err.code === 'ENOENT') {
        callback(null, createInfo(), new Date(0));
      } else {
        callback(err);
      }
    } else {
      fs.readFile(infoPath, function(err, data) {
        if (err) {
          callback(err);
        } else {
          callback(null, JSON.parse(String(data)), stats.mtime);
        }
      });
    }
  });
}


function makeUnique(array) {
  var values = {};
  array.forEach(function(value) {
    values[value] = true;
  });
  return Object.keys(values);
}


/**
 * Generate a list of .js paths in the source directory that are newer than
 * the info file.
 * @param {Object} info Symbol and defines metadata.
 * @param {Date} date Modification time of info file.
 * @param {function(Error, Object, Array.<string>)} callback Called with any
 *     error, the info object, and the array of newer source paths.
 */
function getNewer(info, date, callback) {
  var allPaths = [];
  var newerPaths = [];

  var walker = walk(sourceDir);
  walker.on('file', function(root, stats, next) {
    var sourcePath = path.join(root, stats.name);
    if (/\.js$/.test(sourcePath)) {
      allPaths.push(sourcePath);
      if (stats.mtime > date) {
        newerPaths.push(sourcePath);
      }
    }
    next();
  });
  walker.on('errors', function() {
    callback(new Error('Trouble walking ' + sourceDir));
  });
  walker.on('end', function() {
    // prune symbols if file no longer exists or has been modified
    var lookup = {};
    info.symbols.forEach(function(symbol) {
      lookup[symbol.name] = symbol;
    });

    /**
     * Gather paths for all parent symbols.
     * @param {Object} symbol Symbol to check.
     * @param {Array.<string>} paths Current paths.
     */
    function gatherParentPaths(symbol, paths) {
      if (symbol.extends) {
        symbol.extends.forEach(function(name) {
          if (name in lookup) {
            var parent = lookup[name];
            paths.push(parent.path);
            gatherParentPaths(parent, paths);
          }
        });
      }
    }

    var dirtyPaths = [];

    info.symbols = info.symbols.filter(function(symbol) {
      var dirty = allPaths.indexOf(symbol.path) < 0;
      if (!dirty) {
        // confirm that symbol and all parent paths are not newer
        var paths = [symbol.path];
        gatherParentPaths(symbol, paths);
        dirty = paths.some(function(p) {
          return newerPaths.indexOf(p) >= 0;
        });
        if (dirty) {
          dirtyPaths.push(symbol.path);
        }
      }
      return !dirty;
    });

    info.defines = info.defines.filter(function(define) {
      var dirty = allPaths.indexOf(define.path) < 0 ||
          newerPaths.indexOf(define.path) >= 0;
      if (dirty) {
        dirtyPaths.push(define.path);
      }
      return !dirty;
    });

    callback(null, info, makeUnique(newerPaths.concat(dirtyPaths)));
  });
}


/**
 * Spawn JSDoc.
 * @param {Object} info Symbol and defines metadata.
 * @param {Array.<string>} newerSources Paths to newer source files.
 * @param {function(Error, Array, string)} callback Callback called with any
 *     error, existing metadata, and the JSDoc output (new metadata).
 */
function spawnJSDoc(info, newerSources, callback) {
  if (newerSources.length === 0) {
    callback(null, info, JSON.stringify(createInfo()));
    return;
  }

  var output = '';
  var errors = '';
  var child = spawn(jsdoc, ['-c', jsdocConfig].concat(newerSources));

  child.stdout.on('data', function(data) {
    output += String(data);
  });

  child.stderr.on('data', function(data) {
    errors += String(data);
  });

  child.on('exit', function(code) {
    if (code) {
      callback(new Error(errors || 'JSDoc failed with no output'));
    } else {
      callback(null, info, output);
    }
  });
}


/**
 * Parse the JSDoc output.
 * @param {Object} info Existing metadata.
 * @param {string} output JSDoc output
 * @param {function(Error, Object, Object)} callback Called with any error,
 *     existing metadata, and new metadata.
 */
function parseOutput(info, output, callback) {
  if (!output) {
    callback(new Error('Expected JSON output'));
    return;
  }

  var newInfo;
  try {
    newInfo = JSON.parse(String(output));
  } catch (err) {
    callback(new Error('Failed to parse output as JSON: ' + output));
    return;
  }

  if (!Array.isArray(newInfo.symbols)) {
    callback(new Error('Expected symbols array: ' + output));
    return;
  }

  if (!Array.isArray(newInfo.defines)) {
    callback(new Error('Expected defines array: ' + output));
    return;
  }

  process.nextTick(function() {
    callback(null, info, newInfo);
  });
}


/**
 * Given the path to a source file, get the list of provides.
 * @param {string} srcPath Path to source file.
 * @param {function(Error, Array.<string>)} callback Called with a list of
 *     provides or any error.
 */
var getProvides = async.memoize(function(srcPath, callback) {
  fs.readFile(srcPath, function(err, data) {
    if (err) {
      callback(err);
      return;
    }
    var provides = [];
    var matcher = /goog\.provide\('(.*)'\)/;
    String(data).split('\n').forEach(function(line) {
      var match = line.match(matcher);
      if (match) {
        provides.push(match[1]);
      }
    });
    callback(null, provides);
  });
});


/**
 * Add provides data to new symbols.
 * @param {Object} info Existing symbols and defines metadata.
 * @param {Object} newInfo New metadata.
 * @param {function(Error, Object)} callback Updated metadata.
 */
function addSymbolProvides(info, newInfo, callback) {

  function addProvides(symbol, callback) {
    getProvides(symbol.path, function(err, provides) {
      if (err) {
        callback(err);
        return;
      }
      symbol.provides = provides;
      callback(null, symbol);
    });
  }

  async.map(newInfo.symbols, addProvides, function(err, newSymbols) {
    newInfo.symbols = newSymbols;
    callback(err, info, newInfo);
  });
}


/**
 * Write symbol and define metadata to the info file.
 * @param {Object} info Existing metadata.
 * @param {Object} newInfo New meatadat.
 * @param {function(Error)} callback Callback.
 */
function writeInfo(info, newInfo, callback) {

  info.symbols = info.symbols.concat(newInfo.symbols).sort(function(a, b) {
    return a.name < b.name ? -1 : 1;
  });

  info.defines = info.defines.concat(newInfo.defines).sort(function(a, b) {
    return a.name < b.name ? -1 : 1;
  });

  var str = JSON.stringify(info, null, '  ');
  fse.outputFile(infoPath, str, callback);
}


/**
 * Determine which source files have been changed, run JSDoc against those, and
 * write out updated info.
 *
 * @param {function(Error)} callback Called when the info file has been written
 *     (or an error occurs).
 */
function main(callback) {
  async.waterfall([
    readInfo,
    getNewer,
    spawnJSDoc,
    parseOutput,
    addSymbolProvides,
    writeInfo
  ], callback);
}


/**
 * If running this module directly, read the config file and call the main
 * function.
 */
if (require.main === module) {
  main(function(err) {
    if (err) {
      console.error(err.message);
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
