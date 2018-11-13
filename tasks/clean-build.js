const fse = require('fs-extra');
const path = require('path');

const buildDir = path.resolve(__dirname, '../build');
fse.removeSync(buildDir);
