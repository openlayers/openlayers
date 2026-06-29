const path = require('path');

const flags = ['--headless=new'];
if (process.env.CI) {
  flags.push('--no-sandbox');
}

module.exports = async function (karma) {
  karma.set({
    hostname: '127.0.0.1',
    browsers: ['ChromeHeadless'],
    customLaunchers: {
      ChromeHeadless: {
        base: 'Chrome',
        flags,
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
    // Specs ported to Vitest run there instead; see test/browser/vitest.config.mjs.
    exclude: [
      'spec/ol/resolutionconstraint.test.js',
      'spec/ol/tileurlfunction.test.js',
      'spec/ol/worker/webgl.test.js',
      'spec/ol/featureloader.test.js',
      'spec/ol/format/wmtscapabilities.test.js',
      'spec/ol/layer/Heatmap.test.js',
    ],
    proxies: {
      '/spec/': '/base/spec/',
      '/wms': '/base/spec/ol/data/blank.png',
      '/ogcapi/map': '/base/spec/ol/data/blank.png',
      '/ImageServer/exportImage': '/base/spec/ol/data/blank.png',
      '/MapServer/export': '/base/spec/ol/data/blank.png',
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
                '../../examples/webpack/worker-loader.cjs',
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

  process.env.CHROME_BIN = await require('puppeteer').executablePath();
};
