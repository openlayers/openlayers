goog.provide('ol.Observable');

goog.require('goog.events');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');



/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * An event target providing convenient methods for listener registration
 * and unregistration. A generic `change` event is always available through
 * {@link ol.Observable#dispatchChangeEvent}.
 *
 * @constructor
 * @extends {goog.events.EventTarget}
 * @suppress {checkStructDictInheritance}
 * @struct
 * @api stable
 */
ol.Observable = function() {

  goog.base(this);

  /**
   * @private
   * @type {number}
   */
  this.revision_ = 0;

};
goog.inherits(ol.Observable, goog.events.EventTarget);


/**
 * Dispatches a `change` event.
 * @fires change
 * @api
 */
ol.Observable.prototype.dispatchChangeEvent = function() {
  ++this.revision_;
  this.dispatchEvent(goog.events.EventType.CHANGE);
};


/**
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
 * @return {goog.events.Key} Unique key for the listener.
 * @api stable
 */
ol.Observable.prototype.on = function(type, listener, opt_this) {
  return goog.events.listen(this, type, listener, false, opt_this);
};


/**
 * Listen once for a certain type of event.
 * @param {string|Array.<string>} type The event type or array of event types.
 * @param {function(?): ?} listener The listener function.
 * @param {Object=} opt_this The object to use as `this` in `listener`.
 * @return {goog.events.Key} Unique key for the listener.
 * @api stable
 */
ol.Observable.prototype.once = function(type, listener, opt_this) {
  return goog.events.listenOnce(this, type, listener, false, opt_this);
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
  goog.events.unlisten(this, type, listener, false, opt_this);
};


/**
 * Removes an event listener using the key returned by `on()` or `once()`.
 * @param {goog.events.Key} key Key.
 * @api stable
 */
ol.Observable.prototype.unByKey = function(key) {
  goog.events.unlistenByKey(key);
};
