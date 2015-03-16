// Copyright 2013 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

goog.provide('goog.PromiseTest');

goog.require('goog.Promise');
goog.require('goog.Thenable');
goog.require('goog.functions');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.MockClock');
goog.require('goog.testing.PropertyReplacer');
goog.require('goog.testing.jsunit');
goog.require('goog.testing.recordFunction');

goog.setTestOnly('goog.PromiseTest');


// TODO(brenneman):
// - Add tests for interoperability with native Promises where available.
// - Make most tests use the MockClock (though some tests should still verify
//   real asynchronous behavior.
// - Add tests for long stack traces.


var mockClock;
var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall(document.title);
var stubs = new goog.testing.PropertyReplacer();
var unhandledRejections;


// Simple shared objects used as test values.
var dummy = {toString: goog.functions.constant('[object dummy]')};
var sentinel = {toString: goog.functions.constant('[object sentinel]')};


function setUpPage() {
  asyncTestCase.stepTimeout = 200;
  mockClock = new goog.testing.MockClock();
}


function setUp() {
  unhandledRejections = goog.testing.recordFunction();
  goog.Promise.setUnhandledRejectionHandler(unhandledRejections);
}


function tearDown() {
  if (mockClock) {
    // The system should leave no pending unhandled rejections. Advance the mock
    // clock to the end of time to catch any rethrows waiting in the queue.
    mockClock.tick(Infinity);
    mockClock.uninstall();
    mockClock.reset();
  }
  stubs.reset();
}


function tearDownPage() {
  goog.dispose(mockClock);
}


function continueTesting() {
  asyncTestCase.continueTesting();
}


/**
 * Dummy onfulfilled or onrejected function that should not be called.
 *
 * @param {*} result The result passed into the callback.
 */
function shouldNotCall(result) {
  fail('This should not have been called (result: ' + String(result) + ')');
}


function fulfillSoon(value, delay) {
  return new goog.Promise(function(resolve, reject) {
    window.setTimeout(function() {
      resolve(value);
    }, delay);
  });
}


function rejectSoon(reason, delay) {
  return new goog.Promise(function(resolve, reject) {
    window.setTimeout(function() {
      reject(reason);
    }, delay);
  });
}


function testThenIsFulfilled() {
  asyncTestCase.waitForAsync();
  var timesCalled = 0;

  var p = new goog.Promise(function(resolve, reject) {
    resolve(sentinel);
  });
  p.then(function(value) {
    timesCalled++;
    assertEquals(sentinel, value);
    assertEquals('onFulfilled must be called exactly once.', 1, timesCalled);
  });
  p.thenAlways(continueTesting);

  assertEquals('then() must return before callbacks are invoked.',
               0, timesCalled);
}


function testThenIsRejected() {
  asyncTestCase.waitForAsync();
  var timesCalled = 0;

  var p = new goog.Promise(function(resolve, reject) {
    reject(sentinel);
  });
  p.then(shouldNotCall, function(value) {
    timesCalled++;
    assertEquals(sentinel, value);
    assertEquals('onRejected must be called exactly once.', 1, timesCalled);
  });
  p.thenAlways(continueTesting);

  assertEquals('then() must return before callbacks are invoked.',
               0, timesCalled);
}

function testThenAsserts() {
  var p = goog.Promise.resolve();

  var m = assertThrows(function() {
    p.then({});
  });
  assertContains('opt_onFulfilled should be a function.', m.message);

  m = assertThrows(function() {
    p.then(function() {}, {});
  });
  assertContains('opt_onRejected should be a function.', m.message);
}


function testOptionalOnFulfilled() {
  asyncTestCase.waitForAsync();

  goog.Promise.resolve(sentinel).
      then(null, null).
      then(null, shouldNotCall).
      then(function(value) {
        assertEquals(sentinel, value);
      }).
      thenAlways(continueTesting);
}


function testOptionalOnRejected() {
  asyncTestCase.waitForAsync();

  goog.Promise.reject(sentinel).
      then(null, null).
      then(shouldNotCall).
      then(null, function(reason) {
        assertEquals(sentinel, reason);
      }).
      thenAlways(continueTesting);
}


function testMultipleResolves() {
  asyncTestCase.waitForAsync();
  var timesCalled = 0;
  var resolvePromise;

  var p = new goog.Promise(function(resolve, reject) {
    resolvePromise = resolve;
    resolve('foo');
    resolve('bar');
  });

  p.then(function(value) {
    timesCalled++;
    assertEquals('onFulfilled must be called exactly once.', 1, timesCalled);
  });

  // Add one more test for fulfilling after a delay.
  window.setTimeout(function() {
    resolvePromise('baz');
    assertEquals(1, timesCalled);
    continueTesting();
  }, 10);
}


function testMultipleRejects() {
  asyncTestCase.waitForAsync();
  var timesCalled = 0;
  var rejectPromise;

  var p = new goog.Promise(function(resolve, reject) {
    rejectPromise = reject;
    reject('foo');
    reject('bar');
  });

  p.then(shouldNotCall, function(value) {
    timesCalled++;
    assertEquals('onRejected must be called exactly once.', 1, timesCalled);
  });

  // Add one more test for rejecting after a delay.
  window.setTimeout(function() {
    rejectPromise('baz');
    assertEquals(1, timesCalled);
    continueTesting();
  }, 10);
}


function testAsynchronousThenCalls() {
  asyncTestCase.waitForAsync();
  var timesCalled = [0, 0, 0, 0];
  var p = new goog.Promise(function(resolve, reject) {
    window.setTimeout(function() {
      resolve();
    }, 30);
  });

  p.then(function() {
    timesCalled[0]++;
    assertArrayEquals([1, 0, 0, 0], timesCalled);
  });

  window.setTimeout(function() {
    p.then(function() {
      timesCalled[1]++;
      assertArrayEquals([1, 1, 0, 0], timesCalled);
    });
  }, 10);

  window.setTimeout(function() {
    p.then(function() {
      timesCalled[2]++;
      assertArrayEquals([1, 1, 1, 0], timesCalled);
    });
  }, 20);

  window.setTimeout(function() {
    p.then(function() {
      timesCalled[3]++;
      assertArrayEquals([1, 1, 1, 1], timesCalled);
    });
    p.thenAlways(continueTesting);
  }, 40);
}


function testResolveWithPromise() {
  asyncTestCase.waitForAsync();
  var resolveBlocker;
  var hasFulfilled = false;
  var blocker = new goog.Promise(function(resolve, reject) {
    resolveBlocker = resolve;
  });

  var p = goog.Promise.resolve(blocker);
  p.then(function(value) {
    hasFulfilled = true;
    assertEquals(sentinel, value);
  }, shouldNotCall);
  p.thenAlways(function() {
    assertTrue(hasFulfilled);
    continueTesting();
  });

  assertFalse(hasFulfilled);
  resolveBlocker(sentinel);
}


function testResolveWithRejectedPromise() {
  asyncTestCase.waitForAsync();
  var rejectBlocker;
  var hasRejected = false;
  var blocker = new goog.Promise(function(resolve, reject) {
    rejectBlocker = reject;
  });

  var p = goog.Promise.resolve(blocker);
  p.then(shouldNotCall, function(reason) {
    hasRejected = true;
    assertEquals(sentinel, reason);
  });
  p.thenAlways(function() {
    assertTrue(hasRejected);
    continueTesting();
  });

  assertFalse(hasRejected);
  rejectBlocker(sentinel);
}


function testRejectWithPromise() {
  asyncTestCase.waitForAsync();
  var resolveBlocker;
  var hasFulfilled = false;
  var blocker = new goog.Promise(function(resolve, reject) {
    resolveBlocker = resolve;
  });

  var p = goog.Promise.reject(blocker);
  p.then(function(value) {
    hasFulfilled = true;
    assertEquals(sentinel, value);
  }, shouldNotCall);
  p.thenAlways(function() {
    assertTrue(hasFulfilled);
    continueTesting();
  });

  assertFalse(hasFulfilled);
  resolveBlocker(sentinel);
}


function testRejectWithRejectedPromise() {
  asyncTestCase.waitForAsync();
  var rejectBlocker;
  var hasRejected = false;
  var blocker = new goog.Promise(function(resolve, reject) {
    rejectBlocker = reject;
  });

  var p = goog.Promise.reject(blocker);
  p.then(shouldNotCall, function(reason) {
    hasRejected = true;
    assertEquals(sentinel, reason);
  });
  p.thenAlways(function() {
    assertTrue(hasRejected);
    continueTesting();
  });

  assertFalse(hasRejected);
  rejectBlocker(sentinel);
}


function testResolveAndReject() {
  asyncTestCase.waitForAsync();
  var onFulfilledCalled = false;
  var onRejectedCalled = false;
  var p = new goog.Promise(function(resolve, reject) {
    resolve();
    reject();
  });

  p.then(function() {
    onFulfilledCalled = true;
  }, function() {
    onRejectedCalled = true;
  });

  p.thenAlways(function() {
    assertTrue(onFulfilledCalled);
    assertFalse(onRejectedCalled);
    continueTesting();
  });
}


function testRejectAndResolve() {
  asyncTestCase.waitForAsync();
  var onFulfilledCalled = false;
  var onRejectedCalled = false;
  var p = new goog.Promise(function(resolve, reject) {
    reject();
    resolve();
  });

  p.then(function() {
    onFulfilledCalled = true;
  }, function() {
    onRejectedCalled = true;
  });

  p.thenAlways(function() {
    assertTrue(onRejectedCalled);
    assertFalse(onFulfilledCalled);
    continueTesting();
  });
}


function testThenReturnsBeforeCallbackWithFulfill() {
  asyncTestCase.waitForAsync();
  var thenHasReturned = false;
  var p = goog.Promise.resolve();

  p.then(function() {
    assertTrue(
        'Callback must be called only after then() has returned.',
        thenHasReturned);
  });
  p.thenAlways(continueTesting);
  thenHasReturned = true;
}


function testThenReturnsBeforeCallbackWithReject() {
  asyncTestCase.waitForAsync();
  var thenHasReturned = false;
  var p = goog.Promise.reject();

  p.then(null, function() {
    assertTrue(thenHasReturned);
  });
  p.thenAlways(continueTesting);
  thenHasReturned = true;
}


function testResolutionOrder() {
  asyncTestCase.waitForAsync();
  var callbacks = [];
  var p = goog.Promise.resolve();

  p.then(function() { callbacks.push(1); }, shouldNotCall);
  p.then(function() { callbacks.push(2); }, shouldNotCall);
  p.then(function() { callbacks.push(3); }, shouldNotCall);

  p.then(function() {
    assertArrayEquals([1, 2, 3], callbacks);
  });
  p.thenAlways(continueTesting);
}


function testResolutionOrderWithThrow() {
  asyncTestCase.waitForAsync();
  var callbacks = [];
  var p = goog.Promise.resolve();

  p.then(function() { callbacks.push(1); }, shouldNotCall);
  var child = p.then(function() {
    callbacks.push(2);
    throw Error();
  }, shouldNotCall);

  child.then(shouldNotCall, function() {
    // The parent callbacks should be evaluated before the child.
    callbacks.push(4);
  });

  p.then(function() { callbacks.push(3); }, shouldNotCall);

  child.then(shouldNotCall, function() {
    callbacks.push(5);
    assertArrayEquals([1, 2, 3, 4, 5], callbacks);
  });

  p.thenAlways(continueTesting);
}


function testResolutionOrderWithNestedThen() {
  asyncTestCase.waitForAsync();
  var callbacks = [];
  var p = goog.Promise.resolve();

  p.then(function() {
    callbacks.push(1);
    p.then(function() {
      callbacks.push(3);
    });
  });
  p.then(function() { callbacks.push(2); });

  window.setTimeout(function() {
    assertArrayEquals([1, 2, 3], callbacks);
    continueTesting();
  }, 100);
}


function testRejectionOrder() {
  asyncTestCase.waitForAsync();
  var callbacks = [];
  var p = goog.Promise.reject();

  p.then(shouldNotCall, function() { callbacks.push(1); });
  p.then(shouldNotCall, function() { callbacks.push(2); });
  p.then(shouldNotCall, function() { callbacks.push(3); });

  p.then(shouldNotCall, function() {
    assertArrayEquals([1, 2, 3], callbacks);
  });
  p.thenAlways(continueTesting);
}


function testRejectionOrderWithThrow() {
  asyncTestCase.waitForAsync();
  var callbacks = [];
  var p = goog.Promise.reject();

  p.then(shouldNotCall, function() { callbacks.push(1); });
  p.then(shouldNotCall, function() {
    callbacks.push(2);
    throw Error();
  });
  p.then(shouldNotCall, function() { callbacks.push(3); });

  p.then(shouldNotCall, function() {
    assertArrayEquals([1, 2, 3], callbacks);
  });
  p.thenAlways(continueTesting);
}


function testRejectionOrderWithNestedThen() {
  asyncTestCase.waitForAsync();
  var callbacks = [];

  var p = goog.Promise.reject();

  p.then(shouldNotCall, function() {
    callbacks.push(1);
    p.then(shouldNotCall, function() {
      callbacks.push(3);
    });
  });
  p.then(shouldNotCall, function() { callbacks.push(2); });

  window.setTimeout(function() {
    assertArrayEquals([1, 2, 3], callbacks);
    continueTesting();
  }, 0);
}


function testBranching() {
  asyncTestCase.waitForSignals(3);
  var p = goog.Promise.resolve(2);

  p.then(function(value) {
    assertEquals('then functions should see the same value', 2, value);
    return value / 2;
  }).then(function(value) {
    assertEquals('branch should receive the returned value', 1, value);
    asyncTestCase.signal();
  });

  p.then(function(value) {
    assertEquals('then functions should see the same value', 2, value);
    throw value + 1;
  }).then(shouldNotCall, function(reason) {
    assertEquals('branch should receive the thrown value', 3, reason);
    asyncTestCase.signal();
  });

  p.then(function(value) {
    assertEquals('then functions should see the same value', 2, value);
    return value * 2;
  }).then(function(value) {
    assertEquals('branch should receive the returned value', 4, value);
    asyncTestCase.signal();
  });
}


function testThenReturnsPromise() {
  var parent = goog.Promise.resolve();
  var child = parent.then();

  assertTrue(child instanceof goog.Promise);
  assertNotEquals('The returned Promise must be different from the input.',
                  parent, child);
}


function testBlockingPromise() {
  asyncTestCase.waitForAsync();
  var p = goog.Promise.resolve();
  var wasFulfilled = false;
  var wasRejected = false;

  var p2 = p.then(function() {
    return new goog.Promise(function(resolve, reject) {});
  });

  p2.then(function() {
    wasFulfilled = true;
  }, function() {
    wasRejected = true;
  });

  window.setTimeout(function() {
    assertFalse('p2 should be blocked on the returned Promise', wasFulfilled);
    assertFalse('p2 should be blocked on the returned Promise', wasRejected);
    continueTesting();
  }, 100);
}


function testBlockingPromiseFulfilled() {
  asyncTestCase.waitForAsync();
  var blockingPromise = new goog.Promise(function(resolve, reject) {
    window.setTimeout(function() {
      resolve(sentinel);
    }, 0);
  });

  var p = goog.Promise.resolve(dummy);
  var p2 = p.then(function(value) {
    return blockingPromise;
  });

  p2.then(function(value) {
    assertEquals(sentinel, value);
  }).thenAlways(continueTesting);
}


function testBlockingPromiseRejected() {
  asyncTestCase.waitForAsync();
  var blockingPromise = new goog.Promise(function(resolve, reject) {
    window.setTimeout(function() {
      reject(sentinel);
    }, 0);
  });

  var p = goog.Promise.resolve(blockingPromise);

  p.then(shouldNotCall, function(reason) {
    assertEquals(sentinel, reason);
  }).thenAlways(continueTesting);
}


function testBlockingThenableFulfilled() {
  asyncTestCase.waitForAsync();
  var thenable = {
    then: function(onFulfill, onReject) { onFulfill(sentinel); }
  };

  var p = goog.Promise.resolve(thenable).
      then(function(reason) {
        assertEquals(sentinel, reason);
      }, shouldNotCall).thenAlways(continueTesting);
}


function testBlockingThenableRejected() {
  asyncTestCase.waitForAsync();
  var thenable = {
    then: function(onFulfill, onReject) { onReject(sentinel); }
  };

  var p = goog.Promise.resolve(thenable).
      then(shouldNotCall, function(reason) {
        assertEquals(sentinel, reason);
      }).thenAlways(continueTesting);
}


function testBlockingThenableThrows() {
  asyncTestCase.waitForAsync();
  var thenable = {
    then: function(onFulfill, onReject) { throw sentinel; }
  };

  var p = goog.Promise.resolve(thenable).
      then(shouldNotCall, function(reason) {
        assertEquals(sentinel, reason);
      }).thenAlways(continueTesting);
}


function testBlockingThenableMisbehaves() {
  asyncTestCase.waitForAsync();
  var thenable = {
    then: function(onFulfill, onReject) {
      onFulfill(sentinel);
      onFulfill(dummy);
      onReject(dummy);
      throw dummy;
    }
  };

  var p = goog.Promise.resolve(thenable).
      then(function(value) {
        assertEquals(
            'Only the first resolution of the Thenable should have a result.',
            sentinel, value);
      }, shouldNotCall).thenAlways(continueTesting);
}


function testNestingThenables() {
  asyncTestCase.waitForAsync();
  var thenableA = {
    then: function(onFulfill, onReject) { onFulfill(sentinel); }
  };
  var thenableB = {
    then: function(onFulfill, onReject) { onFulfill(thenableA); }
  };
  var thenableC = {
    then: function(onFulfill, onReject) { onFulfill(thenableB); }
  };

  var p = goog.Promise.resolve(thenableC).
      then(function(value) {
        assertEquals(
            'Should resolve to the fulfillment value of thenableA',
            sentinel, value);
      }, shouldNotCall).thenAlways(continueTesting);
}


function testNestingThenablesRejected() {
  asyncTestCase.waitForAsync();
  var thenableA = {
    then: function(onFulfill, onReject) { onReject(sentinel); }
  };
  var thenableB = {
    then: function(onFulfill, onReject) { onReject(thenableA); }
  };
  var thenableC = {
    then: function(onFulfill, onReject) { onReject(thenableB); }
  };

  var p = goog.Promise.reject(thenableC).
      then(shouldNotCall, function(reason) {
        assertEquals(
            'Should resolve to rejection reason of thenableA',
            sentinel, reason);
      }).thenAlways(continueTesting);
}


function testThenCatch() {
  asyncTestCase.waitForAsync();
  var catchCalled = false;
  var p = goog.Promise.reject();

  var p2 = p.thenCatch(function(reason) {
    catchCalled = true;
    return sentinel;
  });

  p2.then(function(value) {
    assertTrue(catchCalled);
    assertEquals(sentinel, value);
  }, shouldNotCall);
  p2.thenAlways(continueTesting);
}


function testRaceWithEmptyList() {
  asyncTestCase.waitForAsync();
  goog.Promise.race([]).then(function(value) {
    assertUndefined(value);
  }).thenAlways(continueTesting);
}


function testRaceWithFulfill() {
  asyncTestCase.waitForAsync();

  var a = fulfillSoon('a', 40);
  var b = fulfillSoon('b', 30);
  var c = fulfillSoon('c', 10);
  var d = fulfillSoon('d', 20);

  goog.Promise.race([a, b, c, d]).
      then(function(value) {
        assertEquals('c', value);
        // Return the slowest input promise to wait for it to complete.
        return a;
      }).
      then(function(value) {
        assertEquals('The slowest promise should resolve eventually.',
                     'a', value);
      }).thenAlways(continueTesting);
}


function testRaceWithReject() {
  asyncTestCase.waitForAsync();

  var a = rejectSoon('rejected-a', 40);
  var b = rejectSoon('rejected-b', 30);
  var c = rejectSoon('rejected-c', 10);
  var d = rejectSoon('rejected-d', 20);

  var p = goog.Promise.race([a, b, c, d]).
      then(shouldNotCall, function(value) {
        assertEquals('rejected-c', value);
        return a;
      }).
      then(shouldNotCall, function(reason) {
        assertEquals('The slowest promise should resolve eventually.',
                     'rejected-a', reason);
      }).thenAlways(continueTesting);
}


function testAllWithEmptyList() {
  asyncTestCase.waitForAsync();
  goog.Promise.all([]).then(function(value) {
    assertArrayEquals([], value);
  }).thenAlways(continueTesting);
}


function testAllWithFulfill() {
  asyncTestCase.waitForAsync();

  var a = fulfillSoon('a', 40);
  var b = fulfillSoon('b', 30);
  var c = fulfillSoon('c', 10);
  var d = fulfillSoon('d', 20);

  goog.Promise.all([a, b, c, d]).then(function(value) {
    assertArrayEquals(['a', 'b', 'c', 'd'], value);
  }).thenAlways(continueTesting);
}


function testAllWithReject() {
  asyncTestCase.waitForAsync();

  var a = fulfillSoon('a', 40);
  var b = rejectSoon('rejected-b', 30);
  var c = fulfillSoon('c', 10);
  var d = fulfillSoon('d', 20);

  goog.Promise.all([a, b, c, d]).
      then(shouldNotCall, function(reason) {
        assertEquals('rejected-b', reason);
        return a;
      }).
      then(function(value) {
        assertEquals('Promise "a" should be fulfilled even though the all()' +
                     'was rejected.', 'a', value);
      }).thenAlways(continueTesting);
}


function testFirstFulfilledWithEmptyList() {
  asyncTestCase.waitForAsync();
  goog.Promise.firstFulfilled([]).then(function(value) {
    assertUndefined(value);
  }).thenAlways(continueTesting);
}


function testFirstFulfilledWithFulfill() {
  asyncTestCase.waitForAsync();

  var a = fulfillSoon('a', 40);
  var b = rejectSoon('rejected-b', 30);
  var c = rejectSoon('rejected-c', 10);
  var d = fulfillSoon('d', 20);

  goog.Promise.firstFulfilled([a, b, c, d]).
      then(function(value) {
        assertEquals('d', value);
        return c;
      }).
      then(shouldNotCall, function(reason) {
        assertEquals(
            'Promise "c" should have been rejected before the some() resolved.',
            'rejected-c', reason);
        return a;
      }).
      then(function(reason) {
        assertEquals(
            'Promise "a" should be fulfilled even after some() has resolved.',
            'a', value);
      }, shouldNotCall).thenAlways(continueTesting);
}


function testFirstFulfilledWithReject() {
  asyncTestCase.waitForAsync();

  var a = rejectSoon('rejected-a', 40);
  var b = rejectSoon('rejected-b', 30);
  var c = rejectSoon('rejected-c', 10);
  var d = rejectSoon('rejected-d', 20);

  var p = goog.Promise.firstFulfilled([a, b, c, d]).
      then(shouldNotCall, function(reason) {
        assertArrayEquals(
            ['rejected-a', 'rejected-b', 'rejected-c', 'rejected-d'], reason);
      }).thenAlways(continueTesting);
}


function testThenAlwaysWithFulfill() {
  asyncTestCase.waitForAsync();
  var p = goog.Promise.resolve().
      thenAlways(function() {
        assertEquals(0, arguments.length);
      }).
      then(continueTesting, shouldNotCall);
}


function testThenAlwaysWithReject() {
  asyncTestCase.waitForAsync();
  var p = goog.Promise.reject().
      thenAlways(function() {
        assertEquals(0, arguments.length);
      }).
      then(shouldNotCall, continueTesting);
}


function testThenAlwaysCalledMultipleTimes() {
  asyncTestCase.waitForAsync();
  var calls = [];

  var p = goog.Promise.resolve(sentinel);
  p.then(function(value) {
    assertEquals(sentinel, value);
    calls.push(1);
    return value;
  });
  p.thenAlways(function() {
    assertEquals(0, arguments.length);
    calls.push(2);
    throw Error('thenAlways throw');
  });
  p.then(function(value) {
    assertEquals(
        'Promise result should not mutate after throw from thenAlways.',
        sentinel, value);
    calls.push(3);
  });
  p.thenAlways(function() {
    assertArrayEquals([1, 2, 3], calls);
  });
  p.thenAlways(function() {
    assertEquals(
        'Should be one unhandled exception from the "thenAlways throw".',
        1, unhandledRejections.getCallCount());
    var rejectionCall = unhandledRejections.popLastCall();
    assertEquals(1, rejectionCall.getArguments().length);
    var err = rejectionCall.getArguments()[0];
    assertEquals('thenAlways throw', err.message);
    assertEquals(goog.global, rejectionCall.getThis());
  });
  p.thenAlways(continueTesting);
}


function testContextWithInit() {
  var initContext;
  var p = new goog.Promise(function(resolve, reject) {
    initContext = this;
  }, sentinel);
  assertEquals(sentinel, initContext);
}


function testContextWithInitDefault() {
  var initContext;
  var p = new goog.Promise(function(resolve, reject) {
    initContext = this;
  });
  assertEquals(
      'initFunc should default to being called in the global scope',
      goog.global, initContext);
}


function testContextWithFulfillment() {
  asyncTestCase.waitForAsync();
  var context = sentinel;
  var p = goog.Promise.resolve();

  p.then(function() {
    assertEquals(
        'Call should be made in the global scope if no context is specified.',
        goog.global, this);
  });
  p.then(function() {
    assertEquals(sentinel, this);
  }, shouldNotCall, sentinel);
  p.thenAlways(function() {
    assertEquals(sentinel, this);
    continueTesting();
  }, sentinel);
}


function testContextWithRejection() {
  asyncTestCase.waitForAsync();
  var context = sentinel;
  var p = goog.Promise.reject();

  p.then(shouldNotCall, function() {
    assertEquals(
        'Call should be made in the global scope if no context is specified.',
        goog.global, this);
  });
  p.then(shouldNotCall, function() {
    assertEquals(sentinel, this);
  }, sentinel);
  p.thenCatch(function() {
    assertEquals(sentinel, this);
  }, sentinel);
  p.thenAlways(function() {
    assertEquals(sentinel, this);
    continueTesting();
  }, sentinel);
}


function testCancel() {
  asyncTestCase.waitForAsync();
  var p = new goog.Promise(goog.nullFunction);
  p.then(shouldNotCall, function(reason) {
    assertTrue(reason instanceof goog.Promise.CancellationError);
    assertEquals('cancellation message', reason.message);
    continueTesting();
  });
  p.cancel('cancellation message');
}


function testCancelAfterResolve() {
  asyncTestCase.waitForAsync();
  var p = goog.Promise.resolve();
  p.cancel();
  p.then(null, shouldNotCall);
  p.thenAlways(continueTesting);
}


function testCancelAfterReject() {
  asyncTestCase.waitForAsync();
  var p = goog.Promise.reject(sentinel);
  p.cancel();
  p.then(shouldNotCall, function(reason) {
    assertEquals(sentinel, reason);
    continueTesting();
  });
}


function testCancelPropagation() {
  asyncTestCase.waitForSignals(2);
  var cancelError;
  var p = new goog.Promise(goog.nullFunction);

  var p2 = p.then(shouldNotCall, function(reason) {
    cancelError = reason;
    assertTrue(reason instanceof goog.Promise.CancellationError);
    assertEquals('parent cancel message', reason.message);
    return sentinel;
  });
  p2.then(function(value) {
    assertEquals(
        'Child promises should receive the returned value of the parent.',
        sentinel, value);
    asyncTestCase.signal();
  }, shouldNotCall);

  var p3 = p.then(shouldNotCall, function(reason) {
    assertEquals(
        'Every onRejected handler should receive the same cancel error.',
        cancelError, reason);
    assertEquals('parent cancel message', reason.message);
    asyncTestCase.signal();
  });

  p.cancel('parent cancel message');
}


function testCancelPropagationUpward() {
  asyncTestCase.waitForAsync();
  var cancelError;
  var cancelCalls = [];
  var parent = new goog.Promise(goog.nullFunction);

  var child = parent.then(shouldNotCall, function(reason) {
    assertTrue(reason instanceof goog.Promise.CancellationError);
    assertEquals('grandChild cancel message', reason.message);
    cancelError = reason;
    cancelCalls.push('parent');
  });

  var grandChild = child.then(shouldNotCall, function(reason) {
    assertEquals('Child should receive the same cancel error.',
                 cancelError, reason);
    cancelCalls.push('child');
  });

  grandChild.then(shouldNotCall, function(reason) {
    assertEquals('GrandChild should receive the same cancel error.',
                 cancelError, reason);
    cancelCalls.push('grandChild');
  });

  grandChild.then(shouldNotCall, function(reason) {
    assertArrayEquals(
        'Each promise in the hierarchy has a single child, so canceling the ' +
        'grandChild should cancel each ancestor in order.',
        ['parent', 'child', 'grandChild'], cancelCalls);
  }).thenAlways(continueTesting);

  grandChild.cancel('grandChild cancel message');
}


function testCancelPropagationUpwardWithMultipleChildren() {
  asyncTestCase.waitForAsync();
  var cancelError;
  var cancelCalls = [];
  var parent = fulfillSoon(sentinel, 0);

  parent.then(function(value) {
    assertEquals(
        'Non-canceled callbacks should be called after a sibling is canceled.',
        sentinel, value);
    continueTesting();
  });

  var child = parent.then(shouldNotCall, function(reason) {
    assertTrue(reason instanceof goog.Promise.CancellationError);
    assertEquals('grandChild cancel message', reason.message);
    cancelError = reason;
    cancelCalls.push('child');
  });

  var grandChild = child.then(shouldNotCall, function(reason) {
    assertEquals(reason, cancelError);
    cancelCalls.push('grandChild');
  });

  grandChild.then(shouldNotCall, function(reason) {
    assertEquals(reason, cancelError);
    assertArrayEquals(
        'The parent promise has multiple children, so only the child and ' +
        'grandChild should be canceled.',
        ['child', 'grandChild'], cancelCalls);
  });

  grandChild.cancel('grandChild cancel message');
}


function testCancelRecovery() {
  asyncTestCase.waitForSignals(2);
  var cancelError;
  var cancelCalls = [];

  var parent = fulfillSoon(sentinel, 100);

  var sibling1 = parent.then(function(value) {
    assertEquals(
        'Non-canceled callbacks should be called after a sibling is canceled.',
        sentinel, value);
  });

  var sibling2 = parent.then(shouldNotCall, function(reason) {
    assertTrue(reason instanceof goog.Promise.CancellationError);
    cancelError = reason;
    cancelCalls.push('sibling2');
    return sentinel;
  });

  parent.thenAlways(function() {
    asyncTestCase.signal();
  });

  var grandChild = sibling2.then(function(value) {
    cancelCalls.push('child');
    assertEquals(
        'Returning a non-cancel value should uncancel the grandChild.',
        value, sentinel);
    assertArrayEquals(['sibling2', 'child'], cancelCalls);
  }, shouldNotCall).thenAlways(function() {
    asyncTestCase.signal();
  });

  grandChild.cancel();
}


function testCancellationError() {
  var err = new goog.Promise.CancellationError('cancel message');
  assertTrue(err instanceof Error);
  assertTrue(err instanceof goog.Promise.CancellationError);
  assertEquals('cancel', err.name);
  assertEquals('cancel message', err.message);
}


function testMockClock() {
  mockClock.install();

  var resolveA;
  var resolveB;
  var calls = [];

  var p = new goog.Promise(function(resolve, reject) {
    resolveA = resolve;
  });

  p.then(function(value) {
    assertEquals(sentinel, value);
    calls.push('then');
  });

  var fulfilledChild = p.then(function(value) {
    assertEquals(sentinel, value);
    return goog.Promise.resolve(1);
  }).then(function(value) {
    assertEquals(1, value);
    calls.push('fulfilledChild');

  });

  var rejectedChild = p.then(function(value) {
    assertEquals(sentinel, value);
    return goog.Promise.reject(2);
  }).then(shouldNotCall, function(reason) {
    assertEquals(2, reason);
    calls.push('rejectedChild');
  });

  var unresolvedChild = p.then(function(value) {
    assertEquals(sentinel, value);
    return new goog.Promise(function(r) {
      resolveB = r;
    });
  }).then(function(value) {
    assertEquals(3, value);
    calls.push('unresolvedChild');
  });

  resolveA(sentinel);
  assertArrayEquals(
      'Calls must not be resolved until the clock ticks.',
      [], calls);

  mockClock.tick();
  assertArrayEquals(
      'All resolved Promises should execute in the same timestep.',
      ['then', 'fulfilledChild', 'rejectedChild'], calls);

  resolveB(3);
  assertArrayEquals(
      'New calls must not resolve until the clock ticks.',
      ['then', 'fulfilledChild', 'rejectedChild'], calls);

  mockClock.tick();
  assertArrayEquals(
      'All callbacks should have executed.',
      ['then', 'fulfilledChild', 'rejectedChild', 'unresolvedChild'], calls);
}


function testHandledRejection() {
  mockClock.install();
  goog.Promise.reject(sentinel).then(shouldNotCall, function(reason) {});

  mockClock.tick();
  assertEquals(0, unhandledRejections.getCallCount());
}


function testUnhandledRejection() {
  mockClock.install();
  goog.Promise.reject(sentinel);

  mockClock.tick();
  assertEquals(1, unhandledRejections.getCallCount());
  var rejectionCall = unhandledRejections.popLastCall();
  assertArrayEquals([sentinel], rejectionCall.getArguments());
  assertEquals(goog.global, rejectionCall.getThis());
}


function testUnhandledRejection_asyncTestCase() {
  goog.Promise.reject(sentinel);

  goog.Promise.setUnhandledRejectionHandler(function(error) {
    assertEquals(sentinel, error);
    asyncTestCase.continueTesting();
  });
}


function testUnhandledThrow_asyncTestCase() {
  goog.Promise.resolve().then(function() {
    throw sentinel;
  });

  goog.Promise.setUnhandledRejectionHandler(function(error) {
    assertEquals(sentinel, error);
    asyncTestCase.continueTesting();
  });
}


function testUnhandledBlockingRejection() {
  mockClock.install();
  var blocker = goog.Promise.reject(sentinel);
  goog.Promise.resolve(blocker);

  mockClock.tick();
  assertEquals(1, unhandledRejections.getCallCount());
  var rejectionCall = unhandledRejections.popLastCall();
  assertArrayEquals([sentinel], rejectionCall.getArguments());
  assertEquals(goog.global, rejectionCall.getThis());
}


function testUnhandledRejectionAfterThenAlways() {
  mockClock.install();
  var resolver = goog.Promise.withResolver();
  resolver.promise.thenAlways(function() {});
  resolver.reject(sentinel);

  mockClock.tick();
  assertEquals(1, unhandledRejections.getCallCount());
  var rejectionCall = unhandledRejections.popLastCall();
  assertArrayEquals([sentinel], rejectionCall.getArguments());
  assertEquals(goog.global, rejectionCall.getThis());
}


function testHandledBlockingRejection() {
  mockClock.install();
  var blocker = goog.Promise.reject(sentinel);
  goog.Promise.resolve(blocker).then(shouldNotCall, function(reason) {});

  mockClock.tick();
  assertEquals(0, unhandledRejections.getCallCount());
}


function testUnhandledRejectionWithTimeout() {
  mockClock.install();
  stubs.replace(goog.Promise, 'UNHANDLED_REJECTION_DELAY', 200);
  goog.Promise.reject(sentinel);

  mockClock.tick(199);
  assertEquals(0, unhandledRejections.getCallCount());

  mockClock.tick(1);
  assertEquals(1, unhandledRejections.getCallCount());
}


function testHandledRejectionWithTimeout() {
  mockClock.install();
  stubs.replace(goog.Promise, 'UNHANDLED_REJECTION_DELAY', 200);
  var p = goog.Promise.reject(sentinel);

  mockClock.tick(199);
  p.then(shouldNotCall, function(reason) {});

  mockClock.tick(1);
  assertEquals(0, unhandledRejections.getCallCount());
}


function testUnhandledRejectionDisabled() {
  mockClock.install();
  stubs.replace(goog.Promise, 'UNHANDLED_REJECTION_DELAY', -1);
  goog.Promise.reject(sentinel);

  mockClock.tick();
  assertEquals(0, unhandledRejections.getCallCount());
}


function testThenableInterface() {
  var promise = new goog.Promise(function(resolve, reject) {});
  assertTrue(goog.Thenable.isImplementedBy(promise));

  assertFalse(goog.Thenable.isImplementedBy({}));
  assertFalse(goog.Thenable.isImplementedBy('string'));
  assertFalse(goog.Thenable.isImplementedBy(1));
  assertFalse(goog.Thenable.isImplementedBy({then: function() {}}));

  function T() {}
  T.prototype.then = function(opt_a, opt_b, opt_c) {};
  goog.Thenable.addImplementation(T);
  assertTrue(goog.Thenable.isImplementedBy(new T));

  // Test COMPILED code path.
  try {
    COMPIlED = true;
    function C() {}
    C.prototype.then = function(opt_a, opt_b, opt_c) {};
    goog.Thenable.addImplementation(C);
    assertTrue(goog.Thenable.isImplementedBy(new C));
  } finally {
    COMPILED = false;
  }
}


function testCreateWithResolver_Resolved() {
  mockClock.install();
  var timesCalled = 0;

  var resolver = goog.Promise.withResolver();

  resolver.promise.then(function(value) {
    timesCalled++;
    assertEquals(sentinel, value);
  }, fail);

  assertEquals('then() must return before callbacks are invoked.',
      0, timesCalled);

  mockClock.tick();

  assertEquals('promise is not resolved until resolver is invoked.',
      0, timesCalled);

  resolver.resolve(sentinel);

  assertEquals('resolution is delayed until the next tick',
      0, timesCalled);

  mockClock.tick();

  assertEquals('onFulfilled must be called exactly once.', 1, timesCalled);
}


function testCreateWithResolver_Rejected() {
  mockClock.install();
  var timesCalled = 0;

  var resolver = goog.Promise.withResolver();

  resolver.promise.then(fail, function(reason) {
    timesCalled++;
    assertEquals(sentinel, reason);
  });

  assertEquals('then() must return before callbacks are invoked.',
      0, timesCalled);

  mockClock.tick();

  assertEquals('promise is not resolved until resolver is invoked.',
      0, timesCalled);

  resolver.reject(sentinel);

  assertEquals('resolution is delayed until the next tick',
      0, timesCalled);

  mockClock.tick();

  assertEquals('onFulfilled must be called exactly once.', 1, timesCalled);
}
