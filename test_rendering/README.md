# Rendering tests

This directory contains rendering tests which compare a rendered map with a
reference image using [resemble.js](http://huddle.github.io/Resemble.js/).

Similar to the unit tests, there are two ways to run the tests: directly in the
browser or using [SlimerJS](http://slimerjs.org/) from the command-line.

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
