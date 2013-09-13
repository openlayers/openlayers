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
 * @fileoverview Unit tests for goog.labs.userAgent.platform.
 */

goog.provide('goog.labs.userAgent.platformTest');

goog.require('goog.labs.userAgent.platform');
goog.require('goog.labs.userAgent.testAgents');
goog.require('goog.testing.PropertyReplacer');
goog.require('goog.testing.jsunit');

goog.setTestOnly('goog.labs.userAgent.platformTest');

var propertyReplacer = new goog.testing.PropertyReplacer();

function setUp() {
  // disable memoization
  propertyReplacer.set(goog.memoize, 'ENABLE_MEMOIZE', false);
}

function tearDown() {
  propertyReplacer.reset();
}

function setGlobalUAString(uaString, platform, appVersion) {
  var mockGlobal = {
    'navigator': {
      'userAgent': uaString,
      'platform': platform,
      'appVersion': appVersion
    }
  };
  propertyReplacer.set(goog, 'global', mockGlobal);
}

function testAndroid() {
  var uaString = goog.labs.userAgent.testAgents.ANDROID_BROWSER_233;

  setGlobalUAString(uaString);
  assertTrue(goog.labs.userAgent.platform.isAndroid());
  assertVersion('2.3.3');
  assertVersionBetween('2.3.0', '2.3.5');
  assertVersionBetween('2.3', '2.4');
  assertVersionBetween('2', '3');

  uaString = goog.labs.userAgent.testAgents.ANDROID_BROWSER_221;

  setGlobalUAString(uaString);
  assertTrue(goog.labs.userAgent.platform.isAndroid());
  assertVersion('2.2.1');
  assertVersionBetween('2.2.0', '2.2.5');
  assertVersionBetween('2.2', '2.3');
  assertVersionBetween('2', '3');

  uaString = goog.labs.userAgent.testAgents.CHROME_ANDROID;

  setGlobalUAString(uaString);
  assertTrue(goog.labs.userAgent.platform.isAndroid());
  assertVersion('4.0.2');
  assertVersionBetween('4.0.0', '4.1.0');
  assertVersionBetween('4.0', '4.1');
  assertVersionBetween('4', '5');
}

function testIpod() {
  var uaString = goog.labs.userAgent.testAgents.SAFARI_IPOD;

  setGlobalUAString(uaString);
  assertTrue(goog.labs.userAgent.platform.isIpod());
  assertTrue(goog.labs.userAgent.platform.isIos());
  assertVersion('');
}

function testIphone() {
  var uaString = goog.labs.userAgent.testAgents.SAFARI_IPHONE;
  setGlobalUAString(uaString);
  assertTrue(goog.labs.userAgent.platform.isIphone());
  assertTrue(goog.labs.userAgent.platform.isIos());
  assertVersion('4.2.1');
  assertVersionBetween('4', '5');
  assertVersionBetween('4.2', '4.3');

  uaString = goog.labs.userAgent.testAgents.IPHONE_6;
  setGlobalUAString(uaString);
  assertTrue(goog.labs.userAgent.platform.isIphone());
  assertTrue(goog.labs.userAgent.platform.isIos());
  assertVersion('6.0');
  assertVersionBetween('5', '7');

  uaString = goog.labs.userAgent.testAgents.SAFARI_IPHONE_32;
  setGlobalUAString(uaString);
  assertTrue(goog.labs.userAgent.platform.isIphone());
  assertTrue(goog.labs.userAgent.platform.isIos());
  assertVersion('3.2');
  assertVersionBetween('3', '4');
}

function testIpad() {
  var uaString = goog.labs.userAgent.testAgents.IPAD_4;

  setGlobalUAString(uaString);
  assertTrue(goog.labs.userAgent.platform.isIpad());
  assertTrue(goog.labs.userAgent.platform.isIos());
  assertVersion('3.2');
  assertVersionBetween('3', '4');
  assertVersionBetween('3.1', '4');

  uaString = goog.labs.userAgent.testAgents.IPAD_5;

  setGlobalUAString(uaString);
  assertTrue(goog.labs.userAgent.platform.isIpad());
  assertTrue(goog.labs.userAgent.platform.isIos());
  assertVersion('5.1');
  assertVersionBetween('5', '6');

  uaString = goog.labs.userAgent.testAgents.IPAD_6;

  setGlobalUAString(uaString);
  assertTrue(goog.labs.userAgent.platform.isIpad());
  assertTrue(goog.labs.userAgent.platform.isIos());
  assertVersion('6.0');
  assertVersionBetween('5', '7');
}

function testMac() {
  var uaString = goog.labs.userAgent.testAgents.CHROME_MAC;
  var platform = 'IntelMac';
  setGlobalUAString(uaString, platform);
  assertTrue(goog.labs.userAgent.platform.isMac());
  assertVersion('10.8.2');
  assertVersionBetween('10', '11');
  assertVersionBetween('10.8', '10.9');
  assertVersionBetween('10.8.1', '10.8.3');

  uaString = goog.labs.userAgent.testAgents.OPERA_MAC;
  setGlobalUAString(uaString, platform);
  assertTrue(goog.labs.userAgent.platform.isMac());
  assertVersion('10.6.8');
  assertVersionBetween('10', '11');
  assertVersionBetween('10.6', '10.7');
  assertVersionBetween('10.6.5', '10.7.0');

  uaString = goog.labs.userAgent.testAgents.SAFARI_MAC;
  setGlobalUAString(uaString, platform);
  assertTrue(goog.labs.userAgent.platform.isMac());
  assertVersionBetween('10', '11');
  assertVersionBetween('10.6', '10.7');
  assertVersionBetween('10.6.5', '10.7.0');

  uaString = goog.labs.userAgent.testAgents.FIREFOX_MAC;
  setGlobalUAString(uaString, platform);
  assertTrue(goog.labs.userAgent.platform.isMac());
  assertVersion('11.7.9');
  assertVersionBetween('11', '12');
  assertVersionBetween('11.7', '11.8');
  assertVersionBetween('11.7.9', '11.8.0');
}

function testLinux() {
  var uaString = goog.labs.userAgent.testAgents.FIREFOX_LINUX;
  var platform = 'Linux';
  setGlobalUAString(uaString, platform);
  assertTrue(goog.labs.userAgent.platform.isLinux());
  assertVersion('');

  uaString = goog.labs.userAgent.testAgents.CHROME_LINUX;
  setGlobalUAString(uaString, platform);
  assertTrue(goog.labs.userAgent.platform.isLinux());
  assertVersion('');

  uaString = goog.labs.userAgent.testAgents.OPERA_LINUX;
  setGlobalUAString(uaString, platform);
  assertTrue(goog.labs.userAgent.platform.isLinux());
  assertVersion('');
}

function testWindows() {
  var uaString = goog.labs.userAgent.testAgents.SAFARI_WINDOWS;
  var platform = 'Win32';
  setGlobalUAString(uaString, platform);
  assertTrue(goog.labs.userAgent.platform.isWindows());
  assertVersion('6.1');
  assertVersionBetween('6', '7');

  uaString = goog.labs.userAgent.testAgents.IE_10;
  setGlobalUAString(uaString, platform);
  assertTrue(goog.labs.userAgent.platform.isWindows());
  assertVersion('6.1');
  assertVersionBetween('6', '6.5');

  uaString = goog.labs.userAgent.testAgents.CHROME_25;
  setGlobalUAString(uaString, platform);
  assertTrue(goog.labs.userAgent.platform.isWindows());
  assertVersion('5.1');
  assertVersionBetween('5', '6');

  uaString = goog.labs.userAgent.testAgents.FIREFOX_WINDOWS;
  setGlobalUAString(uaString, platform);
  assertTrue(goog.labs.userAgent.platform.isWindows());
  assertVersion('6.1');
  assertVersionBetween('6', '7');

  uaString = goog.labs.userAgent.testAgents.IE_11;
  setGlobalUAString(uaString, platform);
  assertTrue(goog.labs.userAgent.platform.isWindows());
  assertVersion('6.3');
  assertVersionBetween('6', '6.5');
}

function testX11() {
  var uaString = goog.labs.userAgent.testAgents.CHROME_LINUX;
  var platform = 'Linux';
  var appVersion = goog.labs.userAgent.testAgents.CHROME_LINUX_APPVERVERSION;
  setGlobalUAString(uaString, platform, appVersion);
  assertTrue(goog.labs.userAgent.platform.isX11());
  assertVersion('');
}

function testChromeOS() {
  var uaString = goog.labs.userAgent.testAgents.CHROME_OS_910;

  setGlobalUAString(uaString);
  assertTrue(goog.labs.userAgent.platform.isChromeOS());
  assertVersion('9.10.0');
  assertVersionBetween('9', '10');

  uaString = goog.labs.userAgent.testAgents.CHROME_OS;

  setGlobalUAString(uaString);
  assertTrue(goog.labs.userAgent.platform.isChromeOS());
  assertVersion('3701.62.0');
  assertVersionBetween('3701', '3702');
}

function assertVersion(version) {
  assertEquals(version, goog.labs.userAgent.platform.getVersion());
}

function assertVersionBetween(lowVersion, highVersion) {
  assertTrue(goog.labs.userAgent.platform.isVersionOrHigher(lowVersion));
  assertFalse(goog.labs.userAgent.platform.isVersionOrHigher(highVersion));
}
