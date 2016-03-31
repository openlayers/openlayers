/**
 * This task instruments our source code with istanbul, runs the test suite
 * on the instrumented source and collects the coverage data. It then creates
 * test coverage reports.
 *
 * TODO This can be improved in style. We should possibly rewrite it and use
 *      async.waterfall.
 */

var fs = require('fs-extra');
var istanbul = require('istanbul');
var path = require('path');
var glob = require('glob');

var runTestsuite = require('./test').runTests;

// setup some pathes
var dir = path.join(__dirname, '../src');
var backupDir = path.join(__dirname, '../src-backup');
var instrumentedDir = path.join(__dirname, '../src-instrumented');
var coverageDir = path.join(__dirname, '../coverage');

// The main players in the coverage generation via istanbul
var instrumenter = new istanbul.Instrumenter();
var reporter = new istanbul.Reporter(false, coverageDir);
var collector = new istanbul.Collector();

// General options used for the resource shuffling / directory copying
var copyOpts = {
  // Overwrite existing file or directory
  clobber: true,
  // Preserve the mtime and atime when copying files
  preserveTimestamps: true
};

/**
 * A small utility method printing out log messages.
 * @param {string} msg The message.
 */
var log = function(msg) {
  process.stdout.write(msg + '\n');
};

/**
 * Creates folders for backup and instrumentation and copies the contents of the
 * current src folder into them.
 */
var setupBackupAndInstrumentationDir = function() {
  if (!fs.existsSync(backupDir)) {
    log('• create directory for backup of src: ' + backupDir);
    fs.mkdirSync(backupDir);
  }

  if (!fs.existsSync(instrumentedDir)) {
    log('• create directory for instrumented src: ' + instrumentedDir);
    fs.mkdirSync(instrumentedDir);
  }

  log('• copy src files to backup folder');
  fs.copySync(dir, backupDir, copyOpts);
  log('• copy src files to instrumentation folder');
  fs.copySync(dir, instrumentedDir, copyOpts);
};

/**
 * Reverts the changes done in setupBackupAndInstrumentationDir, copies the
 * backup over the src directory and removes the instrumentation and backup
 * directory.
 */
var revertBackupAndInstrumentationDir = function() {
  log('• copy original src back to src folder');
  fs.copySync(backupDir, dir, copyOpts);
  log('• delete backup directory');
  fs.removeSync(backupDir);
  log('• delete instrumentation directory');
  fs.removeSync(instrumentedDir);
};


/**
 * Callback for when runTestsuite() has finished.
 */
var collectAndWriteCoverageData = function() {
  log('• collect data from coverage.json');

  var coverageFile = path.join(__dirname,'../coverage/coverage.json');
  var coverageJson = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
  collector.add(coverageJson);

  reporter.addAll(['lcovonly','html']);

  revertBackupAndInstrumentationDir();

  log('• write report from collected data');
  reporter.write(collector, true, function() {
    process.exit(0);
  });
};

/**
 * Will instrument all JavaScript files that are passed as second parameter.
 * This is the callback to the glob call.
 * @param {Error} err Any error.
 * @param {Array.<string>} files List of file paths.
 */
var foundAllJavaScriptSourceFiles = function(err, files) {
  if (err) {
    process.stderr.write(err.message + '\n');
    process.exit(1);
  }
  log('• instrumenting every src file');
  var cnt = 0;
  files.forEach(function(file) {
    cnt++;
    var content = fs.readFileSync(file, 'utf-8');
    // derive output file name from input file name, by replacing the *last*
    // occurence of /src/ by /src-instrumented/
    var re = new RegExp('/src/', 'g');
    var m, match;
    while ((m = re.exec(file)) !== null) {
      match = m;
    }
    var outfile = file.substr(0, match.index) + '/src-instrumented/' +
        file.substr(match.index + '/src/'.length);
    var instrumented = instrumenter.instrumentSync(content, file);
    fs.writeFileSync(outfile, instrumented);
    if (cnt % 10 === 0) {
      log('  • instrumented ' + cnt + ' files');
    }
  });
  log('  • done. ' + cnt + ' files instrumented');
  log('• copy instrumented src back to src folder');

  fs.copySync(instrumentedDir, dir, copyOpts);

  log('• run test suite on instrumented code');
  runTestsuite({coverage: true, reporter: 'dot'}, collectAndWriteCoverageData);
};

/**
 * Our main method, first it sets up certain directory, and then it starts the
 * coverage process by gathering all JavaScript files and then instrumenting
 * them.
 */
var main = function() {
  setupBackupAndInstrumentationDir();
  glob(dir + '/**/*.js', {}, foundAllJavaScriptSourceFiles);
};

if (require.main === module) {
  main();
}

module.exports = main;
