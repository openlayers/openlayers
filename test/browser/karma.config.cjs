/* eslint-disable import/no-commonjs */

const path = require('path');

module.exports = function (karma) {
  karma.set({
    browsers: ['ChromeHeadlessLauncher'],
    customLaunchers: {
      ChromeHeadlessLauncher: {
        base: 'Chrome',
        flags: ['--headless=new'],
      },
    },
    browserDisconnectTolerance: 2,
    frameworks: ['webpack', 'mocha', 'source-map-support'],
    client: {
      runInParent: true,
      mocha: {
        timeout: 2500,
      },
    },
    files: [
      {
        pattern: path.resolve(
          __dirname,
          require.resolve('jquery/dist/jquery.js')
        ),
        watched: false,
      },
      {
        pattern: path.resolve(__dirname, require.resolve('expect.js/index.js')),
        watched: false,
      },
      {
        pattern: path.resolve(
          __dirname,
          require.resolve('../../node_modules/sinon/pkg/sinon.js')
        ),
        watched: false,
      },
      {
        pattern: path.resolve(
          __dirname,
          require.resolve('proj4/dist/proj4.js')
        ),
        watched: false,
      },
      {
        pattern: path.resolve(__dirname, './test-extensions.js'),
      },
      {
        pattern: 'spec/**/*.test.js',
        watched: false,
      },
      {
        pattern: '**/*',
        included: false,
        watched: false,
      },
    ],
    proxies: {
      '/spec/': '/base/spec/',
    },
    preprocessors: {
      '**/*.js': ['webpack'], //, 'sourcemap'],
    },
    reporters: ['dots'],
    webpack: {
      devtool: 'inline-source-map',
      mode: 'development',
      resolve: {
        alias: {
          ol: path.resolve(__dirname, '../../src/ol/'),
        },
        fallback: {
          fs: false,
          http: false,
          https: false,
        },
      },
      module: {
        rules: [
          {
            test: /\.js$/,
            enforce: 'pre',
            use: ['source-map-loader'],
          },
          {
            test: /\.js$/,
            use: {
              loader: path.join(
                __dirname,
                '../../examples/webpack/worker-loader.cjs'
              ),
            },
            include: [path.join(__dirname, '../../src/ol/worker')],
          },
        ],
      },
    },
    webpackMiddleware: {
      noInfo: true,
    },
  });

  process.env.CHROME_BIN = require('puppeteer').executablePath();
};
