import esMain from 'es-main';
import process from 'process';
import semver from 'semver';
import {promises as fs} from 'fs';

async function nextVersion() {
  const pkg = await fs.readFile('../package.json', {encoding: 'utf8'});
  const version = JSON.parse(pkg).version;
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
