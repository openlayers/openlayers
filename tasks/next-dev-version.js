import {dirname, join} from 'path';
import process from 'process';
import {fileURLToPath} from 'url';
import esMain from 'es-main';
import fse from 'fs-extra';
import semver from 'semver';

const baseDir = dirname(fileURLToPath(import.meta.url));

async function nextVersion() {
  const pkg = await fse.readJSON(join(baseDir, '../package.json'));
  const version = pkg.version;
  const s = semver.parse(version);
  if (!s) {
    throw new Error(`Invalid version ${version}`);
  }
  return `${s.major}.${s.minor}.${s.patch}-dev.${Date.now()}`;
}

if (esMain(import.meta)) {
  nextVersion()
    .then((version) => {
      process.stdout.write(`${version}\n`);
    })
    .catch((error) => {
      process.stderr.write(`${error}\n`);
      process.exit(1);
    });
}
