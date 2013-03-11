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

/**
 * @fileoverview Unit tests for goog.labs.net.Image.
 *
 * @author nnaze@google.com (Nathan Naze)
 */


goog.provide('goog.labs.net.imageTest');

goog.require('goog.events');
goog.require('goog.labs.net.image');
goog.require('goog.labs.result');
goog.require('goog.labs.result.Result');
goog.require('goog.net.EventType');
goog.require('goog.string');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.jsunit');
goog.require('goog.testing.recordFunction');

goog.setTestOnly('goog.labs.net.ImageTest');

var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall();

function testValidImage() {
  var url = 'testdata/cleardot.gif';

  asyncTestCase.waitForAsync('image load');

  assertEquals(0, goog.events.getTotalListenerCount());

  var result = goog.labs.net.image.load(url);

  goog.labs.result.waitOnSuccess(result, function(value) {

    assertEquals(goog.labs.result.Result.State.SUCCESS, result.getState());

    assertEquals('IMG', value.tagName);
    assertTrue(goog.string.endsWith(value.src, url));
    assertUndefined(result.getError());

    assertEquals('Listeners should have been cleaned up.',
                 0, goog.events.getTotalListenerCount());

    asyncTestCase.continueTesting();
  });
}

function testInvalidImage() {

  var url = 'testdata/invalid.gif'; // This file does not exist.

  asyncTestCase.waitForAsync('image load');

  assertEquals(0, goog.events.getTotalListenerCount());

  var result = goog.labs.net.image.load(url);

  goog.labs.result.wait(result, function(result) {

    assertEquals(goog.labs.result.Result.State.ERROR, result.getState());
    assertUndefined(result.getValue());
    assertUndefined(result.getError());

    assertEquals('Listeners should have been cleaned up.',
                 0, goog.events.getTotalListenerCount());

    asyncTestCase.continueTesting();
  });
}

function testImageFactory() {
  var returnedImage = new Image();
  var factory = function() {
    return returnedImage;
  }
  var countedFactory = goog.testing.recordFunction(factory);

  var url = 'testdata/cleardot.gif';

  asyncTestCase.waitForAsync('image load');
  assertEquals(0, goog.events.getTotalListenerCount());
  var result = goog.labs.net.image.load(url, countedFactory);

  goog.labs.result.waitOnSuccess(result, function(value) {
    assertEquals(goog.labs.result.Result.State.SUCCESS, result.getState());
    assertEquals(returnedImage, value);
    assertEquals(1, countedFactory.getCallCount());
    assertUndefined(result.getError());

    assertEquals('Listeners should have been cleaned up.',
                 0, goog.events.getTotalListenerCount());
    asyncTestCase.continueTesting();
  });
}

function testExistingImage() {
  var image = new Image();

  var url = 'testdata/cleardot.gif';

  asyncTestCase.waitForAsync('image load');
  assertEquals(0, goog.events.getTotalListenerCount());
  var result = goog.labs.net.image.load(url, image);

  goog.labs.result.waitOnSuccess(result, function(value) {
    assertEquals(goog.labs.result.Result.State.SUCCESS, result.getState());
    assertEquals(image, value);
    assertUndefined(result.getError());

    assertEquals('Listeners should have been cleaned up.',
                 0, goog.events.getTotalListenerCount());
    asyncTestCase.continueTesting();
  });
}
