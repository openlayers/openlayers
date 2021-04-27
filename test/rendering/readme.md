# Rendering Tests

The rendering tests use [Puppeteer](https://github.com/GoogleChrome/puppeteer) to take a screenshot of a map and compare it to an expected screenshot.  Each directory in the `cases` directory includes a single test case with the following files:

 * `main.js` - the script that sets up the map and calls the magic `render()` function
 * `expected.png` - the expected screenshot (this can be generated with the `--fix` flag)
 * `actual.png` - the screenshot generated when running the tests (ignored by git)
 * `pass` - a generated marker file that represents the last time the test passed (ignored by git)

## Running the tests

To run all the rendering tests:

```bash
node test/rendering/test.js
```

To run a single rendering test case:

```bash
node test/rendering/test.js --match your-test-case-name
```

If you want to leave the test server running (and the test browser open) after running a test, use the `--interactive` option.

```bash
node test/rendering/test.js --match your-test-case-name --interactive
```

## Creating a new test

To create a new test case, add a directory under `cases` and add a `main.js` to it (copied from one of the other cases).  Then to generate the `expected.png` screenshot, run the test script with the `--fix` flag:

```bash
node test/rendering/test.js --match your-test-case-name --fix
```

Note that your `main.js` needs to call the magic `render()` function after setting up the map.  This triggers a snapshot.  The `render()` function can be called with an options object that includes a `tolerance` property.  The tolerance is related to the ratio of mismatched pixels to the total number of pixels in the actual screenshot.

After creating a new test case, commit your `main.js` and `expected.png` files.
