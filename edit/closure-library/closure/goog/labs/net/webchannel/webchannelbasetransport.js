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
 * @fileoverview Implementation of a WebChannel transport using WebChannelBase.
 *
 * When WebChannelBase is used as the underlying transport, the capabilities
 * of the WebChannel are limited to what's supported by the implementation.
 * Particularly, multiplexing is not possible, and only strings are
 * supported as message types.
 *
 */

goog.provide('goog.labs.net.webChannel.WebChannelBaseTransport');

goog.require('goog.asserts');
goog.require('goog.events.EventTarget');
goog.require('goog.labs.net.webChannel.WebChannelBase');
goog.require('goog.log');
goog.require('goog.net.WebChannel');
goog.require('goog.net.WebChannelTransport');
goog.require('goog.string.path');



/**
 * Implementation of {@link goog.net.WebChannelTransport} with
 * {@link goog.labs.net.webChannel.WebChannelBase} as the underlying channel
 * implementation.
 *
 * @constructor
 * @implements {goog.net.WebChannelTransport}
 */
goog.labs.net.webChannel.WebChannelBaseTransport = function() {};


goog.scope(function() {
var WebChannelBaseTransport = goog.labs.net.webChannel.WebChannelBaseTransport;
var WebChannelBase = goog.labs.net.webChannel.WebChannelBase;


/**
 * @override
 */
WebChannelBaseTransport.prototype.createWebChannel = function(
    url, opt_options) {
  return new WebChannelBaseTransport.Channel(url, opt_options);
};



/**
 * Implementation of the {@link goog.net.WebChannel} interface.
 *
 * @param {string} url The URL path for the new WebChannel instance.
 * @param {!goog.net.WebChannel.Options=} opt_options Configuration for the
 *     new WebChannel instance.
 *
 * @constructor
 * @implements {goog.net.WebChannel}
 * @extends {goog.events.EventTarget}
 */
WebChannelBaseTransport.Channel = function(url, opt_options) {
  goog.base(this);

  /**
   * The underlying channel object.
   *
   * @type {!WebChannelBase}
   * @private
   */
  this.channel_ = new WebChannelBase();

  /**
   * The URL of the target server end-point.
   *
   * @type {string}
   * @private
   */
  this.url_ = url;

  /**
   * The channel options.
   *
   * @type {?goog.net.WebChannel.Options}
   * @private
   */
  this.options_ = opt_options || null;

  /**
   * The logger for this class.
   * @type {goog.log.Logger}
   * @private
   */
  this.logger_ = goog.log.getLogger(
      'goog.labs.net.webChannel.WebChannelBaseTransport');

};
goog.inherits(WebChannelBaseTransport.Channel, goog.events.EventTarget);


/**
 * The channel handler.
 *
 * @type {WebChannelBase.Handler}
 * @private
 */
WebChannelBaseTransport.Channel.prototype.channelHandler_ = null;


/**
 * Test path is always set to "/url/test".
 *
 * TODO(user): The test path may be made configurable via the options.
 *
 * @override
 */
WebChannelBaseTransport.Channel.prototype.open = function() {
  var testUrl = goog.string.path.join(this.url_, 'test');
  this.channel_.connect(testUrl, this.url_);

  this.channelHandler_ = new WebChannelBaseTransport.Channel.Handler_(this);
  this.channel_.setHandler(this.channelHandler_);
};


/**
 * @override
 */
WebChannelBaseTransport.Channel.prototype.close = function() {
  this.channel_.disconnect();
};


/**
 * The WebChannelBase only supports object types.
 *
 * @param {!goog.net.WebChannel.MessageData} message The message to send.
 * @override
 */
WebChannelBaseTransport.Channel.prototype.send = function(message) {
  goog.asserts.assert(goog.isObject(message), 'only object type expected');
  this.channel_.sendMap(message);
};


/**
 * @override
 */
WebChannelBaseTransport.Channel.prototype.disposeInternal = function() {
  this.channel_.setHandler(null);
  delete this.channelHandler_;
  this.channel_.disconnect();
  delete this.channel_;

  goog.base(this, 'disposeInternal');
};



/**
 * The message event.
 *
 * @param {!Array} array The data array from the underlying channel.
 * @constructor
 * @extends {goog.net.WebChannel.MessageEvent}
 */
WebChannelBaseTransport.Channel.MessageEvent = function(array) {
  goog.base(this);

  this.data = array;
};
goog.inherits(WebChannelBaseTransport.Channel.MessageEvent,
              goog.net.WebChannel.MessageEvent);



/**
 * The error event.
 *
 * @param {WebChannelBase.Error} error The error code.
 * @constructor
 * @extends {goog.net.WebChannel.ErrorEvent}
 */
WebChannelBaseTransport.Channel.ErrorEvent = function(error) {
  goog.base(this);

  /**
   * Transport specific error code is not to be propagated with the event.
   */
  this.status = goog.net.WebChannel.ErrorStatus.NETWORK_ERROR;
};
goog.inherits(WebChannelBaseTransport.Channel.ErrorEvent,
              goog.net.WebChannel.ErrorEvent);



/**
 * Implementation of the {@link WebChannelBase.Handler} interface.
 *
 * @param {!WebChannelBaseTransport.Channel} channel The enclosing WebChannel.
 *
 * @constructor
 * @extends {WebChannelBase.Handler}
 * @private
 */
WebChannelBaseTransport.Channel.Handler_ = function(channel) {
  goog.base(this);

  /**
   * @type {!WebChannelBaseTransport.Channel}
   * @private
   */
  this.channel_ = channel;
};
goog.inherits(WebChannelBaseTransport.Channel.Handler_, WebChannelBase.Handler);


/**
 * @override
 */
WebChannelBaseTransport.Channel.Handler_.prototype.channelOpened = function(
    channel) {
  goog.log.info(this.channel_.logger_,
      'WebChannel opened on ' + this.channel_.url_);
  this.channel_.dispatchEvent(goog.net.WebChannel.EventType.OPEN);
};


/**
 * @override
 */
WebChannelBaseTransport.Channel.Handler_.prototype.channelHandleArray =
    function(channel, array) {
  goog.asserts.assert(array, 'array expected to be defined');
  this.channel_.dispatchEvent(
      new WebChannelBaseTransport.Channel.MessageEvent(array));
};


/**
 * @override
 */
WebChannelBaseTransport.Channel.Handler_.prototype.channelError = function(
    channel, error) {
  goog.log.info(this.channel_.logger_,
      'WebChannel aborted on ' + this.channel_.url_ +
      ' due to channel error: ' + error);
  this.channel_.dispatchEvent(
      new WebChannelBaseTransport.Channel.ErrorEvent(error));
};


/**
 * @override
 */
WebChannelBaseTransport.Channel.Handler_.prototype.channelClosed = function(
    channel, opt_pendingMaps, opt_undeliveredMaps) {
  goog.log.info(this.channel_.logger_,
      'WebChannel closed on ' + this.channel_.url_);
  this.channel_.dispatchEvent(goog.net.WebChannel.EventType.CLOSE);
};
});  // goog.scope
