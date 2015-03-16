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

goog.provide('goog.dom.safeTest');
goog.setTestOnly('goog.dom.safeTest');

goog.require('goog.dom.safe');
goog.require('goog.html.SafeUrl');
goog.require('goog.html.testing');
goog.require('goog.string.Const');
goog.require('goog.testing.jsunit');

function testSetInnerHtml() {
  var mockElement = {
    'innerHTML': 'blarg'
  };
  var html = '<script>somethingTrusted();<' + '/script>';
  var safeHtml = goog.html.testing.newSafeHtmlForTest(html);
  goog.dom.safe.setInnerHtml(mockElement, safeHtml);
  assertEquals(html, mockElement.innerHTML);
}


function testDocumentWrite() {
  var mockDoc = {
    'html': null,
    'write': function(html) {
      this['html'] = html;
    }
  };
  var html = '<script>somethingTrusted();<' + '/script>';
  var safeHtml = goog.html.testing.newSafeHtmlForTest(html);
  goog.dom.safe.documentWrite(mockDoc, safeHtml);
  assertEquals(html, mockDoc.html);
}


function testSetLocationHref() {
  var mockLoc = {
    'href': 'blarg'
  };
  goog.dom.safe.setLocationHref(mockLoc, 'javascript:evil();');
  assertEquals('about:invalid#zClosurez', mockLoc.href);

  mockLoc = {
    'href': 'blarg'
  };
  var safeUrl = goog.html.SafeUrl.fromConstant(
      goog.string.Const.from('javascript:trusted();'));
  goog.dom.safe.setLocationHref(mockLoc, safeUrl);
  assertEquals('javascript:trusted();', mockLoc.href);
}


function testSetAnchorHref() {
  var mockAnchor = {
    'href': 'blarg'
  };
  goog.dom.safe.setAnchorHref(mockAnchor, 'javascript:evil();');
  assertEquals('about:invalid#zClosurez', mockAnchor.href);

  mockAnchor = {
    'href': 'blarg'
  };
  var safeUrl = goog.html.SafeUrl.fromConstant(
      goog.string.Const.from('javascript:trusted();'));
  goog.dom.safe.setAnchorHref(mockAnchor, safeUrl);
  assertEquals('javascript:trusted();', mockAnchor.href);
}
