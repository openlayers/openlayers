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

fs.mkdirSync(coverageDir);

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
  log('• collect data from coverage *.json files');

  var coverageFiles = [
    path.join(__dirname, '..', 'coverage', 'coverage.json'),
    path.join(__dirname, '..', 'coverage', 'coverage-rendering.json')
  ];
  coverageFiles.forEach(function(coverageFile) {
    if (fs.existsSync(coverageFile)) {
      log('  • collect data from ' + path.basename(coverageFile));
      var coverageJson = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
      collector.add(coverageJson);
    }
  });

  reporter.addAll(['lcovonly','html']);

  revertBackupAndInstrumentationDir();

  log('• write report from collected data');
  reporter.write(collector, true, function() {
    process.exit(0);
  });
};

/**
 * Runs the rendering test by spawning a call to `make test-rendering`. The
 * `make`-call sets up certain things so that the rendering tests can actually
 * run, which is why we call it this way.
 *
 * @param  {Function} callback The callback to invoke once `make` has exited.
 *     Will receive the exit code.
 */
var runRenderingTestsuite = function(callback) {
  var spawn = require('child_process').spawn;
  var child = spawn('make', ['test-rendering'], {stdio: 'inherit'});
  child.on('exit', function(code) {
    callback(code);
  });
};

/**
 * Derive output file name from input file name, by replacing the *last*
 * occurence of `/src/` by `/src-instrumented/`
 *
 * @param {String} file The input filename.
 * @return {String} file The output filename.
 */
var outputFilenameByFilename = function(file) {
  var search = '/src/';
  var replace = '/src-instrumented/';
  var re = new RegExp(search, 'g');
  var m, match;
  while ((m = re.exec(file)) !== null) {
    match = m;
  }
  var idx = match.index;
  var outfile = file.substr(0, idx) + replace +
      file.substr(idx + search.length);

  return outfile;
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
    var outfile = outputFilenameByFilename(file);
    var instrumented = instrumenter.instrumentSync(content, file);
    fs.writeFileSync(outfile, instrumented);
    if (cnt % 10 === 0) {
      log('  • instrumented ' + cnt + ' files');
    }
  });
  log('  • done. ' + cnt + ' files instrumented');
  log('• copy instrumented src back to src folder');

  fs.copySync(instrumentedDir, dir, copyOpts);

  log('• run test suites on instrumented code');

  log('  • run rendering test suite');
  runRenderingTestsuite(function(codeRendering) {
    if (codeRendering === 0) {
      log('  • run standard test suite');
      runTestsuite({coverage: true, reporter: 'dot'}, function(code) {
        if (code === 0) {
          collectAndWriteCoverageData();
        } else {
          process.stderr.write('Trouble running the standard testsuite\n');
          process.exit(1);
        }
      });
    } else {
      process.stderr.write('Trouble running the rendering testsuite\n');
      process.exit(1);
    }
  });
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
