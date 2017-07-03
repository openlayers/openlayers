var path = require('path');

/**
 * The config below is not enough to run Karma.  In addition, we need to add
 * all library files in dependency order.  This could be done with a plugin if
 * Karma supported async plugins (there may other alternatives as well).  But
 * for now we start Karma with the `tasks/test.js` script.  This script
 * sorts dependencies and add files to the Karma config below.
 */

module.exports = function(karma) {
  karma.set({
    frameworks: ['mocha'],
    client: {
      runInParent: true
    },
    files: [
      {
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
        pattern: path.resolve(__dirname, require.resolve('resemblejs/resemble.js')),
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
    }
  });

  if (process.env.TRAVIS) {
    karma.set({
      reporters: ['dots'],
      browsers: ['Firefox']
    });
  } else {
    karma.set({
      browsers: ['Chrome']
    });
  }
};
