# Node.js Based Tests

The tests in this directory are run in Node.js.  To run the tests:

    npm run test-node

To attach a debugger to the tests, add a `debugger` statement in the module that you want to debug and run the tests with the `--inspect-brk` flag:

    npm run test-node -- --inspect-brk

Then open chrome://inspect/ and attach to the remote target (or see https://nodejs.org/en/docs/guides/debugging-getting-started/ for other options).
