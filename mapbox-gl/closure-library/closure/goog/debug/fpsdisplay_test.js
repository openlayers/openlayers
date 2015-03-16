// Copyright 2011 The Closure Library Authors. All Rights Reserved.
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

goog.provide('goog.debug.FpsDisplayTest');
goog.setTestOnly('goog.debug.FpsDisplayTest');

goog.require('goog.debug.FpsDisplay');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.jsunit');

var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall();
var fpsDisplay;
var timer;
asyncTestCase.stepTimeout = 10 * 1000;

function setUp() {
  fpsDisplay = new goog.debug.FpsDisplay();
}

function tearDown() {
  goog.dispose(fpsDisplay);
  window.clearTimeout(timer);
}

function testRendering() {
  fpsDisplay.render();

  var elem = fpsDisplay.getElement();
  assertHTMLEquals('', elem.innerHTML);

  asyncTestCase.waitForAsync('Waiting for some frames to pass');
  timer = window.setTimeout(function() {
    var fps = parseInt(elem.innerHTML, 10);
    assertTrue('FPS of ' + fps + ' should be non-negative', fps >= 0);
    assertTrue('FPS of ' + fps + ' too big', fps < 1000);
    asyncTestCase.continueTesting();
  }, 2000);
}
