import Metalsmith from 'metalsmith';
import common from '@rollup/plugin-commonjs';
import inPlace from '@metalsmith/in-place';
import layouts from '@metalsmith/layouts';
import markdown from '@metalsmith/markdown';
import {dirname, resolve} from 'node:path';
import {env} from 'node:process';
import {fileURLToPath} from 'node:url';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import {rollup} from 'rollup';
import {terser} from 'rollup-plugin-terser';

const baseDir = dirname(fileURLToPath(import.meta.url));

const builder = Metalsmith(baseDir)
  .source('./src')
  .destination('./build')
  .clean(true)
  .metadata({
    version: env.OL_VERSION || 'dev',
  })
  .use(inPlace())
  .use(markdown())
  .use(layouts());

builder.build(async (err) => {
  if (err) {
    throw err;
  }
  await bundleMain();
});

async function bundleMain() {
  const inputOptions = {
    plugins: [
      common(),
      nodeResolve({
        modulePaths: [
          resolve(baseDir, '../src'),
          resolve(baseDir, '../node_modules'),
        ],
      }),
      terser(),
    ],
    input: resolve(baseDir, './build/main.js'),
  };

  const outputOptions = {
    dir: resolve(baseDir, './build'),
    format: 'iife',
  };

  const bundle = await rollup(inputOptions);
  await bundle.write(outputOptions);
  bundle.close();
}
