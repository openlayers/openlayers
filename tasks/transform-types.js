/**
 * @filedesc
 * Transforms type comments in all source files to types that Closure Compiler
 * understands.
 */

const glob = require('glob');
const mkdirp = require('mkdirp').sync;
const fs = require('fs');
const path = require('path');
const transform = require('babel-core').transformFileSync;

const options = {
  plugins: 'jsdoc-closure',
  parserOpts: {
    parser: 'recast'
  },
  generatorOpts: {
    generator: 'recast'
  }
};

const outDir = path.join('build', 'src-closure');

glob('src/**/*.js', (err, matches) => {
  matches.forEach(match => {
    const out = path.join(outDir, path.relative('src', match));
    mkdirp(path.dirname(out));
    fs.writeFileSync(out, transform(match, options).code, 'utf-8');
  });
});
