basePath = '../';

files = [
  JASMINE,
  JASMINE_ADAPTER,
  'test/jasmine-extensions.js',
  'http://localhost:9810/compile?id=test&mode=RAW',
  {pattern: 'test/**/*.test.js', watched: true, included: false, served: false},
  {pattern: 'src/**/*.js', watched: true, included: false, served: false}
];

autoWatch = true;

browsers = ['Chrome'];
