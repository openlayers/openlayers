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

/**
 * @fileoverview Unit tests for goog.history.History.
 */

/** @suppress {extraProvide} */
goog.provide('goog.HistoryTest');

goog.require('goog.History');
goog.require('goog.testing.jsunit');
goog.require('goog.userAgent');

goog.setTestOnly('goog.HistoryTest');


// Mimimal function to exercise construction.
function testCreation() {

  // Running goog.History in tests on older browsers simply hangs them in TAP.
  if (goog.userAgent.GECKO ||
      (goog.userAgent.IE && !goog.userAgent.isVersionOrHigher(9))) {
    return;
  }

  var history = new goog.History();

}

function testIsHashChangeSupported() {

  // This is the policy currently implemented.
  var supportsOnHashChange = (goog.userAgent.IE ?
      document.documentMode >= 8 :
      'onhashchange' in window);

  assertEquals(
      supportsOnHashChange,
      goog.History.isOnHashChangeSupported());
}

// TODO(nnaze): Test additional behavior.
