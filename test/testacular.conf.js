basePath = '../';
baseUrl = '/base/test';

files = [
  // 'test/mocha-1.8.1/mocha.js',
  MOCHA,
  MOCHA_ADAPTER,
  'test/expect-0.2.0-ol3/expect.js',
  'test/sinon-1.6.0/sinon.js',
  'test/test-extensions.js',
  'build/proj4js/lib/proj4js-combined.js',
  'http://localhost:9810/compile?id=test&mode=RAW',
  {pattern: 'test/**/*.json', watched: false, included: false, served: true},
  {pattern: 'test/**/*.xml', watched: false, included: false, served: true},
  {pattern: 'test/**/*.test.js', watched: true, included: false, served: false},
  {pattern: 'src/**/*.js', watched: true, included: false, served: false}
];

autoWatch = true;

browsers = ['Chrome'];
