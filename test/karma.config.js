/* eslint-env node, es6 */

const path = require('path');
const pkg = require('../package.json');

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
    reporters: ['progress'],
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

  if (process.env.TRAVIS) {
    const testName = process.env.TRAVIS_PULL_REQUEST ?
      `https://github.com/openlayers/openlayers/pull/${process.env.TRAVIS_PULL_REQUEST}` :
      `${pkg.name}@${pkg.version} (${process.env.TRAVIS_COMMIT})`;

    // see https://wiki.saucelabs.com/display/DOCS/Platform+Configurator
    // for platform and browserName options (Selenium API, node.js code)
    const customLaunchers = {
      SL_Chrome: {
        base: 'SauceLabs',
        browserName: 'chrome',
        version: '62.0'
      },
      SL_Firefox: {
        base: 'SauceLabs',
        browserName: 'firefox',
        version: '58'
      },
      SL_Edge: {
        base: 'SauceLabs',
        platform: 'Windows 10',
        browserName: 'MicrosoftEdge'
      },
      SL_Safari: {
        base: 'SauceLabs',
        platform: 'macOS 10.12',
        browserName: 'safari'
      }
    };
    karma.set({
      sauceLabs: {
        testName: testName,
        recordScreenshots: false,
        startConnect: true,
        tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER,
        username: 'openlayers',
        accessKey: process.env.SAUCE_ACCESS_KEY,
        connectOptions: {
          noSslBumpDomains: 'all',
          connectRetries: 5
        }
      },
      hostname: 'travis.dev',
      reporters: ['dots', 'saucelabs'],
      browserDisconnectTimeout: 10000,
      browserDisconnectTolerance: 1,
      captureTimeout: 240000,
      browserNoActivityTimeout: 240000,
      customLaunchers: customLaunchers,
      browsers: Object.keys(customLaunchers),
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
