var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;

var async = require('async');
var fse = require('fs-extra');
var walk = require('walk').walk;

var sourceDir = path.join(__dirname, '..', 'src');
var externsDir = path.join(__dirname, '..', 'externs');
var externsPaths = [
  path.join(externsDir, 'olx.js'),
  path.join(externsDir, 'geojson.js')
];
var infoPath = path.join(__dirname, '..', 'build', 'info.json');
var jsdoc = path.join(__dirname, '..', 'node_modules', '.bin', 'jsdoc');
var jsdocConfig = path.join(
    __dirname, '..', 'config', 'jsdoc', 'info', 'conf.json');


/**
 * Get the mtime of the info file.
 * @param {function(Error, Date)} callback Callback called with any
 *     error and the mtime of the info file (zero date if it doesn't exist).
 */
function getInfoTime(callback) {
  fs.stat(infoPath, function(err, stats) {
    if (err) {
      if (err.code === 'ENOENT') {
        callback(null, new Date(0));
      } else {
        callback(err);
      }
    } else {
      callback(null, stats.mtime);
    }
  });
}


/**
 * Test whether externs/olx.js is newer than the provided date.
 * @param {Date} date Modification time of info file.
 * @param {function(Error, Date, boolen)} callback Called with any
 *     error, the mtime of the info file (zero date if it doesn't exist), and
 *     whether externs/olx.js is newer than that date.
 */
function getNewerExterns(date, callback) {
  var newer = false;
  var walker = walk(externsDir);
  walker.on('file', function(root, stats, next) {
    var sourcePath = path.join(root, stats.name);
    externsPaths.forEach(function(path) {
      if (sourcePath === path && stats.mtime > date) {
        newer = true;
      }
    });
    next();
  });
  walker.on('errors', function() {
    callback(new Error('Trouble walking ' + sourceDir));
  });
  walker.on('end', function() {
    callback(null, date, newer);
  });
}


/**
 * Generate a list of all .js paths in the source directory if any are newer
 * than the provided date.
 * @param {Date} date Modification time of info file.
 * @param {boolean} newer Whether externs/olx.js is newer than date.
 * @param {function(Error, Array.<string>)} callback Called with any
 *     error and the array of source paths (empty if none newer).
 */
function getNewer(date, newer, callback) {
  var paths = [].concat(externsPaths);

  var walker = walk(sourceDir);
  walker.on('file', function(root, stats, next) {
    var sourcePath = path.join(root, stats.name);
    if (/\.js$/.test(sourcePath)) {
      paths.push(sourcePath);
      if (stats.mtime > date) {
        newer = true;
      }
    }
    next();
  });
  walker.on('errors', function() {
    callback(new Error('Trouble walking ' + sourceDir));
  });
  walker.on('end', function() {
    callback(null, newer ? paths : []);
  });
}


/**
 * Parse the JSDoc output.
 * @param {string} output JSDoc output
 * @return {Object} Symbol and define info.
 */
function parseOutput(output) {
  if (!output) {
    throw new Error('Expected JSON output');
  }

  var info;
  try {
    info = JSON.parse(String(output));
  } catch (err) {
    throw new Error('Failed to parse output as JSON: ' + output);
  }
  if (!Array.isArray(info.symbols)) {
    throw new Error('Expected symbols array: ' + output);
  }
  if (!Array.isArray(info.defines)) {
    throw new Error('Expected defines array: ' + output);
  }

  return info;
}


/**
 * Spawn JSDoc.
 * @param {Array.<string>} paths Paths to source files.
 * @param {function(Error, string)} callback Callback called with any error and
 *     the JSDoc output (new metadata).  If provided with an empty list of paths
 *     the callback will be called with null.
 */
function spawnJSDoc(paths, callback) {
  if (paths.length === 0) {
    process.nextTick(function() {
      callback(null, null);
    });
    return;
  }

  var output = '';
  var errors = '';
  var cwd = path.join(__dirname, '..');
  var child = spawn(jsdoc, ['-c', jsdocConfig].concat(paths), {cwd: cwd});

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
      var info;
      try {
        info = parseOutput(output);
      } catch (err) {
        callback(err);
        return;
      }
      callback(null, info);
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
 * Add provides data to new symbols.
 * @param {Object} info Symbols and defines metadata.
 * @param {function(Error, Object)} callback Updated metadata.
 */
function addSymbolProvides(info, callback) {
  if (!info) {
    process.nextTick(function() {
      callback(null, null);
    });
    return;
  }

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

  async.map(info.symbols, addProvides, function(err, newSymbols) {
    info.symbols = newSymbols;
    callback(err, info);
  });
}


/**
 * Write symbol and define metadata to the info file.
 * @param {Object} info Symbol and define metadata.
 * @param {function(Error)} callback Callback.
 */
function writeInfo(info, callback) {
  if (info) {
    var str = JSON.stringify(info, null, '  ');
    fse.outputFile(infoPath, str, callback);
  } else {
    process.nextTick(function() {
      callback(null);
    });
  }
}


/**
 * Determine if source files have been changed, run JSDoc and write updated
 * info if there are any changes.
 *
 * @param {function(Error)} callback Called when the info file has been written
 *     (or an error occurs).
 */
function main(callback) {
  async.waterfall([
    getInfoTime,
    getNewerExterns,
    getNewer,
    spawnJSDoc,
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
      process.stderr.write(err.message + '\n');
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
