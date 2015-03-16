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
 * @fileoverview Tests the direct transport.
 */

goog.provide('goog.net.xpc.DirectTransportTest');

goog.require('goog.dom');
goog.require('goog.labs.userAgent.browser');
goog.require('goog.log');
goog.require('goog.log.Level');
goog.require('goog.net.xpc');
goog.require('goog.net.xpc.CfgFields');
goog.require('goog.net.xpc.CrossPageChannel');
goog.require('goog.net.xpc.CrossPageChannelRole');
goog.require('goog.net.xpc.TransportTypes');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.jsunit');
goog.setTestOnly('goog.net.xpc.DirectTransportTest');

var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall(
    'Direct transport tests.');


/**
 * Echo service name.
 * @type {string}
 * @const
 */
var ECHO_SERVICE_NAME = 'echo';


/**
 * Response service name.
 * @type {string}
 * @const
 */
var RESPONSE_SERVICE_NAME = 'response';


/**
 * Test Payload.
 * @type {string}
 * @const
 */
var MESSAGE_PAYLOAD_1 = 'This is message payload 1.';


/**
 * The name id of the peer iframe.
 * @type {string}
 * @const
 */
var PEER_IFRAME_ID = 'peer-iframe';


// Class aliases.
var CfgFields;
var CrossPageChannel;
var CrossPageChannelRole;
var TransportTypes;

var outerXpc;
var innerXpc;
var peerIframe;
var channelName;
var messageIsSync = false;

function setUpPage() {
  CfgFields = goog.net.xpc.CfgFields;
  CrossPageChannel = goog.net.xpc.CrossPageChannel;
  CrossPageChannelRole = goog.net.xpc.CrossPageChannelRole;
  TransportTypes = goog.net.xpc.TransportTypes;

  // Show debug log
  var debugDiv = document.createElement('debugDiv');
  document.body.appendChild(debugDiv);
  var logger = goog.log.getLogger('goog.net.xpc');
  logger.setLevel(goog.log.Level.ALL);
  goog.log.addHandler(logger, function(logRecord) {
    var msgElm = goog.dom.createDom('div');
    msgElm.innerHTML = logRecord.getMessage();
    goog.dom.appendChild(debugDiv, msgElm);
  });
}


function tearDown() {
  if (peerIframe) {
    document.body.removeChild(peerIframe);
    peerIframe = null;
  }
  if (outerXpc) {
    outerXpc.dispose();
    outerXpc = null;
  }
  if (innerXpc) {
    innerXpc.dispose();
    innerXpc = null;
  }
  window.iframeLoadHandler = null;
  channelName = null;
  messageIsSync = false;
}


function createIframe() {
  peerIframe = document.createElement('iframe');
  peerIframe.id = PEER_IFRAME_ID;
  document.body.insertBefore(peerIframe, document.body.firstChild);
}


/**
 * Tests 2 same domain frames using direct transport.
 */
function testDirectTransport() {
  // This test has been flaky on IE 8-11 on Win7.
  // For now, disable.
  // Flakiness is tracked in http://b/18595666
  if (goog.labs.userAgent.browser.isIE()) {
    return;
  }

  createIframe();
  channelName = goog.net.xpc.getRandomString(10);
  outerXpc = new CrossPageChannel(
      getConfiguration(CrossPageChannelRole.OUTER, PEER_IFRAME_ID));
  // Outgoing service.
  outerXpc.registerService(ECHO_SERVICE_NAME, goog.nullFunction);
  // Incoming service.
  outerXpc.registerService(
      RESPONSE_SERVICE_NAME,
      responseMessageHandler_testDirectTransport);
  asyncTestCase.waitForAsync('Waiting for xpc connect.');
  outerXpc.connect(onConnect_testDirectTransport);
  // inner_peer.html calls this method at end of html.
  window.iframeLoadHandler = onIframeLoaded_testDirectTransport;
  peerIframe.src = 'testdata/inner_peer.html';
}


function onIframeLoaded_testDirectTransport() {
  peerIframe.contentWindow.instantiateChannel(
      getConfiguration(CrossPageChannelRole.INNER));
}


function onConnect_testDirectTransport() {
  assertTrue('XPC over direct channel is connected', outerXpc.isConnected());
  outerXpc.send(ECHO_SERVICE_NAME, MESSAGE_PAYLOAD_1);
}


function responseMessageHandler_testDirectTransport(message) {
  assertEquals(
      'Received payload is equal to sent payload.',
      message,
      MESSAGE_PAYLOAD_1);
  asyncTestCase.continueTesting();
}


/**
 * Tests 2 xpc's communicating with each other in the same window.
 */
function testSameWindowDirectTransport() {
  channelName = goog.net.xpc.getRandomString(10);

  outerXpc = new CrossPageChannel(getConfiguration(CrossPageChannelRole.OUTER));
  outerXpc.setPeerWindowObject(self);

  // Outgoing service.
  outerXpc.registerService(ECHO_SERVICE_NAME, goog.nullFunction);
  // Incoming service.
  outerXpc.registerService(
      RESPONSE_SERVICE_NAME,
      outerResponseMessageHandler_testSameWindowDirectTransport);
  asyncTestCase.waitForAsync('Waiting for outer xpc connect.');
  outerXpc.connect(onOuterConnect_testSameWindowDirectTransport);

  innerXpc = new CrossPageChannel(getConfiguration(CrossPageChannelRole.INNER));
  innerXpc.setPeerWindowObject(self);
  // Incoming service.
  innerXpc.registerService(
      ECHO_SERVICE_NAME,
      innerEchoMessageHandler_testSameWindowDirectTransport);
  // Outgoing service.
  innerXpc.registerService(
      RESPONSE_SERVICE_NAME,
      goog.nullFunction);
  innerXpc.connect();
}


function onOuterConnect_testSameWindowDirectTransport() {
  assertTrue(
      'XPC over direct channel, same window, is connected',
      outerXpc.isConnected());
  outerXpc.send(ECHO_SERVICE_NAME, MESSAGE_PAYLOAD_1);
}


function outerResponseMessageHandler_testSameWindowDirectTransport(message) {
  assertEquals(
      'Received payload is equal to sent payload.',
      message,
      MESSAGE_PAYLOAD_1);
  asyncTestCase.continueTesting();
}


function innerEchoMessageHandler_testSameWindowDirectTransport(message) {
  innerXpc.send(RESPONSE_SERVICE_NAME, message);
}


function getConfiguration(role, opt_peerFrameId) {
  var cfg = {};
  cfg[CfgFields.TRANSPORT] = TransportTypes.DIRECT;
  if (goog.isDefAndNotNull(opt_peerFrameId)) {
    cfg[CfgFields.IFRAME_ID] = opt_peerFrameId;
  }
  cfg[CfgFields.CHANNEL_NAME] = channelName;
  cfg[CfgFields.ROLE] = role;
  return cfg;
}


/**
 * Tests 2 same domain frames using direct transport using sync mode.
 */
function testSyncMode() {
  createIframe();
  channelName = goog.net.xpc.getRandomString(10);

  var cfg = getConfiguration(CrossPageChannelRole.OUTER, PEER_IFRAME_ID);
  cfg[CfgFields.DIRECT_TRANSPORT_SYNC_MODE] = true;

  outerXpc = new CrossPageChannel(cfg);
  // Outgoing service.
  outerXpc.registerService(ECHO_SERVICE_NAME, goog.nullFunction);
  // Incoming service.
  outerXpc.registerService(
      RESPONSE_SERVICE_NAME,
      responseMessageHandler_testSyncMode);
  asyncTestCase.waitForAsync('Waiting for xpc connect.');
  outerXpc.connect(onConnect_testSyncMode);
  // inner_peer.html calls this method at end of html.
  window.iframeLoadHandler = onIframeLoaded_testSyncMode;
  peerIframe.src = 'testdata/inner_peer.html';
}


function onIframeLoaded_testSyncMode() {
  var cfg = getConfiguration(CrossPageChannelRole.INNER);
  cfg[CfgFields.DIRECT_TRANSPORT_SYNC_MODE] = true;
  peerIframe.contentWindow.instantiateChannel(cfg);
}


function onConnect_testSyncMode() {
  assertTrue('XPC over direct channel is connected', outerXpc.isConnected());
  messageIsSync = true;
  outerXpc.send(ECHO_SERVICE_NAME, MESSAGE_PAYLOAD_1);
  messageIsSync = false;
}


function responseMessageHandler_testSyncMode(message) {
  assertTrue('The message response was syncronous', messageIsSync);
  assertEquals(
      'Received payload is equal to sent payload.',
      message,
      MESSAGE_PAYLOAD_1);
  asyncTestCase.continueTesting();
}
