const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const ExampleBuilder = require('./example-builder');
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..');

const examples = fs.readdirSync(src)
  .filter(name => /^(?!index).*\.html$/.test(name))
  .map(name => name.replace(/\.html$/, ''));

const entry = {};
examples.forEach(example => {
  entry[example] = `./${example}.js`;
});

module.exports = {
  context: src,
  target: 'web',
  entry: entry,
  module: {
    rules: [{
      use: {
        loader: 'buble-loader'
      },
      test: /\.js$/,
      include: [
        path.join(__dirname, '..', '..', 'src'),
        path.join(__dirname, '..')
      ]
    }]
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        sourceMap: true,
        // Do not minify examples that inject code into workers
        exclude: [/(color-manipulation|region-growing|raster)\.js/]
      })
    ],
    runtimeChunk: {
      name: 'common'
    },
    splitChunks: {
      name: 'common',
      chunks: 'initial',
      minChunks: 2
    }
  },
  plugins: [
    new ExampleBuilder({
      templates: path.join(__dirname, '..', 'templates'),
      common: 'common'
    }),
    new CopyPlugin([
      {from: '../src/ol/ol.css', to: 'css'},
      {from: 'data', to: 'data'},
      {from: 'resources', to: 'resources'},
      {from: 'Jugl.js', to: 'Jugl.js'},
      {from: 'index.html', to: 'index.html'}
    ])
  ],
  devtool: 'source-map',
  output: {
    filename: '[name].js',
    path: path.join(__dirname, '..', '..', 'build', 'examples')
  },
  node: {
    fs: 'empty' // required by ol-mapbox-stlye
  },
  resolve: {
    alias: {
      // allow imports from 'ol/module' instead of specifiying the source path
      ol: path.join(__dirname, '..', '..', 'src', 'ol')
    }
  }
};
