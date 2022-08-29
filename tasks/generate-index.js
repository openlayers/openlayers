import esMain from 'es-main';
import fse from 'fs-extra';
import generateInfo from './generate-info.js';
import path, {dirname} from 'path';
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
  const defaultExport = symbol.name.split('~');
  if (symbol.isDefaultExport) {
    const from = defaultExport[0].replace(/^module\:/, './');
    const importName = from.replace(/[.\/]+/g, '$');
    return `import ${importName} from '${from}.js';`;
  }
  const namedExport = symbol.name.split('.');
  if (
    member &&
    namedExport.length > 1 &&
    (defaultExport.length <= 1 || defaultExport[0].includes('.'))
  ) {
    const from = namedExport[0].replace(/^module\:/, './');
    const importName = from.replace(/[.\/]+/g, '_');
    return `import {${member} as ${importName}$${member}} from '${from}.js';`;
  }
}

/**
 * Generate code to export a named symbol.
 * @param {Object} symbol Symbol.
 * @param {Object<string, string>} namespaces Already defined namespaces.
 * @param {Object} imports Imports.
 * @return {string} Export code.
 */
function formatSymbolExport(symbol, namespaces, imports) {
  const name = symbol.name;
  const parts = name.split('~');
  const nsParts = parts[0].replace(/^module\:/, '').split(/[\/\.]/);
  const last = nsParts.length - 1;
  const imp = getImport(symbol, nsParts[last]);
  if (imp) {
    const isNamed = parts[0].includes('.');
    const importName = isNamed
      ? '_' + nsParts.slice(0, last).join('_') + '$' + nsParts[last]
      : '$' + nsParts.join('$');
    let line = nsParts[0];
    for (let i = 1, ii = nsParts.length; i < ii; ++i) {
      line += `.${nsParts[i]}`;
      namespaces[line] =
        (line in namespaces ? namespaces[line] : true) && i < ii - 1;
    }
    line += ` = ${importName};`;
    imports[imp] = true;
    return line;
  }
}

/**
 * Generate export code given a list symbol names.
 * @param {Array<Object>} symbols List of symbols.
 * @return {string} Export code.
 */
function generateExports(symbols) {
  const namespaces = {};
  const imports = {};
  const blocks = [];
  symbols.forEach(function (symbol) {
    const name = symbol.name;
    if (!name.includes('#')) {
      const imp = getImport(symbol);
      if (imp) {
        imports[imp] = true;
      }
      const line = formatSymbolExport(symbol, namespaces, imports);
      if (line) {
        blocks.push(line);
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
