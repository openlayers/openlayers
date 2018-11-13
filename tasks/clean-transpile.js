const fse = require('fs-extra');
const path = require('path');

const buildDir = path.resolve(__dirname, '../build');
fse.removeSync(path.join(buildDir, 'ol'));
fse.mkdir(buildDir);
