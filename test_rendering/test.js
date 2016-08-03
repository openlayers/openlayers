/* global phantom, slimer */
/* eslint-disable no-console */

var url = phantom.args[0];
var page = require('webpage').create();

var v = slimer.geckoVersion;
console.log('Gecko: ' + v.major + '.' + v.minor + '.' + v.patch);

page.open(url).then(function(status) {
  if (status === 'success') {
    page.onCallback = function(failedTests) {
      if (failedTests.length > 0) {
        for (var i = 0; i < failedTests.length; i++) {
          var test = failedTests[i];
          console.log(test.title);
          console.error(test.errorStack);
          console.log('');
        }
        console.error(failedTests.length + ' test(s) failed.');
      } else {
        console.log('All tests passed.');
      }
      page.close();
      phantom.exit(failedTests.length === 0 ? 0 : 1);
    };
  } else {
    console.error('The tests could not be started. Is the server running?');
    page.close();
    phantom.exit(1);
  }
});
