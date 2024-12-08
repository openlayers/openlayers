import path, {dirname} from 'path';
import {fileURLToPath} from 'url';
import esMain from 'es-main';
import fse from 'fs-extra';

const baseDir = dirname(fileURLToPath(import.meta.url));
const buildDir = path.resolve(baseDir, '../build/ol');

async function main() {
  const pkg = await fse.readJSON(path.resolve(baseDir, '../package.json'));

  // update the version number in util.js
  const utilPath = path.join(buildDir, 'util.js');
  let utilSrc = await fse.readFile(utilPath, 'utf-8');
  let replaced = 0;
  utilSrc = utilSrc.replace(/(?<=const VERSION = ')(?:[^']*)(?=';)/g, () => {
    replaced++;
    return pkg.version;
  });
  if (replaced !== 1) {
    throw new Error('Failed to replace version');
  }
  await fse.writeFile(utilPath, utilSrc, 'utf-8');
}

/**
 * If running this module directly, read the config file, call the main
 * function, and write the output file.
 */
if (esMain(import.meta)) {
  main().catch((err) => {
    process.stderr.write(`${err.message}\n`, () => process.exit(1));
  });
}
