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

goog.provide('goog.net.iframeIoDifferentBaseTest');
goog.setTestOnly('goog.net.iframeIoDifferentBaseTest');

goog.require('goog.events');
goog.require('goog.net.EventType');
goog.require('goog.net.IframeIo');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.jsunit');

var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall();

function testDifferentBaseUri() {
  var io = new goog.net.IframeIo();
  goog.events.listen(io, goog.net.EventType.COMPLETE,
      function() {
        assertNotEquals('File should have expected content.',
            -1, io.getResponseText().indexOf('just a file'));
        asyncTestCase.continueTesting();
      });
  io.send('net/iframeio_different_base_test.data');
  asyncTestCase.waitForAsync('Waiting for iframeIo respons.');
}
