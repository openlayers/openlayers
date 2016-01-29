goog.provide('ol.events.EventTarget');

goog.require('goog.Disposable');
goog.require('ol.events');
goog.require('ol.events.Event');

/**
 * @constructor
 * @extends {goog.Disposable}
 */
ol.events.EventTarget = function() {

  goog.base(this);

  /**
   * @private
   * @type {!Object.<string, Array.<ol.events.ListenerFunctionType>>}
   */
  this.listeners_ = {};

};
goog.inherits(ol.events.EventTarget, goog.Disposable);


/**
 * @param {ol.events.EventType|string} type Type.
 * @param {ol.events.ListenerFunctionType} listener Listener.
 * @param {boolean=} opt_capture Call listener before already registered
 *     listeners. Default is false.
 */
ol.events.EventTarget.prototype.addEventListener = function(type, listener, opt_capture) {
  var listeners = this.listeners_[type];
  if (!listeners) {
    listeners = this.listeners_[type] = [];
  }
  if (listeners.indexOf(listener) === -1) {
    if (opt_capture) {
      listeners.push(listener);
    } else {
      listeners.unshift(listener);
    }
  }
};


/**
 * @param {{type: (ol.events.EventType|string),
 *     target: (EventTarget|ol.events.EventTarget|undefined)}|ol.events.Event|
 *     ol.events.EventType|string} event Event or event type.
 * @return {boolean|undefined} `false` if anyone called preventDefault on the
 *     event object or if any of the listeners returned false.
 */
ol.events.EventTarget.prototype.dispatchEvent = function(event) {
  var evt = goog.isString(event) ? new ol.events.Event(event) : event;
  var type = evt.type;
  evt.target = this;
  var listeners = this.listeners_[type];
  if (listeners) {
    for (var i = listeners.length - 1; i >= 0; --i) {
      if (listeners[i].call(this, evt) === false || evt.propagationStopped) {
        return false;
      }
    }
  }
};


/**
 * @inheritDoc
 */
ol.events.EventTarget.prototype.disposeInternal = function() {
  ol.events.unlistenAll(this);
  goog.base(this, 'disposeInternal');
};


/**
 * @param {ol.events.EventType|string} type Type.
 * @return {Array.<ol.events.ListenerFunctionType>} Listeners.
 */
ol.events.EventTarget.prototype.getListeners = function(type) {
  return this.listeners_[type];
};


/**
 * @param {(ol.events.EventType|string)=} opt_type Type. If not provided,
 *     `true` will be returned if this EventTarget has any listeners.
 * @return {boolean} Has listeners.
 */
ol.events.EventTarget.prototype.hasListener = function(opt_type) {
  return opt_type ?
      opt_type in this.listeners_ :
      Object.keys(this.listeners_).length > 0;
};


/**
 * @param {ol.events.EventType|string} type Type.
 * @param {ol.events.ListenerFunctionType} listener Listener.
 * @param {boolean=} opt_capture Call listener before already registered
 *     listeners. Default is false.
 */
ol.events.EventTarget.prototype.removeEventListener = function(type, listener, opt_capture) {
  var listeners = this.listeners_[type];
  if (listeners) {
    var index = listeners.indexOf(listener);
    listeners.splice(index, 1);
    if (listeners.length === 0) {
      delete this.listeners_[type];
    }
  }
};
