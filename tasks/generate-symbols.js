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


/**
 * Generate a list of .js paths in the source directory that are newer than
 * the symbols file.
 * @param {Array} symbols Array of symbol metadata.
 * @param {Date} date Modification time of symbols file.
 * @param {function(Error, Array, Array.<string>)} callback Callback called with
 *     any error, the symbols array, and the array of newer source paths.
 */
function getNewer(symbols, date, callback) {
  var all = [];
  var newer = [];

  var walker = walk(sourceDir);
  walker.on('file', function(root, stats, next) {
    var sourcePath = path.join(root, stats.name);
    if (/\.js$/.test(sourcePath)) {
      all.push(sourcePath);
      if (stats.mtime > date) {
        newer.push(sourcePath);
      }
    }
    next();
  });
  walker.on('errors', function() {
    callback(new Error('Trouble walking ' + sourceDir));
  });
  walker.on('end', function() {
    // prune symbols if file no longer exists or has been modified
    symbols = symbols.filter(function(symbol) {
      return newer.indexOf(symbol.path) < 0 && all.indexOf(symbol.path) >= 0;
    });
    callback(null, symbols, newer);
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
 * Write symbol metadata to the symbols file.
 * @param {Array} symbols Symbols.
 * @param {string} output Output from JSDoc.
 * @param {function(Error, Array.<string>)} callback Callback.
 */
function writeSymbols(symbols, output, callback) {
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

  symbols = symbols.concat(data.symbols);

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
exports.main = function(callback) {
  async.waterfall([
    readSymbols,
    getNewer,
    spawnJSDoc,
    writeSymbols
  ], callback);
};


if (require.main === module) {
  exports.main(function(err) {
    if (err) {
      console.error(err.message);
      process.exit(1);
    } else {
      process.exit(0);
    }
  });
}
