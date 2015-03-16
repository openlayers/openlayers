// Copyright 2014 The Closure Library Authors. All Rights Reserved.
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

goog.provide('goog.testing.TestCaseTest');
goog.setTestOnly('goog.testing.TestCaseTest');

goog.require('goog.Promise');
goog.require('goog.testing.TestCase');
goog.require('goog.testing.jsunit');


// Dual of fail().
var ok = function() { assertTrue(true); };

// Native Promise-based equivalent of ok().
var okPromise = function() { return Promise.resolve(null); };

// Native Promise-based equivalent of fail().
var failPromise = function() { return Promise.reject(null); };

// goog.Promise-based equivalent of ok().
var okGoogPromise = function() { return goog.Promise.resolve(null); };

// goog.Promise-based equivalent of fail().
var failGoogPromise = function() { return goog.Promise.reject(null); };

function testEmptyTestCase() {
  var testCase = new goog.testing.TestCase();
  testCase.runTests();
  assertTrue(testCase.isSuccess());
  var result = testCase.getResult();
  assertTrue(result.complete);
  assertEquals(0, result.totalCount);
  assertEquals(0, result.runCount);
  assertEquals(0, result.successCount);
  assertEquals(0, result.errors.length);
}

function testEmptyTestCaseReturningPromise() {
  return new goog.testing.TestCase().runTestsReturningPromise().
      then(function(result) {
        assertTrue(result.complete);
        assertEquals(0, result.totalCount);
        assertEquals(0, result.runCount);
        assertEquals(0, result.successCount);
        assertEquals(0, result.errors.length);
      });
}

function testTestCase_SyncSuccess() {
  var testCase = new goog.testing.TestCase();
  testCase.addNewTest('foo', ok);
  testCase.runTests();
  assertTrue(testCase.isSuccess());
  var result = testCase.getResult();
  assertTrue(result.complete);
  assertEquals(1, result.totalCount);
  assertEquals(1, result.runCount);
  assertEquals(1, result.successCount);
  assertEquals(0, result.errors.length);
}

function testTestCaseReturningPromise_SyncSuccess() {
  var testCase = new goog.testing.TestCase();
  testCase.addNewTest('foo', ok);
  return testCase.runTestsReturningPromise().then(function(result) {
    assertTrue(result.complete);
    assertEquals(1, result.totalCount);
    assertEquals(1, result.runCount);
    assertEquals(1, result.successCount);
    assertEquals(0, result.errors.length);
  });
}

function testTestCaseReturningPromise_GoogPromiseResolve() {
  var testCase = new goog.testing.TestCase();
  testCase.addNewTest('foo', okGoogPromise);
  return testCase.runTestsReturningPromise().then(function(result) {
    assertTrue(result.complete);
    assertEquals(1, result.totalCount);
    assertEquals(1, result.runCount);
    assertEquals(1, result.successCount);
    assertEquals(0, result.errors.length);
  });
}

function testTestCaseReturningPromise_PromiseResolve() {
  if (!('Promise' in goog.global)) {
    return;
  }
  var testCase = new goog.testing.TestCase();
  testCase.addNewTest('foo', okPromise);
  return testCase.runTestsReturningPromise().then(function(result) {
    assertTrue(result.complete);
    assertEquals(1, result.totalCount);
    assertEquals(1, result.runCount);
    assertEquals(1, result.successCount);
    assertEquals(0, result.errors.length);
  });
}

function testTestCase_SyncFailure() {
  var testCase = new goog.testing.TestCase();
  testCase.addNewTest('foo', fail);
  testCase.runTests();
  assertFalse(testCase.isSuccess());
  var result = testCase.getResult();
  assertTrue(result.complete);
  assertEquals(1, result.totalCount);
  assertEquals(1, result.runCount);
  assertEquals(0, result.successCount);
  assertEquals(1, result.errors.length);
  assertEquals('foo', result.errors[0].source);
}

function testTestCaseReturningPromise_SyncFailure() {
  var testCase = new goog.testing.TestCase();
  testCase.addNewTest('foo', fail);
  return testCase.runTestsReturningPromise().then(function(result) {
    assertFalse(testCase.isSuccess());
    assertTrue(result.complete);
    assertEquals(1, result.totalCount);
    assertEquals(1, result.runCount);
    assertEquals(0, result.successCount);
    assertEquals(1, result.errors.length);
    assertEquals('foo', result.errors[0].source);
  });
}

function testTestCaseReturningPromise_GoogPromiseReject() {
  var testCase = new goog.testing.TestCase();
  testCase.addNewTest('foo', failGoogPromise);
  return testCase.runTestsReturningPromise().then(function(result) {
    assertFalse(testCase.isSuccess());
    assertTrue(result.complete);
    assertEquals(1, result.totalCount);
    assertEquals(1, result.runCount);
    assertEquals(0, result.successCount);
    assertEquals(1, result.errors.length);
    assertEquals('foo', result.errors[0].source);
  });
}

function testTestCaseReturningPromise_PromiseReject() {
  if (!('Promise' in goog.global)) {
    return;
  }
  var testCase = new goog.testing.TestCase();
  testCase.addNewTest('foo', failPromise);
  return testCase.runTestsReturningPromise().then(function(result) {
    assertFalse(testCase.isSuccess());
    assertTrue(result.complete);
    assertEquals(1, result.totalCount);
    assertEquals(1, result.runCount);
    assertEquals(0, result.successCount);
    assertEquals(1, result.errors.length);
    assertEquals('foo', result.errors[0].source);
  });
}

function testTestCase_SyncSuccess_SyncFailure() {
  var testCase = new goog.testing.TestCase();
  testCase.addNewTest('foo', ok);
  testCase.addNewTest('bar', fail);
  testCase.runTests();
  assertFalse(testCase.isSuccess());
  var result = testCase.getResult();
  assertTrue(result.complete);
  assertEquals(2, result.totalCount);
  assertEquals(2, result.runCount);
  assertEquals(1, result.successCount);
  assertEquals(1, result.errors.length);
  assertEquals('bar', result.errors[0].source);
}

function testTestCaseReturningPromise_SyncSuccess_SyncFailure() {
  var testCase = new goog.testing.TestCase();
  testCase.addNewTest('foo', ok);
  testCase.addNewTest('bar', fail);
  return testCase.runTestsReturningPromise().then(function(result) {
    assertTrue(result.complete);
    assertEquals(2, result.totalCount);
    assertEquals(2, result.runCount);
    assertEquals(1, result.successCount);
    assertEquals(1, result.errors.length);
    assertEquals('bar', result.errors[0].source);
  });
}

function testTestCaseReturningPromise_GoogPromiseResolve_GoogPromiseReject() {
  var testCase = new goog.testing.TestCase();
  testCase.addNewTest('foo', okGoogPromise);
  testCase.addNewTest('bar', failGoogPromise);
  return testCase.runTestsReturningPromise().then(function(result) {
    assertTrue(result.complete);
    assertEquals(2, result.totalCount);
    assertEquals(2, result.runCount);
    assertEquals(1, result.successCount);
    assertEquals(1, result.errors.length);
    assertEquals('bar', result.errors[0].source);
  });
}

function testTestCaseReturningPromise_PromiseResolve_PromiseReject() {
  if (!('Promise' in goog.global)) {
    return;
  }
  var testCase = new goog.testing.TestCase();
  testCase.addNewTest('foo', okPromise);
  testCase.addNewTest('bar', failPromise);
  return testCase.runTestsReturningPromise().then(function(result) {
    assertTrue(result.complete);
    assertEquals(2, result.totalCount);
    assertEquals(2, result.runCount);
    assertEquals(1, result.successCount);
    assertEquals(1, result.errors.length);
    assertEquals('bar', result.errors[0].source);
  });
}

function testTestCaseReturningPromise_PromiseResolve_GoogPromiseReject() {
  if (!('Promise' in goog.global)) {
    return;
  }
  var testCase = new goog.testing.TestCase();
  testCase.addNewTest('foo', okPromise);
  testCase.addNewTest('bar', failGoogPromise);
  return testCase.runTestsReturningPromise().then(function(result) {
    assertTrue(result.complete);
    assertEquals(2, result.totalCount);
    assertEquals(2, result.runCount);
    assertEquals(1, result.successCount);
    assertEquals(1, result.errors.length);
    assertEquals('bar', result.errors[0].source);
  });
}

function testTestCaseReturningPromise_GoogPromiseResolve_PromiseReject() {
  if (!('Promise' in goog.global)) {
    return;
  }
  var testCase = new goog.testing.TestCase();
  testCase.addNewTest('foo', okGoogPromise);
  testCase.addNewTest('bar', failPromise);
  return testCase.runTestsReturningPromise().then(function(result) {
    assertTrue(result.complete);
    assertEquals(2, result.totalCount);
    assertEquals(2, result.runCount);
    assertEquals(1, result.successCount);
    assertEquals(1, result.errors.length);
    assertEquals('bar', result.errors[0].source);
  });
}

function testTestCaseNeverRun() {
  var testCase = new goog.testing.TestCase();
  testCase.addNewTest('foo', fail);
  // Missing testCase.runTests()
  var result = testCase.getResult();
  assertFalse(result.complete);
  assertEquals(0, result.totalCount);
  assertEquals(0, result.runCount);
  assertEquals(0, result.successCount);
  assertEquals(0, result.errors.length);
}
