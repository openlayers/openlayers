//
// A PhantomJS script used to check that the hosted examples load
// without errors. This script is executed by the build tool's
// check-examples target.
//
var args = require('system').args;
if (args.length != 2) {
  phantom.exit(2);
}
var examplePath = args[1];
var page = require('webpage').create();
page.onError = function(msg, trace) {
  var msgStack = ['JavaScript ERROR: ' + msg];
  if (trace) {
    msgStack.push('TRACE:');
    trace.forEach(function(t) {
      msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function + '")' : ''));
    });
  }
  console.error(msgStack.join('\n'));
  phantom.exit(1);
};
page.open(examplePath, function(s) {
  var exitCode = 0;
  if (s != 'success') {
    exitCode = 1;
    console.error('PAGE LOAD ERROR');
  }
  phantom.exit(exitCode);
});
page.onConsoleMessage = function(msg) {
  console.log('console:', msg);
};
