const fs = require('fs');
const path = require('path');

const workerDir = path.resolve(__dirname, '../src/ol/worker');
const buildDir = path.resolve(__dirname, '../build/worker');
const workerPath = path.join(buildDir, 'hash.rollup.worker.js');

const file = fs.readFileSync(workerPath, 'utf-8');
const sFile = JSON.stringify(file);

fs.writeFileSync(path.join(workerDir, 'export.js'), `export default ${sFile}`);
