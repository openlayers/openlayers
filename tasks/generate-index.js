const fs = require('fs-extra');
const path = require('path');
const async = require('async');
const generateInfo = require('./generate-info');


/**
 * Read the symbols from info file.
 * @param {function(Error, Array.<string>, Array.<Object>)} callback Called
 *     with the patterns and symbols (or any error).
 */
function getSymbols(callback) {
  generateInfo(function(err) {
    if (err) {
      callback(new Error('Trouble generating info: ' + err.message));
      return;
    }
    const symbols = require('../build/info.json').symbols;
    callback(null, symbols.filter(symbol => symbol.kind != 'member'));
  });
}

const srcPath = path.posix.resolve(__dirname, '../src').replace(/\\/g, '/');
function getPath(name) {
  const fullPath = require.resolve(path.resolve('src', name));
  return './' + path.posix.relative(srcPath, fullPath.replace(/\\/g, '/'));
}

/**
 * Generate a list of symbol names.
 *
 * @param {Array.<Object>} symbols List of symbols.
 * @param {function(Error, Array.<Object>, Array.<string>)} callback Called with
 *     the filtered list of symbols and a list of all provides (or any error).
 */
function addImports(symbols, callback) {
  const imports = {};
  symbols.forEach(function(symbol) {
    const defaultExport = symbol.name.split('~');
    const namedExport = symbol.name.split('.');
    if (defaultExport.length > 1) {
      const from = defaultExport[0].replace(/^module\:/, './');
      const importName = from.replace(/[.\/]+/g, '$');
      const defaultImport = `import ${importName} from '${getPath(from)}';`;
      imports[defaultImport] = true;
    } else if (namedExport.length > 1) {
      const from = namedExport[0].replace(/^module\:/, './');
      const importName = from.replace(/[.\/]+/g, '_');
      const namedImport = `import * as ${importName} from '${getPath(from)}';`;
      imports[namedImport] = true;
    }
  });

  callback(null, symbols, Object.keys(imports).sort());
}


/**
 * Generate code to export a named symbol.
 * @param {string} name Symbol name.
 * @param {Object.<string, string>} namespaces Already defined namespaces.
 * @return {string} Export code.
 */
function formatSymbolExport(name, namespaces) {
  const parts = name.split('~');
  const isNamed = parts[0].indexOf('.') !== -1;
  const nsParts = parts[0].replace(/^module\:/, '').split(/[\/\.]/);
  const last = nsParts.length - 1;
  const importName = isNamed ?
    '_' + nsParts.slice(0, last).join('_') + '.' + nsParts[last] :
    '$' + nsParts.join('$');
  let line = nsParts[0];
  for (let i = 1, ii = nsParts.length; i < ii; ++i) {
    line += `.${nsParts[i]}`;
    namespaces[line] = (line in namespaces ? namespaces[line] : true) && i < ii - 1;
  }
  line += ` = ${importName};`;
  return line;
}


/**
 * Generate export code given a list symbol names.
 * @param {Array.<Object>} symbols List of symbols.
 * @param {Object.<string, string>} namespaces Already defined namespaces.
 * @param {Array.<string>} imports List of all imports.
 * @return {string} Export code.
 */
function generateExports(symbols, namespaces, imports) {
  let blocks = [];
  symbols.forEach(function(symbol) {
    const name = symbol.name;
    if (name.indexOf('#') == -1) {
      const block = formatSymbolExport(name, namespaces);
      if (block !== blocks[blocks.length - 1]) {
        blocks.push(block);
      }
    }
  });
  const nsdefs = ['const ol = window[\'ol\'] = {};'];
  const ns = Object.keys(namespaces).sort();
  for (let i = 0, ii = ns.length; i < ii; ++i) {
    if (namespaces[ns[i]]) {
      nsdefs.push(`${ns[i]} = {};`);
    }
  }
  blocks = imports.concat(nsdefs.sort()).concat(blocks.sort());
  blocks.push('');
  return blocks.join('\n');
}


/**
 * Generate the exports code.
 *
 * @param {function(Error, string)} callback Called with the exports code or any
 *     error generating it.
 */
function main(callback) {
  async.waterfall([
    getSymbols,
    addImports,
    function(symbols, imports, done) {
      let code, err;
      try {
        code = generateExports(symbols, {}, imports);
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
  async.waterfall([
    main,
    fs.outputFile.bind(fs, path.resolve('src', 'index.js'))
  ], function(err) {
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
