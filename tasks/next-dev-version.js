const version = require('../package.json').version;
const semver = require('semver');

function nextVersion() {
  const s = semver.parse(version);
  if (!s) {
    throw new Error(`Invalid version ${version}`);
  }
  return `${s.major}.${s.minor}.${s.patch}-dev.${Date.now()}`;
}

if (require.main === module) {
  process.stdout.write(`${nextVersion()}\n`);
}
