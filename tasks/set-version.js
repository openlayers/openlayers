const fs = require('fs');
const pkg = require('../package.json');

const index = require.resolve('../src/ol/util');
const lines = fs.readFileSync(index, 'utf-8').split('\n');

const versionRegEx = /export const VERSION =/;

for (let i = 0, ii = lines.length; i < ii; ++i) {
  const line = lines[i];
  if (versionRegEx.test(line)) {
    lines[i] = `export const VERSION = '${pkg.version}';`;
    break;
  }
}

const packageJson = require.resolve('../src/ol/package.json');
const packageJsonObj = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));
packageJsonObj.version = pkg.version;
fs.writeFileSync(packageJson, JSON.stringify(packageJsonObj, null, 2), 'utf-8');


fs.writeFileSync(index, lines.join('\n'), 'utf-8');
