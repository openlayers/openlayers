Included in this directory
--------------------------

- ol.html - the web page used to run the test suite.

- spec - includes the OpenLayers test/spec files.

- expect-0.2.0 - Minimalistic BDD-style assertion framework.
  https://github.com/LearnBoost/expect.js/

- jquery-1.9.1 - The Write Less, Do More, JavaScript Library.
  http://jquery.com/

- mocha-1.8.1 - the fun, simple, flexible JavaScript test framework.
  http://visionmedia.github.com/mocha/

- sinon-1.6.0 - Standalone test spies, stubs and mocks for JavaScript.
  http://sinonjs.org/

- test-extensions.js - includes OpenLayers-specific extensions to the
  testing frameworks.

- mocha-phantom - a PhantomJS script for headless testing with mocha.
  http://metaskills.net/mocha-phantomjs/

Run the test suite with PhantomJS
---------------------------------

With PhantomJS installed, and assuming phantomjs is in the PATH:

    $ phantomjs mocha-phantom.coffee ol.html

(Works with PhantomJS 1.6.1, untested with other versions.)

This command can also be run by doing `./build.py test` at the root of ol3.

Make sure that the polvr web server is running (`./build.py serve`), otherwise
you will most likely see something like `0 specs, 0 failures in 0.001s.`.

Tip for TDD'ers: to make PhantomJS run the test suite continuously each time
a spec file is changed you can use nosier (http://pypi.python.org/pypi/nosier)
and do `nosier -p test -p src "./build.py test"`.
