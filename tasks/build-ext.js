const cleanup = require('rollup-plugin-cleanup');
const common = require('rollup-plugin-commonjs');
const node = require('rollup-plugin-node-resolve');
const path = require('path');
const pkg = require('../package.json');
const rollup = require('rollup').rollup;

/**
 * Wrap a bundled dependency for consumption by the Compiler.
 * @param {Object} ext Details from the `ext` object in package.json.
 * @return {Object} A rollup plugin.
 */
function wrap(ext) {
  return {
    name: 'googup',
    transformBundle: function(source) {
      let name = `ol.ext.${ext.name || ext.module}`;
      let postamble = '';
      if (ext.import) {
        name += '.' + ext.import;
      } else {
        postamble = `${name} = ${name}.default;\n`;
      }
      return `
/**
 * @fileoverview
 * @suppress {accessControls, ambiguousFunctionDecl, checkDebuggerStatement, checkRegExp, checkTypes, checkVars, const, constantProperty, deprecated, duplicate, es5Strict, fileoverviewTags, missingProperties, nonStandardJsDocs, strictModuleDepCheck, suspiciousCode, undefinedNames, undefinedVars, unknownDefines, unusedLocalVariables, uselessCode, visibility}
 */
goog.provide('${name}');

/** @typedef {function(*)} */
${name} = function() {};

(function() {${source}}).call(ol.ext);
${postamble}`;
    }
  };
}

/**
 * Build all external modules.
 * @return {Promise} Resolves on successful completion.
 */
function main() {
  return Promise.all(pkg.ext.map(ext => {
    const moduleName = ext.name || ext.module;
    const options = {
      entry: require.resolve(ext.module),
      dest: `${path.join(__dirname, '..', 'build', 'ol.ext', moduleName.toLowerCase())}.js`,
      format: 'iife',
      moduleName: moduleName,
      exports: 'named',
      plugins: [
        node(),
        common(),
        cleanup(),
        wrap(ext)
      ]
    };
    return rollup(options).then(bundle => bundle.write(options));
  }));
}

if (require.main === module) {
  main().catch(err => {
    process.stderr.write(`${err.message}\n`, () => process.exit(1));
  });
}

module.exports = main;
