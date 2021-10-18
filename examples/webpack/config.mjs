import CopyPlugin from 'copy-webpack-plugin';
import ExampleBuilder from './example-builder.js';
import TerserPlugin from 'terser-webpack-plugin';
import fs from 'fs';
import path, {dirname} from 'path';
import {fileURLToPath} from 'url';

const baseDir = dirname(fileURLToPath(import.meta.url));

const src = path.join(baseDir, '..');

export default {
  context: src,
  target: ['web', 'es5'],
  entry: () => {
    const entry = {};
    fs.readdirSync(src)
      .filter((name) => /^(?!index).*\.html$/.test(name))
      .map((name) => name.replace(/\.html$/, ''))
      .forEach((example) => {
        entry[example] = ['regenerator-runtime/runtime', `./${example}.js`];
      });
    return entry;
  },
  stats: 'minimal',
  module: {
    rules: [
      {
        test: /^((?!es2015-)[\s\S])*\.m?js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {targets: 'last 2 versions, not dead'}],
            ],
          },
        },
      },
      {
        test: /\.js$/,
        use: {
          loader: path.join(baseDir, 'worker-loader.cjs'),
        },
        include: [path.join(baseDir, '..', '..', 'src', 'ol', 'worker')],
      },
    ],
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        // Do not minify examples that inject code into workers
        exclude: [/(color-manipulation|region-growing|raster)\.js/],
        extractComments: false,
      }),
    ],
    runtimeChunk: {
      name: 'common',
    },
    splitChunks: {
      name: 'common',
      chunks: 'initial',
      minChunks: 2,
    },
  },
  plugins: [
    new ExampleBuilder({
      templates: path.join(baseDir, '..', 'templates'),
      common: 'common',
    }),
    new CopyPlugin({
      patterns: [
        {from: '../src/ol/ol.css', to: 'css'},
        {from: 'data', to: 'data'},
        {from: 'resources', to: 'resources'},
        {from: 'index.html', to: 'index.html'},
        {from: 'index.js', to: 'index.js'},
      ],
    }),
  ],
  devtool: 'source-map',
  output: {
    filename: '[name].js',
    path: path.join(baseDir, '..', '..', 'build', 'examples'),
  },
  resolve: {
    fallback: {
      fs: false,
      http: false,
      https: false,
    },
    alias: {
      // allow imports from 'ol/module' instead of specifiying the source path
      ol: path.join(baseDir, '..', '..', 'src', 'ol'),
    },
  },
};
