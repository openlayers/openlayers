const fs = require('fs');
const path = require('path');

const cases = path.join(__dirname, 'cases');

const caseDirs = fs.readdirSync(cases).filter(name => {
  let exists = true;
  try {
    fs.accessSync(path.join(cases, name, 'main.js'));
  } catch (err) {
    exists = false;
  }
  return exists;
});

const entry = {};
caseDirs.forEach(c => {
  entry[`cases/${c}/main`] = `./cases/${c}/main.js`;
});

module.exports = {
  context: __dirname,
  target: 'web',
  entry: entry,
  devtool: 'source-map',
  module: {
    rules: [{
      test: /\.js$/,
      use: {
        loader: path.join(__dirname, '../examples/webpack/worker-loader.js')
      },
      include: [
        path.join(__dirname, '../src/ol/worker')
      ]
    }]
  }
};
