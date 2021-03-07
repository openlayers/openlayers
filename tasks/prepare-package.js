const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');

const buildDir = path.resolve(__dirname, '../build/ol');

// update the version number in util.js
const utilPath = path.join(buildDir, 'util.js');
const versionRegEx = /var VERSION = '(.*)';/g;
const utilSrc = fs
  .readFileSync(utilPath, 'utf-8')
  .replace(versionRegEx, `var VERSION = '${pkg.version}';`);
fs.writeFileSync(utilPath, utilSrc, 'utf-8');

// write out simplified package.json
delete pkg.scripts;
delete pkg.devDependencies;
delete pkg.style;
delete pkg.eslintConfig;
delete pkg.private;
fs.writeFileSync(
  path.join(buildDir, 'package.json'),
  JSON.stringify(pkg, null, 2),
  'utf-8'
);

// copy in readme and license files
fs.copyFileSync(
  path.resolve(__dirname, '../README.md'),
  path.join(buildDir, 'README.md')
);
fs.copyFileSync(
  path.resolve(__dirname, '../LICENSE.md'),
  path.join(buildDir, 'LICENSE.md')
);
