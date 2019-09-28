const path = require('path');
const babel = require('rollup-plugin-babel');
const resolve = require('rollup-plugin-node-resolve');
const common = require('rollup-plugin-commonjs');
const rollup = require('rollup');
const terser = require('rollup-plugin-terser').terser;
const fse = require('fs-extra');

async function build(input, {minify = true} = {}) {
  const plugins = [
    {
      name: 'remove export let create',
      transform(code, id) {
        if (id !== input) {
          return null;
        }
        return code.replace('export let create;', '');
      }
    },
    common(),
    resolve(),
    babel({
      'externalHelpers': true,
      'presets': [
        [
          '@babel/preset-env',
          {
            'modules': false,
            'targets': 'last 2 version, not dead'
          }
        ]
      ]
    })
  ];

  if (minify) {
    plugins.push(terser());
  }

  plugins.push({
    name: 'serialize worker and export create function',
    renderChunk(code) {
      return `
        const source = ${JSON.stringify(code)};
        const blob = new Blob([source], {type: 'application/javascript'});
        const url = URL.createObjectURL(blob);
        export function create() {
          return new Worker(url);
        }
      `;
    }
  });

  const bundle = await rollup.rollup({input, plugins});
  const {output} = await bundle.generate({format: 'es'});

  if (output.length !== 1) {
    throw new Error(`Unexpected output length: ${output.length}`);
  }

  const chunk = output[0];
  if (chunk.isAsset) {
    throw new Error('Expected a chunk, got an asset');
  }

  return chunk;
}

exports.build = build;


/**
 * Creates modules with inlined versions of the worker sources.  These modules
 * export a `create` function for creating a worker.
 */
async function main() {
  const inputDir = path.join(__dirname, '../src/ol/worker');
  const outputDir = path.join(__dirname, '../build/ol/src/worker');

  await fse.ensureDir(outputDir);

  const entries = await fse.readdir(inputDir);
  for (const entry of entries) {
    if (!entry.endsWith('.js')) {
      continue;
    }

    const chunk = await build(path.join(inputDir, entry));
    await fse.writeFile(path.join(outputDir, entry), chunk.code);
  }
}

if (require.main === module) {
  main().catch(err => {
    process.stderr.write(`${err.stack}\n`);
    process.exit(1);
  });
}
