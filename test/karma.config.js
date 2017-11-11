/* eslint-env node, es6 */

const path = require('path');
const pkg = require('../package.json');

/**
 * The config below is not enough to run Karma.  In addition, we need to add
 * all library files in dependency order.  This could be done with a plugin if
 * Karma supported async plugins (there may be other alternatives as well).  But
 * for now we start Karma with the `tasks/test.js` script.  This script
 * sorts dependencies and adds files to the Karma config below.
 */

module.exports = function(karma) {
  karma.set({
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
        pattern: '**/*.test.js'
      }, {
        pattern: '**/*',
        included: false,
        watched: false
      }
    ],
    proxies: {
      '/rendering/': '/base/rendering/',
      '/spec/': '/base/spec/'
    },
    reporters: ['progress'],
    coverageReporter: {
      reporters: [
        {
          type: 'lcov', // produces HTML output and lcov
          dir: '../coverage/',
          subdir: '.'
        },
        {
          type: 'text-summary' // prints the textual summary to the terminal
        }
      ]
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
        browserName: 'chrome'
      },
      SL_Firefox: {
        base: 'SauceLabs',
        browserName: 'firefox'
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
      reporters: ['dots', 'saucelabs', 'coverage'],
      browserDisconnectTimeout: 10000,
      browserDisconnectTolerance: 1,
      captureTimeout: 240000,
      browserNoActivityTimeout: 240000,
      customLaunchers: customLaunchers,
      browsers: Object.keys(customLaunchers),
      preprocessors: {
        // source files, that you wanna generate coverage for
        // do not include tests or libraries
        // (these files will be instrumented by Istanbul)
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
