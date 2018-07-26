const fse = require('fs-extra');
const path = require('path');
const generateInfo = require('./generate-info');


/**
 * Read the symbols from info file.
 * @return {Promise<Array>} Resolves with an array of symbol objects.
 */
async function getSymbols() {
  const info = await generateInfo();
  return info.symbols.filter(symbol => symbol.kind != 'member');
}

/**
 * Generate a list of imports.
 * @param {Array<Object>} symbols List of symbols.
 * @return {Promise<Array>} A list of imports sorted by export name.
 */
function getImports(symbols) {
  const imports = {};
  symbols.forEach(symbol => {
    const defaultExport = symbol.name.split('~');
    const namedExport = symbol.name.split('.');
    if (defaultExport.length > 1) {
      const from = defaultExport[0].replace(/^module\:/, './');
      const importName = from.replace(/[.\/]+/g, '$');
      const defaultImport = `import ${importName} from '${from}';`;
      imports[defaultImport] = true;
    } else if (namedExport.length > 1) {
      const from = namedExport[0].replace(/^module\:/, './');
      const importName = from.replace(/[.\/]+/g, '_');
      const namedImport = `import * as ${importName} from '${from}';`;
      imports[namedImport] = true;
    }
  });
  return Object.keys(imports).sort();
}


/**
 * Generate code to export a named symbol.
 * @param {string} name Symbol name.
 * @param {Object<string, string>} namespaces Already defined namespaces.
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
 * @param {Array<Object>} symbols List of symbols.
 * @param {Object<string, string>} namespaces Already defined namespaces.
 * @param {Array<string>} imports List of all imports.
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
  const nsdefs = [];
  const ns = Object.keys(namespaces).sort();
  for (let i = 0, ii = ns.length; i < ii; ++i) {
    if (namespaces[ns[i]]) {
      nsdefs.push(`${ns[i]} = {};`);
    }
  }
  blocks = imports.concat('\nvar ol = window[\'ol\'] = {};\n', nsdefs.sort()).concat(blocks.sort());
  blocks.push('');
  return blocks.join('\n');
}


/**
 * Generate the exports code.
 * @return {Promise<string>} Resolves with the exports code.
 */
async function main() {
  const symbols = await getSymbols();
  const imports = await getImports(symbols);
  return generateExports(symbols, {}, imports);
}


/**
 * If running this module directly, read the config file, call the main
 * function, and write the output file.
 */
if (require.main === module) {
  main().then(async code => {
    const filepath = path.join(__dirname, '..', 'build', 'index.js');
    await fse.outputFile(filepath, code);
  }).catch(err => {
    process.stderr.write(`${err.message}\n`, () => process.exit(1));
  });
}


/**
 * Export main function.
 */
module.exports = main;
