const path = require('path');

module.exports = function(karma) {
  karma.set({
    browsers: ['Chrome'],
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
    reporters: ['dots', 'coverage-istanbul'],
    coverageIstanbulReporter: {
      reports: ['text-summary', 'html'],
      dir: path.resolve(__dirname, '../coverage/'),
      fixWebpackSourcePaths: true
    },
    webpack: {
      devtool: 'inline-source-map',
      mode: 'development',
      module: {
        rules: [
          {
            test: /\.js$/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/preset-env']
              }
            },
            include: path.resolve('src/ol/'),
            exclude: path.resolve('node_modules/')
          }, {
            test: /\.js$/,
            use: {
              loader: 'istanbul-instrumenter-loader',
              options: {
                esModules: true
              }
            },
            include: path.resolve('src/ol/'),
            exclude: path.resolve('node_modules/')
          }, {
            test: /\.js$/,
            use: {
              loader: path.join(__dirname, '../examples/webpack/worker-loader.js')
            },
            include: [
              path.join(__dirname, '../src/ol/worker')
            ]
          }
        ]
      }
    },
    webpackMiddleware: {
      noInfo: true
    }
  });

  process.env.CHROME_BIN = require('puppeteer').executablePath();
};
