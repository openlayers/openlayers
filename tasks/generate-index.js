import esMain from 'es-main';
import fse from 'fs-extra';
import generateInfo from './generate-info.js';
import path from 'path';
import {dirname} from 'path';
import {fileURLToPath} from 'url';

/**
 * Read the symbols from info file.
 * @return {Promise<Array>} Resolves with an array of symbol objects.
 */
async function getSymbols() {
  const info = await generateInfo();
  return info.symbols.filter((symbol) => symbol.kind != 'member');
}

/**
 * Generate an import statement.
 * @param {Object} symbol Symbol.
 * @param {string} member Member.
 * @return {string} An import statement.
 */
function getImport(symbol, member) {
  const tildeSeparatedParts = symbol.name.split('~');
  if (
    tildeSeparatedParts.length == 2 &&
    tildeSeparatedParts[1].match(/^\w+$/)
  ) {
    const potentialDefaultExport = tildeSeparatedParts[1];
    const moduleName = tildeSeparatedParts[0].split('/').pop();
    // This is very fragile, but JSDoc names symbols in a way that doesn't allow us to differentiate
    // default from named exports.  Our convention is to only have a default export for modules that
    // export a constructor, and to name the module like the internal name of the constructor, and to start
    // constructor names with an uppercase letter.  There are many modules that are not named exactly like the
    // internal name of the constructor (e.g. ol/layer/Tile.js and TileLayer), but both should use uppercase.
    if (moduleName.match(/^[A-Z]/) && potentialDefaultExport.match(/^[A-Z]/)) {
      const from = tildeSeparatedParts[0].replace(/^module\:/, './');
      const importName = from.replace(/[.\/]+/g, '$');
      return `import ${importName} from '${from}.js';`;
    }
  }

  if (
    tildeSeparatedParts.length > 1 &&
    tildeSeparatedParts.indexOf('.') === -1
  ) {
    return;
  }

  const dotSeparatedParts = symbol.name.split('.');
  if (dotSeparatedParts.length > 1 && member) {
    const from = dotSeparatedParts[0].replace(/^module\:/, './');
    const importName = from.replace(/[.\/]+/g, '_');
    return `import {${member} as ${importName}$${member}} from '${from}.js';`;
  }
}

/**
 * Generate code to export a named symbol.
 * @param {Object} symbol Symbol.
 * @param {Object<string, string>} namespaces Already defined namespaces.
 * @param {Object} imports Imports.
 * @param {Object} exportedNames Already exported names.
 * @return {string} Export code.
 */
function formatSymbolExport(symbol, namespaces, imports, exportedNames) {
  const name = symbol.name;
  const parts = name.split('~');
  const isNamed = parts[0].indexOf('.') !== -1;
  const nsParts = parts[0].replace(/^module\:/, '').split(/[\/\.]/);
  const last = nsParts.length - 1;
  const importName = isNamed
    ? '_' + nsParts.slice(0, last).join('_') + '$' + nsParts[last]
    : '$' + nsParts.join('$');
  let line = nsParts[0];
  for (let i = 1, ii = nsParts.length; i < ii; ++i) {
    line += `.${nsParts[i]}`;
    namespaces[line] =
      (line in namespaces ? namespaces[line] : true) && i < ii - 1;
  }
  if (line in exportedNames) {
    return '';
  } else {
    exportedNames[line] = true;
  }
  const imp = getImport(symbol, nsParts.pop());
  if (imp) {
    imports[imp] = true;
    line += ` = ${importName};`;
  } else {
    line += ` = {};`;
  }
  return line;
}

/**
 * Generate export code given a list symbol names.
 * @param {Array<Object>} symbols List of symbols.
 * @return {string} Export code.
 */
function generateExports(symbols) {
  const namespaces = {};
  const imports = [];
  const blocks = [];
  const exportedNames = {};
  symbols.forEach(function (symbol) {
    const name = symbol.name;
    if (name.indexOf('#') == -1) {
      const imp = getImport(symbol);
      if (imp) {
        imports[imp] = true;
      }
      blocks.push(
        formatSymbolExport(symbol, namespaces, imports, exportedNames)
      );
    }
  });
  const nsdefs = [];
  const ns = Object.keys(namespaces).sort();
  for (let i = 0, ii = ns.length; i < ii; ++i) {
    if (namespaces[ns[i]]) {
      nsdefs.push(`${ns[i]} = {};`);
    }
  }
  const defs = ['\nvar ol = {};'].concat(nsdefs, [...new Set(blocks)]);
  const lines = Object.keys(imports).concat(defs.sort());
  lines.push('', 'export default ol;');
  return lines.join('\n');
}

/**
 * Generate the exports code.
 * @return {Promise<string>} Resolves with the exports code.
 */
export default async function main() {
  const symbols = await getSymbols();
  return generateExports(symbols);
}

/**
 * If running this module directly, read the config file, call the main
 * function, and write the output file.
 */
if (esMain(import.meta)) {
  const baseDir = dirname(fileURLToPath(import.meta.url));

  main()
    .then(async (code) => {
      const filepath = path.join(baseDir, '..', 'build', 'index.js');
      await fse.outputFile(filepath, code);
    })
    .catch((err) => {
      process.stderr.write(`${err.message}\n`, () => process.exit(1));
    });
}
