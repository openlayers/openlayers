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

## Running the tests in Docker

Fonts and anti-aliasing differ between platforms, so screenshots taken on your machine may not match the expected ones, which are made on GitHub CI. With [Docker](https://docs.docker.com/get-docker/) installed, you can run the tests in the same Linux environment as CI:

```bash
npm run test-rendering-docker
```

Options are passed on to the test script, e.g. to create the expected screenshot of a new test case:

```bash
npm run test-rendering-docker -- --match your-test-case-name --fix
```

The first run takes a while, because it builds the image. On ARM machines like Apple Silicon Macs, the tests run in x64 emulation, which is slower. The `--interactive` option does not work in Docker.

## Creating a new test

To create a new test case, add a directory under `cases` and add a `main.js` to it (copied from one of the other cases).  Then to generate the `expected.png` screenshot, run the test script with the `--fix` flag:

```bash
node test/rendering/test.js --match your-test-case-name --fix
```

Note that your `main.js` needs to call the magic `render()` function after setting up the map.  This triggers a snapshot.  The `render()` function can be called with an options object that includes a `tolerance` property.  The tolerance is related to the ratio of mismatched pixels to the total number of pixels in the actual screenshot.  With a `map` property, the snapshot is taken on that map's next `rendercomplete` event, which is useful when data loads or decodes asynchronously.

After creating a new test case, commit your `main.js` and `expected.png` files.
