var async = require('async');

var buildExt = require('./build-ext');
var parseExamples = require('./parse-examples');

/**
 * Parse examples and build external modules.
 */
async.waterfall([
  parseExamples,
  buildExt
], function(err) {
  if (err) {
    process.stderr.write(err + '\n');
    process.exit(1);
  }
});
