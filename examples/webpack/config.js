const MinifyPlugin = require('babel-minify-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const ExampleBuilder = require('./example-builder');
const fs = require('fs');
const merge = require('webpack-merge');
const path = require('path');
const webpack = require('webpack');

const src = path.join(__dirname, '..');

const examples = fs.readdirSync(src)
  .filter(name => /^(?!index).*\.html$/.test(name))
  .map(name => name.replace(/\.html$/, ''));

const entry = {};
examples.forEach(example => {
  entry[example] = `./${example}.js`;
});

const main = {
  context: src,
  target: 'web',
  entry: entry,
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: 'common',
      minChunks: 2
    }),
    new ExampleBuilder({
      templates: path.join(__dirname, '..', 'templates'),
      common: 'common'
    }),
    new CopyPlugin([
      {from: '../css', to: 'css'},
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
  }
};

// configuration specific to the dev environment
const dev = {
  plugins: [
    new webpack.EnvironmentPlugin(
      Object.assign({NODE_ENV: 'development'}, process.env)
    )
  ]
};

// configuration specific to the prod environment
const prod = {
  plugins: [
    new webpack.EnvironmentPlugin(
      Object.assign({NODE_ENV: 'production'}, process.env)
    ),
    new MinifyPlugin()
  ]
};


module.exports = env => {
  let config;

  switch (env) {
    case 'prod': {
      config = merge(main, prod);
      break;
    }
    default: {
      config = merge(main, dev);
    }
  }

  return config;
};
