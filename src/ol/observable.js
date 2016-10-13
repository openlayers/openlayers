goog.provide('ol.Observable');

goog.require('ol');
goog.require('ol.events');
goog.require('ol.events.EventTarget');
goog.require('ol.events.EventType');


/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * An event target providing convenient methods for listener registration
 * and unregistration. A generic `change` event is always available through
 * {@link ol.Observable#changed}.
 *
 * @constructor
 * @extends {ol.events.EventTarget}
 * @fires ol.events.Event
 * @struct
 * @api stable
 */
ol.Observable = function() {

  ol.events.EventTarget.call(this);

  /**
   * @private
   * @type {number}
   */
  this.revision_ = 0;

};
ol.inherits(ol.Observable, ol.events.EventTarget);


/**
 * Removes an event listener using the key returned by `on()` or `once()`.
 * @param {ol.EventsKey|Array.<ol.EventsKey>} key The key returned by `on()`
 *     or `once()` (or an array of keys).
 * @api stable
 */
ol.Observable.unByKey = function(key) {
  if (Array.isArray(key)) {
    for (var i = 0, ii = key.length; i < ii; ++i) {
      ol.events.unlistenByKey(key[i]);
    }
  } else {
    ol.events.unlistenByKey(/** @type {ol.EventsKey} */ (key));
  }
};


/**
 * Increases the revision counter and dispatches a 'change' event.
 * @api
 */
ol.Observable.prototype.changed = function() {
  ++this.revision_;
  this.dispatchEvent(ol.events.EventType.CHANGE);
};


/**
 * Dispatches an event and calls all listeners listening for events
 * of this type. The event parameter can either be a string or an
 * Object with a `type` property.
 *
 * @param {{type: string,
 *     target: (EventTarget|ol.events.EventTarget|undefined)}|ol.events.Event|
 *     string} event Event object.
 * @function
 * @api
 */
ol.Observable.prototype.dispatchEvent;


/**
 * Get the version number for this object.  Each time the object is modified,
 * its version number will be incremented.
 * @return {number} Revision.
 * @api
 */
ol.Observable.prototype.getRevision = function() {
  return this.revision_;
};


/**
 * Listen for a certain type of event.
 * @param {string|Array.<string>} type The event type or array of event types.
 * @param {function(?): ?} listener The listener function.
 * @param {Object=} opt_this The object to use as `this` in `listener`.
 * @return {ol.EventsKey|Array.<ol.EventsKey>} Unique key for the listener. If
 *     called with an array of event types as the first argument, the return
 *     will be an array of keys.
 * @api stable
 */
ol.Observable.prototype.on = function(type, listener, opt_this) {
  if (Array.isArray(type)) {
    var len = type.length;
    var keys = new Array(len);
    for (var i = 0; i < len; ++i) {
      keys[i] = ol.events.listen(this, type[i], listener, opt_this);
    }
    return keys;
  } else {
    return ol.events.listen(
        this, /** @type {string} */ (type), listener, opt_this);
  }
};


/**
 * Listen once for a certain type of event.
 * @param {string|Array.<string>} type The event type or array of event types.
 * @param {function(?): ?} listener The listener function.
 * @param {Object=} opt_this The object to use as `this` in `listener`.
 * @return {ol.EventsKey|Array.<ol.EventsKey>} Unique key for the listener. If
 *     called with an array of event types as the first argument, the return
 *     will be an array of keys.
 * @api stable
 */
ol.Observable.prototype.once = function(type, listener, opt_this) {
  if (Array.isArray(type)) {
    var len = type.length;
    var keys = new Array(len);
    for (var i = 0; i < len; ++i) {
      keys[i] = ol.events.listenOnce(this, type[i], listener, opt_this);
    }
    return keys;
  } else {
    return ol.events.listenOnce(
        this, /** @type {string} */ (type), listener, opt_this);
  }
};


/**
 * Unlisten for a certain type of event.
 * @param {string|Array.<string>} type The event type or array of event types.
 * @param {function(?): ?} listener The listener function.
 * @param {Object=} opt_this The object which was used as `this` by the
 * `listener`.
 * @api stable
 */
ol.Observable.prototype.un = function(type, listener, opt_this) {
  if (Array.isArray(type)) {
    for (var i = 0, ii = type.length; i < ii; ++i) {
      ol.events.unlisten(this, type[i], listener, opt_this);
    }
    return;
  } else {
    ol.events.unlisten(this, /** @type {string} */ (type), listener, opt_this);
  }
};


/**
 * Removes an event listener using the key returned by `on()` or `once()`.
 * Note that using the {@link ol.Observable.unByKey} static function is to
 * be preferred.
 * @param {ol.EventsKey|Array.<ol.EventsKey>} key The key returned by `on()`
 *     or `once()` (or an array of keys).
 * @function
 * @api stable
 */
ol.Observable.prototype.unByKey = ol.Observable.unByKey;
