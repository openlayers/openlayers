const CopyPlugin = require('copy-webpack-plugin');
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
  module: {
    rules: [{
      use: {
        loader: 'buble-loader'
      },
      test: /\.js$/,
      include: [
        path.join(__dirname, '..', 'src')
      ]
    }]
  },
  plugins: [
    new CopyPlugin([
      {from: '../src/ol/ol.css', to: 'css'},
      {from: 'cases/**/*.html'}
    ])
  ],
  devtool: 'source-map'
};
