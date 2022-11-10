import esMain from 'es-main';
import fse from 'fs-extra';
import path, {dirname} from 'path';
import {fileURLToPath} from 'url';

const baseDir = dirname(fileURLToPath(import.meta.url));
const buildDir = path.resolve(baseDir, '../build/ol');

async function main() {
  const pkg = await fse.readJSON(path.resolve(baseDir, '../package.json'));

  // update the version number in util.js
  const utilPath = path.join(buildDir, 'util.js');
  let utilSrc = await fse.readFile(utilPath, 'utf-8');
  utilSrc = utilSrc.replace(
    /const VERSION = '(?:[^']*)';/g,
    `const VERSION = '${pkg.version}';`
  );
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
