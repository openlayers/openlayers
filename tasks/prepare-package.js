import esMain from 'es-main';
import fse from 'fs-extra';
import path, {dirname} from 'path';
import {fileURLToPath} from 'url';

const baseDir = dirname(fileURLToPath(import.meta.url));
const buildDir = path.resolve(baseDir, '../build/ol');
const fullBuildSource = path.resolve(baseDir, '../build/full/ol.cjs');
const fullBuildDest = path.join(buildDir, 'dist/index.cjs');

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

  // write out simplified package.json
  pkg.main = 'index.js';
  delete pkg.scripts;
  delete pkg.devDependencies;
  delete pkg.style;
  delete pkg.eslintConfig;
  delete pkg.private;
  await fse.writeJSON(path.join(buildDir, 'package.json'), pkg, {spaces: 2});

  // copy in readme and license files
  await fse.copyFile(
    path.resolve(baseDir, '../README.md'),
    path.join(buildDir, 'README.md')
  );

  await fse.copyFile(
    path.resolve(baseDir, '../LICENSE.md'),
    path.join(buildDir, 'LICENSE.md')
  );

  await fse.ensureDir(dirname(fullBuildDest));
  await fse.copyFile(fullBuildSource, fullBuildDest);
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
