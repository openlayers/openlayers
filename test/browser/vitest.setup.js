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

// Loaded after the shim so its afterEach and where() use the aliased globals.
await import('./test-extensions.js');
