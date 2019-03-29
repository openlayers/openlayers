const path = require('path');

module.exports = function(karma) {
  karma.set({
    browserDisconnectTolerance: 2,
    frameworks: ['mocha'],
    client: {
      runInParent: true,
      mocha: {
        timeout: 2500
      }
    },
    files: [
      {
        pattern: path.resolve(__dirname, require.resolve('url-polyfill/url-polyfill.js')),
        watched: false
      },
      {
        pattern: 'module-global.js',
        watched: false
      }, {
        pattern: path.resolve(__dirname, require.resolve('jquery/dist/jquery.js')),
        watched: false
      }, {
        pattern: path.resolve(__dirname, require.resolve('expect.js/index.js')),
        watched: false
      }, {
        pattern: path.resolve(__dirname, require.resolve('sinon/pkg/sinon.js')),
        watched: false
      }, {
        pattern: path.resolve(__dirname, require.resolve('proj4/dist/proj4.js')),
        watched: false
      }, {
        pattern: path.resolve(__dirname, require.resolve('pixelmatch/index.js')),
        watched: false
      }, {
        pattern: path.resolve(__dirname, './test-extensions.js')
      }, {
        pattern: path.resolve(__dirname, './index_test.js'),
        watched: false
      }, {
        pattern: '**/*',
        included: false,
        watched: false
      }
    ],
    exclude: [
      '**/*.test.js'
    ],
    proxies: {
      '/rendering/': '/base/rendering/',
      '/spec/': '/base/spec/'
    },
    preprocessors: {
      '**/*.js': ['webpack', 'sourcemap']
    },
    reporters: ['dots'],
    webpack: {
      devtool: 'inline-source-map',
      mode: 'development',
      module: {
        rules: [
          {
            test: /\.js$/,
            use: {
              loader: 'buble-loader'
            }
          }
        ]
      }
    },
    webpackMiddleware: {
      noInfo: true
    }
  });

  process.env.CHROME_BIN = require('puppeteer').executablePath();
  if (process.env.CIRCLECI) {
    karma.set({
      browsers: ['Chrome'],
      preprocessors: {
        '../src/**/*.js': ['coverage']
      },
      coverageReporter: {
        reporters: [
          {
            type: 'lcovonly', // that's enough for coveralls, no HTML
            dir: '../coverage/',
            subdir: '.'
          },
          {
            type: 'text-summary' // prints the textual summary to the terminal
          }
        ]
      }
    });
  } else {
    karma.set({
      browsers: ['Chrome']
    });
  }
};
