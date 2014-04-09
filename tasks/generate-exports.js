var fs = require('fs');
var path = require('path');

var async = require('async');

var build = path.join(__dirname, '..', 'build');

var symbols = require('../build/symbols.json').symbols;
var lookup = {};
symbols.forEach(function(symbol) {
  lookup[symbol.name] = symbol;
});


/**
 * Generate a list of symbol names given a list of patterns.  Patterns may
 * include a * wildcard at the end of the string, in which case all symbol names
 * that start with the preceeding string will be matched (e.g 'foo.Bar#*' will
 * match all symbol names that start with 'foo.Bar#').
 *
 * @param {Array.<string>} patterns A list of symbol names to match.  Wildcards
 *     at the end of a string will match multiple names.
 * @param {function(Error, Array.<string>)} callback Called with the filtered
 *     list of symbol names (or any error).
 */
function filterSymbols(patterns, callback) {
  var matches = [];

  patterns.forEach(function(name) {
    var match = false;
    var pattern = (name.substr(-1) === '*');
    if (pattern) {
      name = name.substr(0, name.length - 1);
      symbols.forEach(function(symbol) {
        if (symbol.name.indexOf(name) === 0) {
          matches.push(symbol.name);
          match = true;
        }
      });
    } else {
      var symbol = lookup[name];
      if (symbol) {
        matches.push(symbol.name);
        match = true;
      }
    }
    if (!match) {
      var message = 'No matching symbol found: ' + name + (pattern ? '*' : '');
      callback(new Error(message));
    }
  });

  callback(null, matches);
}


/**
 * Get a list of patterns from the options arg.  If options.config is provided
 * it is assumed to be a JSON file with an 'exports' member that is a list
 * of symbol names or patterns.
 *
 * @param {Object} options Options.
 * @param {function(Error, Array.<string>)} callback Callback.
 */
function getPatterns(options, callback) {
  if (options.config) {
    fs.readFile(options.config, function(err, data) {
      if (err) {
        callback(err);
        return;
      }
      var obj;
      try {
        obj = JSON.parse(String(data));
      } catch (err) {
        callback(new Error('Trouble parsing file as JSON: ' + options.config));
        return;
      }
      var patterns = obj.exports;
      if (patterns && !Array.isArray(patterns)) {
        callback(new Error('Expected an exports array, got: ' + patterns));
        return;
      }
      callback(null, patterns);
    });
  } else {
    process.nextTick(function() {
      callback(null, ['*']);
    });
  }
}


/**
 * Generate goog code to export a named symbol.
 * @param {string} name Symbol name.
 * @return {string} Export code.
 */
function formatSymbolExport(name) {
  return 'goog.exportSymbol(\n' +
      '    \'' + name + '\',\n' +
      '    ' + name + ');\n';
}


/**
 * Generate goog code to export a property.
 * @param {string} name Property long name (e.g. foo.Bar#baz).
 * @return {string} Export code.
 */
function formatPropertyExport(name) {
  var parts = name.split('#');
  var prototype = parts[0] + '.prototype';
  var property = parts[1];
  return 'goog.exportProperty(\n' +
      '    ' + prototype + ',\n' +
      '    \'' + property + '\',\n' +
      '    ' + prototype + '.' + property + ');\n';
}


/**
 * Generate export code given a list of patterns that match symbol names.
 * @param {Array.<string>} patterns List of patterns.
 * @param {function(Error, string)} callback Callback called with export code
 *     (or any error).
 */
function generateExports(patterns, callback) {
  filterSymbols(patterns, function(err, symbols) {
    if (err) {
      return callback(err);
    }
    var blocks = [];
    symbols.forEach(function(name) {
      if (name.indexOf('#') > 0) {
        blocks.push(formatPropertyExport(name));
      } else {
        blocks.push(formatSymbolExport(name));
      }
    });
    callback(null, blocks.join('\n'));
  });
}


/**
 * Write the build/exports.js file.
 * @param {string} code Exports code.
 * @param {function(Error)} callback Callback.
 */
function writeExports(code, callback) {
  fs.writeFile(path.join(build, 'exports.js'), code, callback);
}


/**
 * Generate the build/exports.js file.  If the options.config value is provided,
 * it is assumed to be a path to a JSON file with an 'exports' member whose
 * value is an array of symbol names or patterns.
 *
 * @param {Object} options Options.
 * @param {function(Error)} callback Callback.
 */
exports.main = function(options, callback) {
  async.waterfall([
    getPatterns.bind(null, options),
    generateExports,
    writeExports
  ], callback);
};


if (require.main === module) {
  var options = {
    config: process.argv[2]
  };

  exports.main(options, function(err) {
    if (err) {
      console.error(err.message);
      process.exit(1);
    } else {
      process.exit(0);
    }
  });
}
