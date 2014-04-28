var fs = require('fs');
var path = require('path');

var async = require('async');
var fse = require('fs-extra');
var nomnom = require('nomnom');

var generateSymbols = require('./generate-symbols');

var build = path.join(__dirname, '..', 'build');


/**
 * Get a list of patterns from the config file.  If configPath is provided
 * it is assumed to be a JSON file with an 'exports' member that is a list
 * of symbol names or patterns.
 *
 * @param {string} configPath Path to config file.
 * @param {function(Error, Array.<string>)} callback Called with the list of
 *     patterns.
 */
function getPatterns(configPath, callback) {
  if (configPath) {
    fs.readFile(configPath, function(err, data) {
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
 * Read the symbols file.
 * @param {Array.<string>} patterns List of patterns to pass along.
 * @param {funciton(Error, Array.<string>, Array.<Object>)} callback Called
 *     with the patterns and symbols (or any error).
 */
function getSymbols(patterns, callback) {
  generateSymbols(function(err) {
    if (err) {
      callback(new Error('Trouble generating symbols: ' + err.message));
      return;
    }
    var symbols = require('../build/symbols.json').symbols;
    callback(null, patterns, symbols);
  });
}


/**
 * Generate a list of symbol names given a list of patterns.  Patterns may
 * include a * wildcard at the end of the string, in which case all symbol names
 * that start with the preceeding string will be matched (e.g 'foo.Bar#*' will
 * match all symbol names that start with 'foo.Bar#').
 *
 * @param {Array.<string>} patterns A list of symbol names to match.  Wildcards
 *     at the end of a string will match multiple names.
 * @param {Array.<Object>} symbols List of symbols.
 * @param {function(Error, Array.<Object>)} callback Called with the filtered
 *     list of symbols (or any error).
 */
function filterSymbols(patterns, symbols, callback) {
  var matches = [];

  var lookup = {};
  symbols.forEach(function(symbol) {
    lookup[symbol.name] = symbol;
  });

  patterns.forEach(function(name) {
    var match = false;
    var pattern = (name.substr(-1) === '*');
    if (pattern) {
      name = name.substr(0, name.length - 1);
      symbols.forEach(function(symbol) {
        if (symbol.name.indexOf(name) === 0) {
          matches.push(symbol);
          match = true;
        }
      });
    } else {
      var symbol = lookup[name];
      if (symbol) {
        matches.push(symbol);
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
 * Generate export code given a list symbol names.
 * @param {Array.<Object>} symbols List of symbols.
 * @return {string} Export code.
 */
function generateExports(symbols) {
  var blocks = [];
  var requires = {};
  symbols.forEach(function(symbol) {
    symbol.provides.forEach(function(provide) {
      requires[provide] = true;
    });
    var name = symbol.name;
    if (name.indexOf('#') > 0) {
      blocks.push(formatPropertyExport(name));
    } else {
      blocks.push(formatSymbolExport(name));
    }
  });
  blocks.unshift('\n');
  Object.keys(requires).sort().reverse().forEach(function(name) {
    blocks.unshift('goog.require(\'' + name + '\');');
  });
  return blocks.join('\n');
}


/**
 * Generate the exports code.
 *
 * @param {Array.<string>} patterns List of symbol names or patterns.
 * @param {function(Error, string)} callback Called with the exports code or any
 *     error generating it.
 */
function main(patterns, callback) {
  async.waterfall([
    getSymbols.bind(null, patterns),
    filterSymbols,
    function(symbols, done) {
      var code, err;
      try {
        code = generateExports(symbols);
      } catch (e) {
        err = e;
      }
      done(err, code);
    }
  ], callback);
}


/**
 * If running this module directly, read the config file, call the main
 * function, and write the output file.
 */
if (require.main === module) {
  var options = nomnom.options({
    output: {
      position: 0,
      required: true,
      help: 'Output file path'
    },
    config: {
      abbr: 'c',
      help: 'Path to JSON config file',
      metavar: 'CONFIG'
    }
  }).parse();

  async.waterfall([
    getPatterns.bind(null, options.config),
    main,
    fse.outputFile.bind(fse, options.output)
  ], function(err) {
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
