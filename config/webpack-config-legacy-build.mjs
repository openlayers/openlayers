import TerserPlugin from 'terser-webpack-plugin';
import path from 'path';

export default {
  entry: './build/index.js',
  devtool: 'source-map',
  mode: 'production',
  target: ['browserslist'],
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
