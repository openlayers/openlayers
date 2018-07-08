const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');

const util = require.resolve('../src/ol/util');
const lines = fs.readFileSync(util, 'utf-8').split('\n');
const versionRegEx = /const VERSION = '(.*)';$/;
for (let i = 0, ii = lines.length; i < ii; ++i) {
  const line = lines[i];
  if (versionRegEx.test(line)) {
    lines[i] = line.replace(versionRegEx, `const VERSION = '${pkg.version}';`);
    break;
  }
}
fs.writeFileSync(util, lines.join('\n'), 'utf-8');

const src = path.join('src', 'ol');
const packageJson = path.resolve(__dirname, path.join('..', src, 'package.json'));
delete pkg.scripts;
delete pkg.devDependencies;
delete pkg.style;
delete pkg.eslintConfig;
const main = path.posix.relative(src, require.resolve(path.join('..', pkg.main)));
pkg.main = pkg.module = main;
pkg.name = 'ol';

fs.writeFileSync(packageJson, JSON.stringify(pkg, null, 2), 'utf-8');
