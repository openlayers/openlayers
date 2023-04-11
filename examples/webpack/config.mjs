import CopyPlugin from 'copy-webpack-plugin';
import ExampleBuilder from './example-builder.js';
import TerserPlugin from 'terser-webpack-plugin';
import fs from 'fs';
import path, {dirname} from 'path';
import {fileURLToPath} from 'url';

const src = path.join(dirname(fileURLToPath(import.meta.url)), '..');
const root = path.join(src, '..');

export default {
  context: src,
  target: ['browserslist'],
  entry: () => {
    const entry = {};
    fs.readdirSync(src)
      .filter((name) => /^(?!index).*\.html$/.test(name))
      .map((name) => name.replace(/\.html$/, ''))
      .forEach((example) => {
        entry[example] = `./${example}.js`;
      });
    return entry;
  },
  stats: 'minimal',
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: path.join(src, 'webpack', 'worker-loader.cjs'),
        },
        include: [path.join(root, 'src', 'ol', 'worker')],
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
      templates: path.join(src, 'templates'),
      common: 'common',
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.join(root, 'site', 'src', 'theme'),
          to: 'theme',
        },
        {
          from: path.join(root, 'src', 'ol', 'ol.css'),
          to: path.join('theme', 'ol.css'),
        },
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
    path: path.join(root, 'build', 'examples'),
  },
  resolve: {
    fallback: {
      fs: false,
      http: false,
      https: false,
    },
    alias: {
      // allow imports from 'ol/module' instead of specifiying the source path
      ol: path.join(root, 'src', 'ol'),
    },
  },
};
