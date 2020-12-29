const path = require('path');
module.exports = {
  entry: './build/index.js',
  devtool: 'source-map',
  mode: 'production',
  module: {
    rules: [
      {
        test: /^((?!es2015-)[\s\S])*\.js$/,
        use: {
          loader: 'buble-loader',
          options: {
            transforms: {dangerousForOf: true},
          },
        },
        include: [
          path.join(
            __dirname,
            '..',
            'node_modules',
            '@mapbox',
            'mapbox-gl-style-spec'
          ),
        ],
      },
    ],
  },
  resolve: {
    alias: {
      ol: path.resolve('./build/ol'),
    },
  },
  output: {
    path: path.resolve('./build/legacy'),
    filename: 'ol.js',
    library: 'ol',
    libraryTarget: 'umd',
    libraryExport: 'default',
  },
};
