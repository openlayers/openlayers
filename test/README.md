## Included in this directory

- index.html - the web page used to run the test suite.

- spec - includes the OpenLayers test/spec files.

- test-extensions.js - includes OpenLayers-specific extensions to the
  testing frameworks.


## Run the test suite

Install the test dependencies (from the root of the repository):

    npm install

Run the tests once with PhantomJS:

    make test

(Note that for `npm` users, this can also be run as `npm test`.)

Run the tests in a browser:

    make serve

(Again for `npm` users, this is `npm start`.)

Now visit http://localhost:3000/test/ in your browser.  The tests will re-run
any time one of the source or spec files changes.

Tip for TDD'ers: to make PhantomJS run the test suite continuously each time
a spec file is changed you can use nosier (http://pypi.python.org/pypi/nosier)
and do `nosier -p test -p src "make test"`.
