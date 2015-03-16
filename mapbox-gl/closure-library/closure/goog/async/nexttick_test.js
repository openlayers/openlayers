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
goog.provide('goog.async.nextTickTest');
goog.setTestOnly('goog.async.nextTickTest');

goog.require('goog.async.nextTick');
goog.require('goog.debug.ErrorHandler');
goog.require('goog.debug.entryPointRegistry');
goog.require('goog.dom');
goog.require('goog.labs.userAgent.browser');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.MockClock');
goog.require('goog.testing.PropertyReplacer');
goog.require('goog.testing.jsunit');

var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall(
    'asyncNextTickTest');

var clock;
var propertyReplacer = new goog.testing.PropertyReplacer();

function setUp() {
  clock = null;
}

function tearDown() {
  if (clock) {
    clock.uninstall();
  }
  goog.async.nextTick.setImmediate_ = undefined;
  propertyReplacer.reset();
}


function testNextTick() {
  var c = 0;
  var max = 100;
  var async = true;
  var counterStep = function(i) {
    async = false;
    assertEquals('Order correct', i, c);
    c++;
    if (c === max) {
      asyncTestCase.continueTesting();
    }
  };
  for (var i = 0; i < max; i++) {
    goog.async.nextTick(goog.partial(counterStep, i));
  }
  assertTrue(async);
  asyncTestCase.waitForAsync('Wait for callback');
}


function testNextTickSetImmediate() {
  var c = 0;
  var max = 100;
  var async = true;
  var counterStep = function(i) {
    async = false;
    assertEquals('Order correct', i, c);
    c++;
    if (c === max) {
      asyncTestCase.continueTesting();
    }
  };
  for (var i = 0; i < max; i++) {
    goog.async.nextTick(goog.partial(counterStep, i), undefined,
        /* opt_useSetImmediate */ true);
  }
  assertTrue(async);
  asyncTestCase.waitForAsync('Wait for callback');
}

function testNextTickContext() {
  var context = {};
  var c = 0;
  var max = 10;
  var async = true;
  var counterStep = function(i) {
    async = false;
    assertEquals('Order correct', i, c);
    assertEquals(context, this);
    c++;
    if (c === max) {
      asyncTestCase.continueTesting();
    }
  };
  for (var i = 0; i < max; i++) {
    goog.async.nextTick(goog.partial(counterStep, i), context);
  }
  assertTrue(async);
  asyncTestCase.waitForAsync('Wait for callback');
}


function testNextTickMockClock() {
  clock = new goog.testing.MockClock(true);
  var result = '';
  goog.async.nextTick(function() {
    result += 'a';
  });
  goog.async.nextTick(function() {
    result += 'b';
  });
  goog.async.nextTick(function() {
    result += 'c';
  });
  assertEquals('', result);
  clock.tick(0);
  assertEquals('abc', result);
}


function testNextTickDoesntSwallowError() {
  var before = window.onerror;
  var sentinel = 'sentinel';
  window.onerror = function(e) {
    e = '' + e;
    // Don't test for contents in IE7, which does not preserve the exception
    // message.
    if (e.indexOf('Exception thrown and not caught') == -1) {
      assertContains(sentinel, e);
    }
    window.onerror = before;
    asyncTestCase.continueTesting();
    return false;
  };
  goog.async.nextTick(function() {
    throw sentinel;
  });
  asyncTestCase.waitForAsync('Wait for error');
}


function testNextTickProtectEntryPoint() {
  var errorHandlerCallbackCalled = false;
  var errorHandler = new goog.debug.ErrorHandler(function() {
    errorHandlerCallbackCalled = true;
  });

  // This is only testing wrapping the callback with the protected entry point,
  // so it's okay to replace this function with a fake.
  goog.async.nextTick.setImmediate_ = function(cb) {
    try {
      cb();
      fail('The callback should have thrown an error.');
    } catch (e) {
      assertTrue(
          e instanceof goog.debug.ErrorHandler.ProtectedFunctionError);
    }
    asyncTestCase.continueTesting();
  };
  var origSetImmediate;
  if (window.setImmediate) {
    origSetImmediate = window.setImmediate;
    window.setImmediate = goog.async.nextTick.setImmediate_;
  }
  goog.debug.entryPointRegistry.monitorAll(errorHandler);

  function thrower() {
    throw Error('This should be caught by the protected function.');
  }
  asyncTestCase.waitForAsync('Wait for callback');
  goog.async.nextTick(thrower);
  window.setImmediate = origSetImmediate;
}


function testNextTick_notStarvedBySetTimeout() {
  // This test will timeout when affected by
  // http://codeforhire.com/2013/09/21/setimmediate-and-messagechannel-broken-on-internet-explorer-10/
  // This test would fail without the fix introduced in cl/72472221
  // It keeps scheduling 0 timeouts and a single nextTick. If the nextTick
  // ever fires, the IE specific problem does not occur.
  var timeout;
  function busy() {
    timeout = setTimeout(function() {
      busy();
    }, 0);
  }
  busy();
  goog.async.nextTick(function() {
    if (timeout) {
      clearTimeout(timeout);
    }
    asyncTestCase.continueTesting();
  });
  asyncTestCase.waitForAsync('Waiting not to starve');
}


/**
 * Test a scenario in which the iframe used by the postMessage polyfill gets a
 * message that does not have match what is expected. In this case, the polyfill
 * should not try to invoke a callback (which would result in an error because
 * there would be no callbacks in the linked list).
 */
function testPostMessagePolyfillDoesNotPumpCallbackQueueIfMessageIsIncorrect() {
  // IE does not use the postMessage polyfill.
  if (goog.labs.userAgent.browser.isIE()) {
    return;
  }

  // Force postMessage pollyfill for setImmediate.
  propertyReplacer.set(window, 'setImmediate', undefined);
  propertyReplacer.set(window, 'MessageChannel', undefined);

  var callbackCalled = false;
  goog.async.nextTick(function() {
    callbackCalled = true;
  });

  var frame = document.getElementsByTagName('iframe')[0];
  frame.contentWindow.postMessage('bogus message',
      window.location.protocol + '//' + window.location.host);

  var error = null;
  frame.contentWindow.onerror = function(e) {
    error = e;
  };

  setTimeout(function() {
    assert('Callback should have been called.', callbackCalled);
    assertNull('An unexpected error was thrown.', error);
    goog.dom.removeNode(frame);
    asyncTestCase.continueTesting();
  }, 0);

  asyncTestCase.waitForAsync('Waiting for callbacks to be invoked.');
}

