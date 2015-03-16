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
goog.require('goog.labs.userAgent.util');
goog.require('goog.testing.jsunit');

goog.setTestOnly('goog.labs.userAgent.browserTest');

function setUp() {
  goog.labs.userAgent.util.setUserAgent(null);
}

function testOpera10() {
  goog.labs.userAgent.util.setUserAgent(
      goog.labs.userAgent.testAgents.OPERA_10);
  assertTrue(goog.labs.userAgent.browser.isOpera());
  assertVersion('10.00');
  assertVersionBetween('10.00', '10.10');
}

function testOperaMac() {
  goog.labs.userAgent.util.setUserAgent(
      goog.labs.userAgent.testAgents.OPERA_MAC);
  assertTrue(goog.labs.userAgent.browser.isOpera());
  assertVersion('11.52');
  assertVersionBetween('11.50', '12.00');
}

function testOperaLinux() {
  goog.labs.userAgent.util.setUserAgent(
      goog.labs.userAgent.testAgents.OPERA_LINUX);
  assertTrue(goog.labs.userAgent.browser.isOpera());
  assertVersion('11.50');
  assertVersionBetween('11.00', '12.00');
}

function testOpera15() {
  goog.labs.userAgent.util.setUserAgent(
      goog.labs.userAgent.testAgents.OPERA_15);
  assertTrue(goog.labs.userAgent.browser.isOpera());
  assertVersion('15.0.1147.100');
  assertVersionBetween('15.00', '16.00');
}

function testIE6() {
  goog.labs.userAgent.util.setUserAgent(goog.labs.userAgent.testAgents.IE_6);
  assertTrue(goog.labs.userAgent.browser.isIE());
  assertVersion('6.0');
  assertVersionBetween('5.0', '7.0');
}

function testIE7() {
  goog.labs.userAgent.util.setUserAgent(goog.labs.userAgent.testAgents.IE_7);
  assertTrue(goog.labs.userAgent.browser.isIE());
  assertVersion('7.0');
}

function testIE8() {
  goog.labs.userAgent.util.setUserAgent(goog.labs.userAgent.testAgents.IE_8);
  assertTrue(goog.labs.userAgent.browser.isIE());
  assertVersion('8.0');
  assertVersionBetween('7.0', '9.0');
}

function testIE8Compatibility() {
  goog.labs.userAgent.util.setUserAgent(
      goog.labs.userAgent.testAgents.IE_8_COMPATIBILITY);
  assertTrue(goog.labs.userAgent.browser.isIE());
  assertVersion('8.0');
}

function testIE9() {
  goog.labs.userAgent.util.setUserAgent(goog.labs.userAgent.testAgents.IE_9);
  assertTrue(goog.labs.userAgent.browser.isIE());
  assertVersion('9.0');
  assertVersionBetween('8.0', '10.0');
}

function testIE9Compatibility() {
  goog.labs.userAgent.util.setUserAgent(
      goog.labs.userAgent.testAgents.IE_9_COMPATIBILITY);
  assertTrue(goog.labs.userAgent.browser.isIE());
  assertVersion('9.0');
}

function testIE10() {
  goog.labs.userAgent.util.setUserAgent(goog.labs.userAgent.testAgents.IE_10);
  assertTrue(goog.labs.userAgent.browser.isIE());
  assertVersion('10.0');
  assertVersionBetween('10.0', '11.0');
}

function testIE10Compatibility() {
  goog.labs.userAgent.util.setUserAgent(
      goog.labs.userAgent.testAgents.IE_10_COMPATIBILITY);
  assertTrue(goog.labs.userAgent.browser.isIE());
  assertVersion('10.0');
}

function testIE10Mobile() {
  goog.labs.userAgent.util.setUserAgent(
      goog.labs.userAgent.testAgents.IE_10_MOBILE);
  assertTrue(goog.labs.userAgent.browser.isIE());
  assertVersion('10.0');
}

function testIE11() {
  goog.labs.userAgent.util.setUserAgent(goog.labs.userAgent.testAgents.IE_11);
  assertTrue(goog.labs.userAgent.browser.isIE());
  assertVersion('11.0');
  assertVersionBetween('10.0', '12.0');
}

function testIE11CompatibilityMSIE7() {
  goog.labs.userAgent.util.setUserAgent(
      goog.labs.userAgent.testAgents.IE_11_COMPATIBILITY_MSIE_7);
  assertTrue(goog.labs.userAgent.browser.isIE());
  assertVersion('11.0');
}

function testIE11CompatibilityMSIE9() {
  goog.labs.userAgent.util.setUserAgent(
      goog.labs.userAgent.testAgents.IE_11_COMPATIBILITY_MSIE_9);
  assertTrue(goog.labs.userAgent.browser.isIE());
  assertVersion('11.0');
}

function testFirefox19() {
  goog.labs.userAgent.util.setUserAgent(
      goog.labs.userAgent.testAgents.FIREFOX_19);
  assertTrue(goog.labs.userAgent.browser.isFirefox());
  assertVersion('19.0');
  assertVersionBetween('18.0', '20.0');
}

function testFirefoxWindows() {
  goog.labs.userAgent.util.setUserAgent(
      goog.labs.userAgent.testAgents.FIREFOX_WINDOWS);
  assertTrue(goog.labs.userAgent.browser.isFirefox());
  assertVersion('14.0.1');
  assertVersionBetween('14.0', '15.0');
}

function testFirefoxLinux() {
  goog.labs.userAgent.util.setUserAgent(
      goog.labs.userAgent.testAgents.FIREFOX_LINUX);
  assertTrue(goog.labs.userAgent.browser.isFirefox());
  assertVersion('15.0.1');
}

function testChromeAndroid() {
  goog.labs.userAgent.util.setUserAgent(
      goog.labs.userAgent.testAgents.CHROME_ANDROID);
  assertTrue(goog.labs.userAgent.browser.isChrome());
  assertVersion('18.0.1025.133');
  assertVersionBetween('18.0', '19.0');
  assertVersionBetween('17.0', '18.1');
}

function testChromeIphone() {
  goog.labs.userAgent.util.setUserAgent(
      goog.labs.userAgent.testAgents.CHROME_IPHONE);
  assertTrue(goog.labs.userAgent.browser.isChrome());
  assertVersion('22.0.1194.0');
  assertVersionBetween('22.0', '23.0');
  assertVersionBetween('22.0', '22.10');
}

function testChromeMac() {
  goog.labs.userAgent.util.setUserAgent(
      goog.labs.userAgent.testAgents.CHROME_MAC);
  assertTrue(goog.labs.userAgent.browser.isChrome());
  assertVersion('24.0.1309.0');
  assertVersionBetween('24.0', '25.0');
  assertVersionBetween('24.0', '24.10');
}

function testSafariIpad() {
  goog.labs.userAgent.util.setUserAgent(goog.labs.userAgent.testAgents.IPAD_6);
  assertTrue(goog.labs.userAgent.browser.isSafari());
  assertVersion('6.0');
  assertVersionBetween('5.1', '7.0');
}

function testSafari6() {
  goog.labs.userAgent.util.setUserAgent(
      goog.labs.userAgent.testAgents.SAFARI_6);
  assertTrue(goog.labs.userAgent.browser.isSafari());
  assertVersion('6.0');
  assertVersionBetween('6.0', '7.0');
}

function testSafariIphone() {
  goog.labs.userAgent.util.setUserAgent(
      goog.labs.userAgent.testAgents.SAFARI_IPHONE_6);
  assertTrue(goog.labs.userAgent.browser.isSafari());
  assertVersion('6.0');
  assertVersionBetween('5.0', '7.0');
}

function testCoast() {
  goog.labs.userAgent.util.setUserAgent(
      goog.labs.userAgent.testAgents.COAST);
  assertTrue(goog.labs.userAgent.browser.isCoast());
}

function testWebviewIOS() {
  goog.labs.userAgent.util.setUserAgent(
      goog.labs.userAgent.testAgents.WEBVIEW_IPHONE);
  assertTrue(goog.labs.userAgent.browser.isIosWebview());
  goog.labs.userAgent.util.setUserAgent(
      goog.labs.userAgent.testAgents.WEBVIEW_IPAD);
  assertTrue(goog.labs.userAgent.browser.isIosWebview());
}

function testAndroidBrowser235() {
  goog.labs.userAgent.util.setUserAgent(
      goog.labs.userAgent.testAgents.ANDROID_BROWSER_235);
  assertTrue(goog.labs.userAgent.browser.isAndroidBrowser());
  assertVersion('4.0');
  assertVersionBetween('3.0', '5.0');
}

function testAndroidBrowser403() {
  goog.labs.userAgent.util.setUserAgent(
      goog.labs.userAgent.testAgents.ANDROID_BROWSER_403);
  assertTrue(goog.labs.userAgent.browser.isAndroidBrowser());
  assertVersion('4.0');
  assertVersionBetween('3.0', '5.0');
}

function testAndroidBrowser233() {
  goog.labs.userAgent.util.setUserAgent(
      goog.labs.userAgent.testAgents.ANDROID_BROWSER_233);
  assertTrue(goog.labs.userAgent.browser.isAndroidBrowser());
  assertVersion('4.0');
  assertVersionBetween('3.0', '5.0');
}

function testAndroidWebView411() {
  goog.labs.userAgent.util.setUserAgent(
      goog.labs.userAgent.testAgents.ANDROID_WEB_VIEW_4_1_1);
  assertFalse(goog.labs.userAgent.browser.isChrome());
  assertTrue(goog.labs.userAgent.browser.isAndroidBrowser());
  assertVersion('4.0');
  assertVersionBetween('3.0', '5.0');
}

function testAndroidWebView44() {
  goog.labs.userAgent.util.setUserAgent(
      goog.labs.userAgent.testAgents.ANDROID_WEB_VIEW_4_4);
  assertTrue(goog.labs.userAgent.browser.isChrome());
  assertFalse(goog.labs.userAgent.browser.isAndroidBrowser());
  assertVersion('30.0.0.0');
  assertVersionBetween('29.0', '31.0');
}

function testSilk() {
  goog.labs.userAgent.util.setUserAgent(
      goog.labs.userAgent.testAgents.KINDLE_FIRE);
  assertTrue(goog.labs.userAgent.browser.isSilk());
  assertVersion('2.1');
}

function assertVersion(version) {
  assertEquals(version, goog.labs.userAgent.browser.getVersion());
}

function assertVersionBetween(lowVersion, highVersion) {
  assertTrue(goog.labs.userAgent.browser.isVersionOrHigher(lowVersion));
  assertFalse(goog.labs.userAgent.browser.isVersionOrHigher(highVersion));
}
