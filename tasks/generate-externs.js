var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;

var async = require('async');
var fse = require('fs-extra');
var walk = require('walk').walk;

var sourceDir = path.join(__dirname, '..', 'src');
var olxPath = path.join(__dirname, '..', 'externs', 'olx.js');
var externsPath = path.join(__dirname, '..', 'build', 'ol-externs.js');
var jsdoc = path.join(__dirname, '..', 'node_modules', '.bin', 'jsdoc');
var jsdocConfig = path.join(
    __dirname, '..', 'buildcfg', 'jsdoc', 'externs', 'conf.json');


/**
 * Get the mtime of the externs file.
 * @param {function(Error, Date)} callback Callback called with any
 *     error and the mtime of the externs file (zero date if it doesn't exist).
 */
function getExternsTime(callback) {
  fs.stat(externsPath, function(err, stats) {
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
 * Generate a list of all .js paths in the source directory if any are newer
 * than the provided date.
 * @param {Date} date Modification time of externs file.
 * @param {function(Error, Array.<string>)} callback Called with any
 *     error and the array of source paths (empty if none newer).
 */
function getNewer(date, callback) {
  var paths = [];
  var newer = false;

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
      callback(null, output);
    }
  });
}


/**
 * Write externs file consisting of externs/olx.js and the JSDoc generated
 *     externs.
 * @param {Object} externs JSDoc generated externs.
 * @param {function(Error)} callback Callback.
 */
function writeExterns(externs, callback) {
  if (externs) {
    var olx;
    try {
      olx = fs.readFileSync(olxPath, {encoding: 'utf-8'})
          .replace(/ \* @api ?(.*)?(\r\n|\n|\r)/gm, '');
    } catch(e) {
      process.nextTick(function() {
        callback(null);
      });
    }
    fse.outputFile(externsPath, olx + '\n\n' + externs, callback);
  } else {
    process.nextTick(function() {
      callback(null);
    });
  }
}


/**
 * Determine if source files have been changed, run JSDoc and write updated
 * externs if there are any changes.
 *
 * @param {function(Error)} callback Called when the externs file has been
 *     written (or an error occurs).
 */
function main(callback) {
  async.waterfall([
    getExternsTime,
    getNewer,
    spawnJSDoc,
    writeExterns
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
