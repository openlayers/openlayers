const fs = require('fs-extra');
const path = require('path');
const spawn = require('child_process').spawn;

const async = require('async');
const walk = require('walk').walk;
const isWindows = process.platform.indexOf('win') === 0;

const sourceDir = path.join(__dirname, '..', 'src');
const externsDir = path.join(__dirname, '..', 'externs');
const externsPaths = [
  path.join(externsDir, 'geojson.js')
];
const infoPath = path.join(__dirname, '..', 'build', 'info.json');

/**
 * Get checked path of a binary.
 * @param {string} binaryName Binary name of the binary path to find.
 * @return {string} Path.
 */
function getBinaryPath(binaryName) {
  if (isWindows) {
    binaryName += '.cmd';
  }

  const jsdocResolved = require.resolve('jsdoc/jsdoc.js');
  const expectedPaths = [
    path.join(__dirname, '..', 'node_modules', '.bin', binaryName),
    path.resolve(path.join(path.dirname(jsdocResolved), '..', '.bin', binaryName))
  ];

  for (let i = 0; i < expectedPaths.length; i++) {
    const expectedPath = expectedPaths[i];
    if (fs.existsSync(expectedPath)) {
      return expectedPath;
    }
  }

  throw Error('JsDoc binary was not found in any of the expected paths: ' + expectedPaths);
}

const jsdoc = getBinaryPath('jsdoc');

const jsdocConfig = path.join(
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
 * Test whether any externs are newer than the provided date.
 * @param {Date} date Modification time of info file.
 * @param {function(Error, Date, boolen)} callback Called with any
 *     error, the mtime of the info file (zero date if it doesn't exist), and
 *     whether any externs are newer than that date.
 */
function getNewerExterns(date, callback) {
  let newer = false;
  const walker = walk(externsDir);
  walker.on('file', function(root, stats, next) {
    const sourcePath = path.join(root, stats.name);
    externsPaths.forEach(function(path) {
      if (sourcePath === path && stats.mtime > date) {
        newer = true;
      }
    });
    next();
  });
  walker.on('errors', function() {
    callback(new Error('Trouble walking ' + externsDir));
  });
  walker.on('end', function() {
    callback(null, date, newer);
  });
}


/**
 * Generate a list of all .js paths in the source directory if any are newer
 * than the provided date.
 * @param {Date} date Modification time of info file.
 * @param {boolean} newer Whether any externs are newer than date.
 * @param {function(Error, Array.<string>)} callback Called with any
 *     error and the array of source paths (empty if none newer).
 */
function getNewer(date, newer, callback) {
  let paths = [].concat(externsPaths);

  const walker = walk(sourceDir);
  walker.on('file', function(root, stats, next) {
    const sourcePath = path.join(root, stats.name);
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

    /**
     * Windows has restrictions on length of command line, so passing all the
     * changed paths to a task will fail if this limit is exceeded.
     * To get round this, if this is Windows and there are newer files, just
     * pass the sourceDir to the task so it can do the walking.
     */
    if (isWindows) {
      paths = [sourceDir].concat(externsPaths);
    }

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

  let info;
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

  let output = '';
  let errors = '';
  const cwd = path.join(__dirname, '..');
  const child = spawn(jsdoc, ['-c', jsdocConfig].concat(paths), {cwd: cwd});

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
      let info;
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
 * Write symbol and define metadata to the info file.
 * @param {Object} info Symbol and define metadata.
 * @param {function(Error)} callback Callback.
 */
function writeInfo(info, callback) {
  if (info) {
    const str = JSON.stringify(info, null, '  ');
    fs.outputFile(infoPath, str, callback);
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
