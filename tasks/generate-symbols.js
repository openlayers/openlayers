var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;

var async = require('async');
var fse = require('fs-extra');
var walk = require('walk').walk;

var sourceDir = path.join(__dirname, '..', 'src', 'ol');
var destPath = path.join(__dirname, '..', 'build', 'symbols.json');
var jsdoc = path.join(__dirname, '..', 'node_modules', '.bin', 'jsdoc');
var jsdocConfig = path.join(
    __dirname, '..', 'buildcfg', 'jsdoc', 'symbols', 'conf.json');


/**
 * Read symbols from dest file.
 * @param {function(Error, Array, Date)} callback Callback called with any
 *     error, the symbols array, and the mtime of the symbols file.
 */
function readSymbols(callback) {
  fs.stat(destPath, function(err, stats) {
    if (err) {
      if (err.code === 'ENOENT') {
        callback(null, [], new Date(0));
      } else {
        callback(err);
      }
    } else {
      fs.readFile(destPath, function(err, data) {
        if (err) {
          callback(err);
        } else {
          callback(null, JSON.parse(String(data)).symbols, stats.mtime);
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
 * the symbols file.
 * @param {Array} symbols Array of symbol metadata.
 * @param {Date} date Modification time of symbols file.
 * @param {function(Error, Array, Array.<string>)} callback Callback called with
 *     any error, the symbols array, and the array of newer source paths.
 */
function getNewer(symbols, date, callback) {
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
    symbols.forEach(function(symbol) {
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

    symbols = symbols.filter(function(symbol) {
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

    callback(null, symbols, makeUnique(newerPaths.concat(dirtyPaths)));
  });
}


/**
 * Spawn JSDoc.
 * @param {Array} symbols Array of symbol metadata.
 * @param {Array.<string>} newerSources Paths to newer source files.
 * @param {function(Error, Array, string)} callback Callback called with any
 *     error, existing symbols, and the JSDoc output.
 */
function spawnJSDoc(symbols, newerSources, callback) {
  if (newerSources.length === 0) {
    callback(null, symbols, JSON.stringify({symbols: []}));
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
      callback(null, symbols, output);
    }
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
 * Add provides to a symbol.
 * @param {Object} symbol Symbol object.
 * @param {function(Error, Object)} callback Called with the augmented symbol or
 *     any error.
 */
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


/**
 * Parse JSDoc output and add provides data to each symbol.
 * @param {Array} symbols Existing symbols.
 * @param {string} output Output from JSDoc.
 * @param {function(Error, Array)} callback Concatenated symbols.
 */
function addAllProvides(symbols, output, callback) {
  if (!output) {
    callback(new Error('Expected JSON output'));
    return;
  }

  var data;
  try {
    data = JSON.parse(String(output));
  } catch (err) {
    callback(new Error('Failed to parse output as JSON: ' + output));
    return;
  }

  if (!data || !Array.isArray(data.symbols)) {
    callback(new Error('Expected symbols array: ' + output));
    return;
  }

  async.map(data.symbols, addProvides, function(err, newSymbols) {
    callback(err, symbols, newSymbols);
  });
}


/**
 * Write symbol metadata to the symbols file.
 * @param {Array} symbols Existing symbols.
 * @param {Array} newSymbols New symbols.
 * @param {function(Error)} callback Callback.
 */
function writeSymbols(symbols, newSymbols, callback) {

  symbols = symbols.concat(newSymbols).sort(function(a, b) {
    return a.name < b.name ? -1 : 1;
  });

  var str = JSON.stringify({symbols: symbols}, null, '  ');
  fse.outputFile(destPath, str, callback);
}


/**
 * Determine which source files have been changed, run JSDoc against those,
 * write out exported symbols, and clean up the build dir.
 *
 * @param {function(Error)} callback Called when the symbols file has been
 *     written (or if an error occurs).
 */
function main(callback) {
  async.waterfall([
    readSymbols,
    getNewer,
    spawnJSDoc,
    addAllProvides,
    writeSymbols
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
