import TerserPlugin from 'terser-webpack-plugin';
import path from 'path';

export default {
  entry: ['regenerator-runtime/runtime', './build/index.js'],
  devtool: 'source-map',
  mode: 'production',
  target: ['web', 'es5'],
  module: {
    rules: [
      {
        test: /\.m?js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: 'last 2 versions, not dead',
                },
              ],
            ],
          },
        },
      },
    ],
  },
  resolve: {
    fallback: {
      fs: false,
      http: false,
      https: false,
    },
    alias: {
      ol: path.resolve('./build/ol'),
    },
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          // Mangle private members convention with underscore suffix
          mangle: {properties: {regex: /_$/}},
        },
      }),
    ],
  },
  output: {
    path: path.resolve('./build/legacy'),
    publicPath: 'auto',
    filename: 'ol.js',
    library: 'ol',
    libraryTarget: 'umd',
    libraryExport: 'default',
  },
};
