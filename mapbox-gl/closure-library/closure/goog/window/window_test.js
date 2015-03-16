// Copyright 2009 The Closure Library Authors. All Rights Reserved.
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

goog.provide('goog.windowTest');
goog.setTestOnly('goog.windowTest');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.string');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.jsunit');
goog.require('goog.window');

var newWin;
var REDIRECT_URL_PREFIX = 'window_test.html?runTests=';
var asyncTestCase =
    goog.testing.AsyncTestCase.createAndInstall(document.title);
asyncTestCase.stepTimeout = 5000;

var WIN_LOAD_TRY_TIMEOUT = 100;
var MAX_WIN_LOAD_TRIES = 50; // 50x100ms = 5s waiting for window to load.
var winLoadCounter;

function setUpPage() {
  var anchors = goog.dom.getElementsByTagNameAndClass(
      'div', 'goog-like-link');
  for (var i = 0; i < anchors.length; i++) {
    goog.events.listen(
        anchors[i], 'click',
        function(e) {
          goog.window.open(
              goog.dom.getTextContent(e.target), {'noreferrer': true});
        });
  }
}


/**
 * Some tests should only run locally, because they will trigger
 * popup blockers on http urls.
 */
function canOpenPopups() {
  // TODO(nicksantos): Fix the test runner farm.
  return window.location.toString().indexOf('file://') == 0;
}

if (canOpenPopups()) {
  // To test goog.window.open we open a new window with this file again. Once
  // the new window gets to this point in the file it notifies the opener that
  // it has loaded, so that the opener knows that the new window has been
  // populated with properties like referrer and location.
  var newWinLoaded = false;
  if (window.opener && window.opener.newWinLoaded === false) {
    window.opener.newWinLoaded = true;
  }
}

function setUp() {
  newWinLoaded = false;
}

function tearDown() {
  if (newWin) {
    newWin.close();
  }
}


/**
 * Uses setTimeout to keep checking if a new window has been loaded, and once
 * it has, calls the given continuation function and then calls
 * asyncTestCase.continueTesting() to resume the flow of the test.
 * @param {Function} continueFn Continuation function to be called when the
 *     new window has loaded.
 * @param {number=} opt_numTries Number of times this method has checked if
 *     the window has loaded, to prevent getting in an endless setTimeout
 *     loop. (Used internally, callers should omit.)
 */
function continueAfterWindowLoaded(continueFn, opt_numTries) {
  opt_numTries = opt_numTries || 0;
  if (newWinLoaded) {
    continueFn();
    asyncTestCase.continueTesting();
  } else if (opt_numTries > MAX_WIN_LOAD_TRIES) {
    fail('Window did not load after maximum number of checks.');
    asyncTestCase.continueTesting();
  } else {
    setTimeout(goog.partial(continueAfterWindowLoaded,
                            continueFn, ++opt_numTries),
               WIN_LOAD_TRY_TIMEOUT);
  }
}


/**
 * Helper to kick off a test that opens a window and checks that the referrer
 * is hidden if requested and the url is properly encoded/decoded.
 * @param {boolean} noreferrer Whether to test the noreferrer option.
 * @param {string} urlParam Url param to append to the url being opened.
 */
function doTestOpenWindow(noreferrer, urlParam) {
  if (!canOpenPopups()) {
    return;
  }
  newWin = goog.window.open(REDIRECT_URL_PREFIX + urlParam,
                            {'noreferrer': noreferrer});
  asyncTestCase.waitForAsync('Waiting for window to open and load.');
  continueAfterWindowLoaded(
      goog.partial(continueTestOpenWindow, noreferrer, urlParam));
}


/**
 * Helper callback to do asserts after the window opens.
 * @param {boolean} noreferrer Whether the noreferrer option is being tested.
 * @param {string} urlParam Url param appended to the url being opened.
 */
function continueTestOpenWindow(noreferrer, urlParam) {
  if (noreferrer) {
    assertEquals('Referrer should have been stripped',
                 '', newWin.document.referrer);
  }

  var newWinUrl = decodeURI(newWin.location);
  var expectedUrlSuffix = decodeURI(urlParam);
  assertTrue('New window href should have ended with <' + expectedUrlSuffix +
      '> but was <' + newWinUrl + '>',
      goog.string.endsWith(newWinUrl, expectedUrlSuffix));
}


function testOpenNotEncoded() {
  doTestOpenWindow(false, '"bogus~"');
}

function testOpenEncoded() {
  doTestOpenWindow(false, '"bogus%7E"');
}

function testOpenEncodedPercent() {
  // Intent of url is to pass %7E to the server, so it was encoded to %257E .
  doTestOpenWindow(false, '"bogus%257E"');
}

function testOpenNotEncodedHidingReferrer() {
  doTestOpenWindow(true, '"bogus~"');
}

function testOpenEncodedHidingReferrer() {
  doTestOpenWindow(true, '"bogus%7E"');
}

function testOpenEncodedPercentHidingReferrer() {
  // Intent of url is to pass %7E to the server, so it was encoded to %257E .
  doTestOpenWindow(true, '"bogus%257E"');
}

function testOpenSemicolon() {
  doTestOpenWindow(true, 'beforesemi;aftersemi');
}

function testTwoSemicolons() {
  doTestOpenWindow(true, 'a;b;c');
}

function testOpenAmpersand() {
  doTestOpenWindow(true, 'this&that');
}

function testOpenSingleQuote() {
  doTestOpenWindow(true, "'");
}

function testOpenDoubleQuote() {
  doTestOpenWindow(true, '"');
}

function testOpenDoubleQuote() {
  doTestOpenWindow(true, '<');
}

function testOpenDoubleQuote() {
  doTestOpenWindow(true, '>');
}

function testOpenBlank() {
  if (!canOpenPopups()) {
    return;
  }
  newWin = goog.window.openBlank('Loading...');
  asyncTestCase.waitForAsync('Waiting for temp window to open and load.');
  var urlParam = 'bogus~';

  var continueFn = function() {
    newWin.location.href = REDIRECT_URL_PREFIX + urlParam;
    continueAfterWindowLoaded(
        goog.partial(continueTestOpenWindow, false, urlParam));
  };
  setTimeout(continueFn, 100);
}


/** @this {Element} */
function stripReferrer() {
  goog.window.open(this.href, {'noreferrer': true});
}
