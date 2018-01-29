const webpack = require('webpack');
const MinifyPlugin = require('babel-minify-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'build/ol.js'
  },
  devtool: 'source-map',
  plugins: [
    new webpack.optimize.ModuleConcatenationPlugin(),
    new MinifyPlugin()
  ]
};
