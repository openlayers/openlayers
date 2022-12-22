import * as fs from 'node:fs/promises';
import esMain from 'es-main';
import path, {dirname} from 'path';
import {strict as assert} from 'node:assert';
import {fileURLToPath} from 'url';

const baseDir = dirname(fileURLToPath(import.meta.url));
const buildDir = path.resolve(baseDir, '../build');

const filesToCheck = [
  {
    name: path.resolve(buildDir, './full/ol.js'),
    minSize: 500_000,
  },
  {
    name: path.resolve(buildDir, './full/ol.js.map'),
    minSize: 1_000_000,
  },
  {
    name: path.resolve(buildDir, './ol/ol.css'),
    minSize: 6_000,
  },
];

async function main() {
  filesToCheck.forEach(async (spec) => {
    await fs.stat(spec.name).then((stat) => {
      assert(stat.isFile(), `${spec.name} does not look like a file`);
      assert(
        stat.size >= spec.minSize,
        `${spec.name} has a filesize lower than ${spec.minSize}`
      );
    });
  });
}

/**
 * If running this module directly, read the config file, call the main
 * function, and write the output file.
 */
if (esMain(import.meta)) {
  try {
    await main();
  } catch (err) {
    process.stderr.write(`${err.message}\n`, () => process.exit(1));
  }
}
