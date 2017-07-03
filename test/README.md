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

# Rendering tests

The `test/rendering` directory contains rendering tests which compare a rendered map with a
reference image using [resemble.js](http://huddle.github.io/Resemble.js/).

To run the tests in the browser, make sure the development server is running
(`make serve`) and open the URL
[http://localhost:3000/test_rendering/index.html](http://localhost:3000/test_rendering/index.html).

From the command-line the tests can be run with the build target `make test-rendering`.

## Adding new tests
When creating a new test case, a reference image has to be created. By appending `?generate`
to the URL, a canvas with the rendered map will be shown on the page when calling
`expectResemble`. Then the reference image can simply be created with a right-click
and "Save image as".

It is recommended to only run a single test case when generating the reference image.

## Image difference
When a test fails, an image showing the difference between the reference image and the
rendered map can be displayed by appending `?showdiff` to the URL.
