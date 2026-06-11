import expectjs from 'expect.js';
import {expect as vitestExpect} from 'vitest';
import {matchers} from './matchers.js';

// OL specs use a bare global `expect` from expect.js, not Vitest's built-in.
globalThis.expect = expectjs;

// Custom matchers on Vitest's expect, for specs converted off expect.js.
vitestExpect.extend(matchers);

// Mocha compatibility: the specs use Mocha's done-callbacks and before/after,
// which Vitest doesn't provide. Adapt a callback that declares an argument into
// a Promise (done(err) rejects), and alias the missing globals, so the specs
// run unmodified.
function adaptDone(fn) {
  if (typeof fn !== 'function' || fn.length === 0) {
    return fn;
  }
  return function () {
    return new Promise((resolve, reject) => {
      const done = (err) => (err ? reject(err) : resolve());
      const result = fn.call(this, done);
      if (result && typeof result.then === 'function') {
        result.then(() => {}, reject);
      }
    });
  };
}

function wrapRunner(runner) {
  return new Proxy(runner, {
    apply(target, thisArg, args) {
      const i = args.findIndex((a) => typeof a === 'function');
      if (i !== -1) {
        args[i] = adaptDone(args[i]);
      }
      return Reflect.apply(target, thisArg, args);
    },
  });
}

const runners = [
  'it',
  'test',
  'beforeEach',
  'afterEach',
  'beforeAll',
  'afterAll',
];
for (const name of runners) {
  if (typeof globalThis[name] === 'function') {
    globalThis[name] = wrapRunner(globalThis[name]);
  }
}
globalThis.before = globalThis.beforeAll;
globalThis.after = globalThis.afterAll;
if (globalThis.describe) {
  globalThis.xdescribe = globalThis.describe.skip;
}
if (globalThis.it) {
  globalThis.xit = globalThis.it.skip;
}

// Load after the global expect is set, since test-extensions reads it on load.
await import('./test-extensions.js');
