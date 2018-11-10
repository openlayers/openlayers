const fs = require('fs');
const path = require('path');

const cases = path.join(__dirname, 'cases');

const caseDirs = fs.readdirSync(cases);

const entry = {};
caseDirs.forEach(c => {
  entry[`cases/${c}/main`] = `./cases/${c}/main.js`;
});

module.exports = {
  context: __dirname,
  target: 'web',
  entry: entry,
  devtool: 'source-map'
};
