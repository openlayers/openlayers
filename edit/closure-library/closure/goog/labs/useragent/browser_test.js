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
 * @fileoverview Unit tests for goog.labs.userAgent.browser.
 */

goog.provide('goog.labs.userAgent.browserTest');

goog.require('goog.labs.userAgent.browser');
goog.require('goog.labs.userAgent.testAgents');
goog.require('goog.testing.PropertyReplacer');
goog.require('goog.testing.jsunit');

goog.setTestOnly('goog.labs.userAgent.browserTest');


var propertyReplacer = new goog.testing.PropertyReplacer();

function setUp() {
  // disable memoization
  propertyReplacer.set(goog.memoize, 'ENABLE_MEMOIZE', false);
}

function tearDown() {
  propertyReplacer.reset();
}

function testOpera() {
  setGlobalUAString(goog.labs.userAgent.testAgents.OPERA_10);
  assertTrue(goog.labs.userAgent.browser.isOpera());
  assertVersion('10.00');
  assertVersionBetween('10.00', '10.10');

  setGlobalUAString(goog.labs.userAgent.testAgents.OPERA_MAC);
  assertTrue(goog.labs.userAgent.browser.isOpera());
  assertVersion('11.52');
  assertVersionBetween('11.50', '12.00');

  setGlobalUAString(goog.labs.userAgent.testAgents.OPERA_LINUX);
  assertTrue(goog.labs.userAgent.browser.isOpera());
  assertVersion('11.50');
  assertVersionBetween('11.00', '12.00');
}

function testIE() {
  setGlobalUAString(goog.labs.userAgent.testAgents.IE_6);
  assertTrue(goog.labs.userAgent.browser.isIE());
  assertVersion('6.0');
  assertVersionBetween('5.0', '7.0');

  setGlobalUAString(goog.labs.userAgent.testAgents.IE_10);
  assertTrue(goog.labs.userAgent.browser.isIE());
  assertVersion('10.6');
  assertVersionBetween('10.0', '11.0');

  setGlobalUAString(goog.labs.userAgent.testAgents.IE_9);
  assertTrue(goog.labs.userAgent.browser.isIE());
  assertVersion('9.0');
  assertVersionBetween('8.0', '10.0');

  setGlobalUAString(goog.labs.userAgent.testAgents.IE_8);
  assertTrue(goog.labs.userAgent.browser.isIE());
  assertVersion('8.0');
  assertVersionBetween('7.0', '9.0');

  setGlobalUAString(goog.labs.userAgent.testAgents.IE_8_COMPATIBILITY);
  // Test Document mode override
  setDocumentMode('9');
  assertTrue(goog.labs.userAgent.browser.isIE());
  assertVersion('9');

  setGlobalUAString(goog.labs.userAgent.testAgents.IE_9_COMPATIBILITY);
  setDocumentMode('9');
  assertTrue(goog.labs.userAgent.browser.isIE());
  assertVersion('9');

  setGlobalUAString(goog.labs.userAgent.testAgents.IE_9_COMPATIBILITY);
  setDocumentMode('8');
  assertTrue(goog.labs.userAgent.browser.isIE());
  assertVersion('8');

  setGlobalUAString(goog.labs.userAgent.testAgents.IE_11);
  assertTrue(goog.labs.userAgent.browser.isIE());
  assertVersion('11.0');
  assertVersionBetween('10.0', '12.0');
}

function testFirefox() {
  setGlobalUAString(goog.labs.userAgent.testAgents.FIREFOX_19);
  assertTrue(goog.labs.userAgent.browser.isFirefox());
  assertVersion('19.0');
  assertVersionBetween('18.0', '20.0');

  setGlobalUAString(goog.labs.userAgent.testAgents.FIREFOX_WINDOWS);
  assertTrue(goog.labs.userAgent.browser.isFirefox());
  assertVersion('14.0.1');
  assertVersionBetween('14.0', '15.0');

  setGlobalUAString(goog.labs.userAgent.testAgents.FIREFOX_LINUX);
  assertTrue(goog.labs.userAgent.browser.isFirefox());
  assertVersion('15.0.1');
}

function testChrome() {
  setGlobalUAString(goog.labs.userAgent.testAgents.CHROME_ANDROID);
  assertTrue(goog.labs.userAgent.browser.isChrome());
  assertVersion('18.0.1025.133');
  assertVersionBetween('18.0', '19.0');
  assertVersionBetween('17.0', '18.1');

  setGlobalUAString(goog.labs.userAgent.testAgents.CHROME_IPHONE);
  assertTrue(goog.labs.userAgent.browser.isChrome());
  assertVersion('22.0.1194.0');
  assertVersionBetween('22.0', '23.0');
  assertVersionBetween('22.0', '22.10');

  setGlobalUAString(goog.labs.userAgent.testAgents.CHROME_MAC);
  assertTrue(goog.labs.userAgent.browser.isChrome());
  assertVersion('24.0.1309.0');
  assertVersionBetween('24.0', '25.0');
  assertVersionBetween('24.0', '24.10');
}

function testSafari() {
  setGlobalUAString(goog.labs.userAgent.testAgents.IPAD_6);
  assertTrue(goog.labs.userAgent.browser.isSafari());
  assertVersion('6.0');
  assertVersionBetween('5.1', '7.0');

  setGlobalUAString(goog.labs.userAgent.testAgents.SAFARI_6);
  assertTrue(goog.labs.userAgent.browser.isSafari());
  assertVersion('6.0');
  assertVersionBetween('6.0', '7.0');

  setGlobalUAString(goog.labs.userAgent.testAgents.SAFARI_IPHONE);
  assertTrue(goog.labs.userAgent.browser.isSafari());
  assertVersion('5.0.2');
  assertVersionBetween('5.0', '6.0');
}

function testAndroidBrowser() {
  setGlobalUAString(goog.labs.userAgent.testAgents.ANDROID_BROWSER_235);
  assertTrue(goog.labs.userAgent.browser.isAndroidBrowser());
  assertVersion('4.0');
  assertVersionBetween('3.0', '5.0');

  setGlobalUAString(goog.labs.userAgent.testAgents.ANDROID_BROWSER_403);
  assertTrue(goog.labs.userAgent.browser.isAndroidBrowser());
  assertVersion('4.0');
  assertVersionBetween('3.0', '5.0');

  setGlobalUAString(goog.labs.userAgent.testAgents.ANDROID_BROWSER_233);
  assertTrue(goog.labs.userAgent.browser.isAndroidBrowser());
  assertVersion('4.0');
  assertVersionBetween('3.0', '5.0');
}

function setGlobalUAString(uaString) {
  var mockGlobal = {
    'navigator': {
      'userAgent': uaString
    }
  };
  propertyReplacer.set(goog, 'global', mockGlobal);
}

function setDocumentMode(docMode) {
  var mockDocument = {
    'documentMode': docMode
  };
  propertyReplacer.set(goog.global, 'document', mockDocument);
}

function assertVersion(version) {
  assertEquals(version, goog.labs.userAgent.browser.getVersion());
}

function assertVersionBetween(lowVersion, highVersion) {
  assertTrue(goog.labs.userAgent.browser.isVersionOrHigher(lowVersion));
  assertFalse(goog.labs.userAgent.browser.isVersionOrHigher(highVersion));
}
