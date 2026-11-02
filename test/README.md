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

## Writing tests

New functionality needs tests, and bug fixes need a test that fails without the fix.

Keep tests focused:

- Add tests to the existing spec file for the module you changed, and follow the conventions already used in that file.
- Write as few tests as needed to cover the change. Use the smallest input or fixture that exercises the code path, and don't assert the same behavior twice.
- Make sure each new test fails without your change, so it is known to cover it.

Leave existing tests alone unless the expected behavior or the API they use has changed. Don't reformat, rename, restructure or extend tests that are unrelated to your change. If an existing test has to change, the pull request description should explain why.

## Browser tests

The browser tests run under Vitest. To run them once:

    npm run test-browser

To run them in watch mode while developing:

    npx vitest --config test/browser/vitest.config.mjs

Add `--browser.headless=false` to that command to run the tests in a visible
browser and debug with its devtools.

## Node tests

The `test/node` directory contains tests using code that does not require a browser to run. See the [readme there](./node/readme.md) for details.

## Rendering tests

The `test/rendering` directory contains rendering tests which compare a rendered map with a
reference image. See the [readme there](./rendering/readme.md) for details.

