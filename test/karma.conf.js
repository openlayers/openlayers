

/**
 * Export function for configuring Karma.
 * @param {Object} config Karma config object.
 */
module.exports = function(config) {
  config.set({
    basePath: '../',
    urlRoot: '/base/test',
    frameworks: ['mocha'],
    files: [
      'test/expect-0.2.0-ol3/expect.js',
      'test/sinon-1.6.0/sinon.js',
      'test/test-extensions.js',
      'build/proj4js/lib/proj4js-combined.js',
      'http://localhost:9810/compile?id=test&mode=RAW',
      {pattern: 'test/**/*.json', watched: false, included: false},
      {pattern: 'test/**/*.geojson', watched: false, included: false},
      {pattern: 'test/**/*.kml', watched: false, included: false},
      {pattern: 'test/**/*.xml', watched: false, included: false},
      {pattern: 'test/**/*.test.js', included: false, served: false},
      {pattern: 'src/**/*.js', included: false, served: false}
    ],
    autoWatch: true,
    browsers: ['Chrome']
  });
};
