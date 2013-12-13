goog.provide('ol.Observable');

goog.require('goog.events');
goog.require('goog.events.EventTarget');



/**
 * An event target providing convenient methods for listener registration
 * and unregistration.
 * @constructor
 * @extends {goog.events.EventTarget}
 * @suppress {checkStructDictInheritance}
 * @struct
 * @todo stability experimental
 */
ol.Observable = function() {
  goog.base(this);

};
goog.inherits(ol.Observable, goog.events.EventTarget);


/**
 * Listen for a certain type of event.
 * @param {string|Array.<string>} type The event type or array of event types.
 * @param {function(?): ?} listener The listener function.
 * @param {Object=} opt_scope Object is whose scope to call
 *     the listener.
 * @return {goog.events.Key} Unique key for the listener.
 * @todo stability experimental
 */
ol.Observable.prototype.on = function(type, listener, opt_scope) {
  return goog.events.listen(this, type, listener, false, opt_scope);
};


/**
 * Listen once for a certain type of event.
 * @param {string|Array.<string>} type The event type or array of event types.
 * @param {function(?): ?} listener The listener function.
 * @param {Object=} opt_scope Object is whose scope to call
 *     the listener.
 * @return {goog.events.Key} Unique key for the listener.
 * @todo stability experimental
 */
ol.Observable.prototype.once = function(type, listener, opt_scope) {
  return goog.events.listenOnce(this, type, listener, false, opt_scope);
};


/**
 * Unlisten for a certain type of event.
 * @param {string|Array.<string>} type The event type or array of event types.
 * @param {function(?): ?} listener The listener function.
 * @param {Object=} opt_scope Object is whose scope to call
 *     the listener.
 * @todo stability experimental
 */
ol.Observable.prototype.un = function(type, listener, opt_scope) {
  goog.events.unlisten(this, type, listener, false, opt_scope);
};


/**
 * Removes an event listener using the key returned by `on()` or `once()`.
 * @param {goog.events.Key} key Key.
 * @todo stability experimental
 */
ol.Observable.prototype.unByKey = function(key) {
  goog.events.unlistenByKey(key);
};
