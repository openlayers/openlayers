## Included in this directory

- browser - Unit/integration tests run in a browser
- node - Unit tests run with Node.js
- rendering - Tests that make assertions about rendered map output


## Run the test suite

Install the test dependencies (from the root of the repository):

    npm install

Run the tests once:

    npm test

This will run all tests - browser, node and rendering.

## Browser tests

To run the browser tests continuously:

    npm run karma

After this, you can attach any browser and debug the tests like this:

 * open http://localhost:9876/debug.html
 * open the developer tools
 * add a breakpoint
 * refresh the page

## Node tests

The `test/node` directory contains tests using code that does not require a browser to run. See the [readme there](./node/readme.md) for details.

## Rendering tests

The `test/rendering` directory contains rendering tests which compare a rendered map with a
reference image. See the [readme there](./rendering/readme.md) for details.

