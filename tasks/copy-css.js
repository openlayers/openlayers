const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');

const buildDir = path.resolve(__dirname, '../build/ol');

fse.mkdirsSync(buildDir);
fs.copyFileSync('src/ol/ol.css', path.join(buildDir, 'ol.css'));
