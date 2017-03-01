var fs = require('fs-extra');

// The number of files that we need to generate goog.require's for.
var numFiles = process.argv.length - 1;

/**
 * Object used a set of found goog.provide's.
 * @type {Object.<string, boolean>}
 */
var requires = {};

process.argv.forEach(function(val, index, array) {

  if (index === 0) {
    return;
  }

  fs.readFile(val, function(err, data) {
    if (err) {
      return;
    }

    var re = new RegExp('goog\\.provide\\(\'(.*)\'\\);');

    data.toString().split('\n').forEach(function(line) {
      var match = line.match(re);
      if (match) {
        requires[match[1]] = true;
      }
    });

    if (--numFiles === 0) {
      Object.keys(requires).sort().forEach(function(key) {
        process.stdout.write('goog.require(\'' + key + '\');\n');
      });
    }

  });

});
