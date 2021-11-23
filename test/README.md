## Included in this directory

- browser - Unit/integration tests run in a browser
- node - Unit tests run with Node.js
- rendering - Tests that make assertions about rendered map output


## Run the test suite

Install the test dependencies (from the root of the repository):

    npm install

Run the tests once:

    npm test

This will run tests in (headless) Chrome.  If you do not have Chrome installed, you can run tests on Firefox instead:

    npm test -- --browsers Firefox

To run tests in other browsers, you need to install [additional Karma launchers](https://karma-runner.github.io/1.0/config/browsers.html).

To run the tests continuously:

    npm run karma

After this, you can attach any browser and debug the tests like this:

 * open http://localhost:9876/debug.html
 * open the developer tools
 * add a breakpoint
 * refresh the page

# Rendering tests

The `test/rendering` directory contains rendering tests which compare a rendered map with a
reference image using [pixelmatch](https://github.com/mapbox/pixelmatch).

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
