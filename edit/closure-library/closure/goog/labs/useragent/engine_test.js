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
 * @fileoverview Unit tests for goog.labs.userAgent.engine.
 */

goog.provide('goog.labs.userAgent.engineTest');

goog.require('goog.labs.userAgent.engine');
goog.require('goog.labs.userAgent.testAgents');
goog.require('goog.testing.PropertyReplacer');
goog.require('goog.testing.jsunit');

goog.setTestOnly('goog.labs.userAgent.engineTest');

var propertyReplacer = new goog.testing.PropertyReplacer();

function setUp() {
  // disable memoization
  propertyReplacer.set(goog.memoize, 'ENABLE_MEMOIZE', false);
}

function tearDown() {
  propertyReplacer.reset();
}

function setGlobalUAString(uaString) {
  var mockGlobal = {
    'navigator': {
      'userAgent': uaString
    }
  };
  propertyReplacer.set(goog, 'global', mockGlobal);
}

function assertVersion(version) {
  assertEquals(version, goog.labs.userAgent.engine.getVersion());
}

function assertLowAndHighVersions(lowVersion, highVersion) {
  assertTrue(goog.labs.userAgent.engine.isVersionOrHigher(lowVersion));
  assertFalse(goog.labs.userAgent.engine.isVersionOrHigher(highVersion));
}

function testPresto() {
  setGlobalUAString(
      'Opera/9.80 (Windows NT 6.1; U; es-ES) Presto/2.9.181 Version/12.00');
  assertTrue(goog.labs.userAgent.engine.isPresto());
  assertVersion('2.9.181');
  assertLowAndHighVersions('2.9', '2.10');

  setGlobalUAString(
      'Opera/9.80 (Macintosh; Intel Mac OS X 10.6.8; U; fr) Presto/2.9.168' +
      ' Version/11.52');
  assertTrue(goog.labs.userAgent.engine.isPresto());
  assertVersion('2.9.168');
  assertLowAndHighVersions('2.9', '2.10');

  setGlobalUAString(
      'Opera/9.80 (X11; Linux i686; U; ru) Presto/2.8.131 Version/11.11');
  assertTrue(goog.labs.userAgent.engine.isPresto());
  assertVersion('2.8.131');
  assertLowAndHighVersions('2.8', '2.9');
}

function testTrident() {
  setGlobalUAString(
      'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; ' +
      'WOW64; Trident/6.0)');
  assertTrue(goog.labs.userAgent.engine.isTrident());
  assertVersion('6.0');
  assertLowAndHighVersions('6.0', '7.0');

  setGlobalUAString(
      'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; WOW64; ' +
      'Trident/4.0; SLCC2; Media Center PC 6.0; InfoPath.2; MS-RTC LM 8)');
  assertTrue(goog.labs.userAgent.engine.isTrident());
  assertVersion('4.0');
  assertLowAndHighVersions('4.0', '5.0');

  setGlobalUAString(
      'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)');
  assertTrue(goog.labs.userAgent.engine.isTrident());
  assertVersion('5.0');
  assertLowAndHighVersions('5.0', '6.0');

  setGlobalUAString(goog.labs.userAgent.testAgents.IE_11);
  assertTrue(goog.labs.userAgent.engine.isTrident());
  assertVersion('7.0');
  assertLowAndHighVersions('6.0', '8.0');
}

function testWebKit() {
  setGlobalUAString(
      'Mozilla/5.0 (Linux; U; Android 2.3.5; en-us; HTC Vision Build/GRI40)' +
      'AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1');
  assertTrue(goog.labs.userAgent.engine.isWebKit());
  assertVersion('533.1');
  assertLowAndHighVersions('533.0', '534.0');

  setGlobalUAString(
      'Mozilla/5.0 (Windows; U; Windows NT 6.1; en-US) ' +
      'AppleWebKit/533.4 (KHTML, like Gecko) Chrome/5.0.370.0 Safari/533.4');
  assertTrue(goog.labs.userAgent.engine.isWebKit());
  assertVersion('533.4');
  assertLowAndHighVersions('533.0', '534.0');

  setGlobalUAString(
      'Mozilla/5.0 (Windows; U; Windows NT 6.1; en-US) ' +
      'AppleWebKit/533.4 (KHTML, like Gecko) Chrome/5.0.370.0 Safari/533.4');
  assertTrue(goog.labs.userAgent.engine.isWebKit());
  assertVersion('533.4');
  assertLowAndHighVersions('533.0', '534.0');

  setGlobalUAString(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_3) AppleWebKit/534.55.3 ' +
      '(KHTML, like Gecko) Version/5.1.3 Safari/534.53.10');
  assertTrue(goog.labs.userAgent.engine.isWebKit());
  assertVersion('534.55.3');
  assertLowAndHighVersions('534.0', '535.0');

  setGlobalUAString(
      'Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.15 ' +
      '(KHTML, like Gecko) Chrome/24.0.1295.0 Safari/537.15');
  assertTrue(goog.labs.userAgent.engine.isWebKit());
  assertVersion('537.15');
  assertLowAndHighVersions('537.0', '538.0');
}

function testGecko() {
  setGlobalUAString(
      'Mozilla/5.0 (Windows NT 6.1; rv:15.0) Gecko/20120716 Firefox/15.0a2');
  assertTrue(goog.labs.userAgent.engine.isGecko());
  assertVersion('15.0a2');
  assertLowAndHighVersions('14.0', '16.0');
  // This is actually not at V15 because it is alpha 2
  assertFalse(goog.labs.userAgent.engine.isVersionOrHigher('15'));

  setGlobalUAString(
      'Mozilla/6.0 (Windows NT 6.2; WOW64; rv:16.0.1) Gecko/20121011 ' +
      'Firefox/16.0.1');
  assertTrue(goog.labs.userAgent.engine.isGecko());
  assertVersion('16.0.1');
  assertLowAndHighVersions('16.0', '17.0');

  setGlobalUAString('Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:14.0) ' +
                    'Gecko/20100101 Firefox/14.0.1');
  assertTrue(goog.labs.userAgent.engine.isGecko());
  assertVersion('14.0.1');
  assertLowAndHighVersions('14.0', '15.0');
}

