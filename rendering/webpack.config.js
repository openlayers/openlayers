const fs = require('fs');
const path = require('path');

const cases = path.join(__dirname, 'cases');
const benchmarks = path.join(__dirname, 'benchmarks');

const caseDirs = fs.readdirSync(cases);
const benchmarkDirs = fs.readdirSync(benchmarks);

const entry = {};
caseDirs.forEach(c => {
  entry[`cases/${c}/main`] = `./cases/${c}/main.js`;
});
benchmarkDirs.forEach(c => {
  entry[`benchmarks/${c}/main`] = `./benchmarks/${c}/main.js`;
});

module.exports = {
  context: __dirname,
  target: 'web',
  entry: entry,
  devtool: 'source-map'
};
