// Copyright 2012 The Closure Library Authors. All Rights Reserved.
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
goog.provide('goog.async.AnimationDelayTest');
goog.setTestOnly('goog.async.AnimationDelayTest');

goog.require('goog.async.AnimationDelay');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.PropertyReplacer');
goog.require('goog.testing.jsunit');
goog.require('goog.testing.recordFunction');

var testCase = goog.testing.AsyncTestCase.createAndInstall();
var stubs = new goog.testing.PropertyReplacer();

function tearDown() {
  stubs.reset();
}

function testStart() {
  var callCount = 0;
  var start = goog.now();
  var delay = new goog.async.AnimationDelay(function(end) {
    callCount++;
  });

  delay.start();
  testCase.waitForAsync('waiting for delay');

  window.setTimeout(function() {
    testCase.continueTesting();
    assertEquals(1, callCount);
  }, 500);
}

function testStop() {
  var callCount = 0;
  var start = goog.now();
  var delay = new goog.async.AnimationDelay(function(end) {
    callCount++;
  });

  delay.start();
  testCase.waitForAsync('waiting for delay');
  delay.stop();

  window.setTimeout(function() {
    testCase.continueTesting();
    assertEquals(0, callCount);
  }, 500);
}

function testAlwaysUseGoogNowForHandlerTimestamp() {
  var expectedValue = 12345.1;
  stubs.set(goog, 'now', function() {
    return expectedValue;
  });

  var handler = goog.testing.recordFunction(function(timestamp) {
    assertEquals(expectedValue, timestamp);
  });
  var delay = new goog.async.AnimationDelay(handler);

  delay.start();
  testCase.waitForAsync('waiting for delay');

  window.setTimeout(function() {
    testCase.continueTesting();
    assertEquals(1, handler.getCallCount());
  }, 500);
}
