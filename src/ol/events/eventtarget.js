goog.provide('ol.events.EventTarget');

goog.require('goog.Disposable');
goog.require('ol.events');
goog.require('ol.events.Event');

/**
 * @classdesc
 * A simplified implementation of the W3C DOM Level 2 EventTarget interface.
 * @see {@link https://www.w3.org/TR/2000/REC-DOM-Level-2-Events-20001113/events.html#Events-EventTarget}
 *
 * There are two important simplifications compared to the specification:
 *
 * 1. The handling of `useCapture` in `addEventListener` and
 *    `removeEventListener`. There is no real capture model.
 * 2. The handling of `stopPropagation` and `preventDefault` on `dispatchEvent`.
 *    There is no event target hierarchy. When a listener calls
 *    `stopPropagation` or `preventDefault` on an event object, it means that no
 *    more listeners after this one will be called. Same as when the listener
 *    returns false.
 *
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
 * @param {string} type Type.
 * @param {ol.events.ListenerFunctionType} listener Listener.
 */
ol.events.EventTarget.prototype.addEventListener = function(type, listener) {
  var listeners = this.listeners_[type];
  if (!listeners) {
    listeners = this.listeners_[type] = [];
  }
  if (listeners.indexOf(listener) === -1) {
    listeners.unshift(listener);
  }
};


/**
 * @param {{type: string,
 *     target: (EventTarget|ol.events.EventTarget|undefined)}|ol.events.Event|
 *     string} event Event or event type.
 * @return {boolean|undefined} `false` if anyone called preventDefault on the
 *     event object or if any of the listeners returned false.
 */
ol.events.EventTarget.prototype.dispatchEvent = function(event) {
  var evt = typeof event === 'string' ? new ol.events.Event(event) : event;
  var type = evt.type;
  evt.target = this;
  var listeners = this.listeners_[type];
  if (listeners) {
    for (var i = listeners.length - 1; i >= 0; --i) {
      if (listeners[i].call(this, evt) === false ||
          evt.propagationStopped) {
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
 * Get the listeners for a specified event type. Listeners are returned in the
 * opposite order that they will be called in.
 *
 * @param {string} type Type.
 * @return {Array.<ol.events.ListenerFunctionType>} Listeners.
 */
ol.events.EventTarget.prototype.getListeners = function(type) {
  return this.listeners_[type];
};


/**
 * @param {string=} opt_type Type. If not provided,
 *     `true` will be returned if this EventTarget has any listeners.
 * @return {boolean} Has listeners.
 */
ol.events.EventTarget.prototype.hasListener = function(opt_type) {
  return opt_type ?
      opt_type in this.listeners_ :
      Object.keys(this.listeners_).length > 0;
};


/**
 * @param {string} type Type.
 * @param {ol.events.ListenerFunctionType} listener Listener.
 */
ol.events.EventTarget.prototype.removeEventListener = function(type, listener) {
  var listeners = this.listeners_[type];
  if (listeners) {
    var index = listeners.indexOf(listener);
    listeners.splice(index, 1);
    if (listeners.length === 0) {
      delete this.listeners_[type];
    }
  }
};
