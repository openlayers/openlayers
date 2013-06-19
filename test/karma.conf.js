

/**
 * Export function for configuring Karma.
 * Note that this configuration syntax is new in the 0.9.x (unstable) release
 * stream.  Until it is supported in a stable release (0.10), the docs can be
 * found in the Karma repo
 * (e.g. https://github.com/karma-runner/karma/blob/v0.9.3/docs/)
 *
 * @param {Object} karma Karma DSL object.
 */
module.exports = function(karma) {
  karma.configure({
    basePath: '../',
    urlRoot: '/base/test',
    frameworks: ['mocha'],
    files: [
      'test/expect-0.2.0-ol3/expect.js',
      'test/sinon-1.6.0/sinon.js',
      'test/test-extensions.js',
      'build/proj4js/lib/proj4js-combined.js',
      'http://localhost:9810/compile?id=test&mode=RAW',
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
