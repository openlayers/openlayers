const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');

const buildDir = path.resolve(__dirname, '../build/ol');

fse.mkdirsSync(buildDir);
fs.copyFileSync('README.md', path.join(buildDir, 'README.md'));
