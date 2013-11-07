
/**
 * An implementation of Google Maps' MVCObject.
 * @see https://developers.google.com/maps/articles/mvcfun
 * @see https://developers.google.com/maps/documentation/javascript/reference
 */

goog.provide('ol.Object');
goog.provide('ol.ObjectEventType');

goog.require('goog.array');
goog.require('goog.events');
goog.require('goog.events.EventTarget');
goog.require('goog.object');


/**
 * @enum {string}
 */
ol.ObjectEventType = {
  CHANGE: 'change'
};


/**
 * @enum {string}
 */
ol.ObjectProperty = {
  ACCESSORS: 'ol_accessors_',
  BINDINGS: 'ol_bindings_'
};



/**
 * Base class implementing KVO (Key Value Observing).
 * @constructor
 * @extends {goog.events.EventTarget}
 * @param {Object.<string, *>=} opt_values Values.
 * @todo stability experimental
 */
ol.Object = function(opt_values) {
  goog.base(this);

  /**
   * @private
   * @type {Object.<string, *>}
   */
  this.values_ = {};

  if (goog.isDef(opt_values)) {
    this.setValues(opt_values);
  }
};
goog.inherits(ol.Object, goog.events.EventTarget);


/**
 * @private
 * @type {Object.<string, string>}
 */
ol.Object.changeEventTypeCache_ = {};


/**
 * @private
 * @type {Object.<string, string>}
 */
ol.Object.getterNameCache_ = {};


/**
 * @private
 * @type {Object.<string, string>}
 */
ol.Object.setterNameCache_ = {};


/**
 * @param {string} str String.
 * @return {string} Capitalized string.
 */
ol.Object.capitalize = function(str) {
  return str.substr(0, 1).toUpperCase() + str.substr(1);
};


/**
 * @param {ol.Object} obj Object.
 * @return {Object.<string, {target: ol.Object, key: string}>} Accessors.
 */
ol.Object.getAccessors = function(obj) {
  return obj[ol.ObjectProperty.ACCESSORS] ||
      (obj[ol.ObjectProperty.ACCESSORS] = {});
};


/**
 * @param {string} key Key.
 * @return {string} Change name.
 */
ol.Object.getChangeEventType = function(key) {
  return ol.Object.changeEventTypeCache_.hasOwnProperty(key) ?
      ol.Object.changeEventTypeCache_[key] :
      (ol.Object.changeEventTypeCache_[key] = 'change:' + key.toLowerCase());
};


/**
 * @param {string} key String.
 * @return {string} Getter name.
 */
ol.Object.getGetterName = function(key) {
  return ol.Object.getterNameCache_.hasOwnProperty(key) ?
      ol.Object.getterNameCache_[key] :
      (ol.Object.getterNameCache_[key] = 'get' + ol.Object.capitalize(key));
};


/**
 * @param {ol.Object} obj Object.
 * @return {Object.<string, goog.events.Key>} Listeners.
 */
ol.Object.getListeners = function(obj) {
  return obj[ol.ObjectProperty.BINDINGS] ||
      (obj[ol.ObjectProperty.BINDINGS] = {});
};


/**
 * @param {string} key String.
 * @return {string} Setter name.
 */
ol.Object.getSetterName = function(key) {
  return ol.Object.setterNameCache_.hasOwnProperty(key) ?
      ol.Object.setterNameCache_[key] :
      (ol.Object.setterNameCache_[key] = 'set' + ol.Object.capitalize(key));
};


/**
 * Binds a View to a Model.
 * @param {string} key Key.
 * @param {ol.Object} target Target.
 * @param {string=} opt_targetKey Target key.
 * @todo stability experimental
 */
ol.Object.prototype.bindTo =
    function(key, target, opt_targetKey) {
  var targetKey = opt_targetKey || key;
  this.unbind(key);
  var eventType = ol.Object.getChangeEventType(targetKey);
  var listeners = ol.Object.getListeners(this);
  listeners[key] = goog.events.listen(target, eventType, function() {
    this.notifyInternal_(key);
  }, undefined, this);
  var accessors = ol.Object.getAccessors(this);
  accessors[key] = {target: target, key: targetKey};
  this.notifyInternal_(key);
};


/**
 * Gets a value.
 * @param {string} key Key.
 * @return {*} Value.
 * @todo stability experimental
 */
ol.Object.prototype.get = function(key) {
  var value;
  var accessors = ol.Object.getAccessors(this);
  if (accessors.hasOwnProperty(key)) {
    var accessor = accessors[key];
    var target = accessor.target;
    var targetKey = accessor.key;
    var getterName = ol.Object.getGetterName(targetKey);
    if (target[getterName]) {
      value = target[getterName]();
    } else {
      value = target.get(targetKey);
    }
  } else if (this.values_.hasOwnProperty(key)) {
    value = this.values_[key];
  }
  return value;
};


/**
 * Get a list of object property names.
 * @return {Array.<string>} List of property names.
 */
ol.Object.prototype.getKeys = function() {
  var accessors = ol.Object.getAccessors(this);
  var keysObject;
  if (goog.object.isEmpty(this.values_)) {
    if (goog.object.isEmpty(accessors)) {
      return [];
    } else {
      keysObject = accessors;
    }
  } else {
    if (goog.object.isEmpty(accessors)) {
      keysObject = this.values_;
    } else {
      keysObject = {};
      var key;
      for (key in this.values_) {
        keysObject[key] = true;
      }
      for (key in accessors) {
        keysObject[key] = true;
      }
    }
  }
  return goog.object.getKeys(keysObject);
};


/**
 * Notify all observers of a change on this property. This notifies both
 * objects that are bound to the object's property as well as the object
 * that it is bound to.
 * @param {string} key Key.
 * @todo stability experimental
 */
ol.Object.prototype.notify = function(key) {
  var accessors = ol.Object.getAccessors(this);
  if (accessors.hasOwnProperty(key)) {
    var accessor = accessors[key];
    var target = accessor.target;
    var targetKey = accessor.key;
    target.notify(targetKey);
  } else {
    this.notifyInternal_(key);
  }
};


/**
 * @param {string} key Key.
 * @private
 */
ol.Object.prototype.notifyInternal_ = function(key) {
  var eventType = ol.Object.getChangeEventType(key);
  this.dispatchEvent(eventType);
  this.dispatchEvent(ol.ObjectEventType.CHANGE);
};


/**
 * Listen for a certain type of event.
 * @param {string|Array.<string>} type The event type or array of event types.
 * @param {function(?): ?} listener The listener function.
 * @param {Object=} opt_scope Object is whose scope to call
 *     the listener.
 * @return {goog.events.Key} Unique key for the listener.
 * @todo stability experimental
 */
ol.Object.prototype.on = function(type, listener, opt_scope) {
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
ol.Object.prototype.once = function(type, listener, opt_scope) {
  return goog.events.listenOnce(this, type, listener, false, opt_scope);
};


/**
 * Sets a value.
 * @param {string} key Key.
 * @param {*} value Value.
 * @todo stability experimental
 */
ol.Object.prototype.set = function(key, value) {
  var accessors = ol.Object.getAccessors(this);
  if (accessors.hasOwnProperty(key)) {
    var accessor = accessors[key];
    var target = accessor.target;
    var targetKey = accessor.key;
    var setterName = ol.Object.getSetterName(targetKey);
    if (target[setterName]) {
      target[setterName](value);
    } else {
      target.set(targetKey, value);
    }
  } else {
    this.values_[key] = value;
    this.notifyInternal_(key);
  }
};


/**
 * Sets a collection of key-value pairs.
 * @param {Object.<string, *>} values Values.
 * @todo stability experimental
 */
ol.Object.prototype.setValues = function(values) {
  var key, value, setterName;
  for (key in values) {
    value = values[key];
    setterName = ol.Object.getSetterName(key);
    if (this[setterName]) {
      this[setterName](value);
    } else {
      this.set(key, value);
    }
  }
};


/**
 * Removes a binding. Unbinding will set the unbound property to the current
 *     value. The object will not be notified, as the value has not changed.
 * @param {string} key Key.
 * @todo stability experimental
 */
ol.Object.prototype.unbind = function(key) {
  var listeners = ol.Object.getListeners(this);
  var listener = listeners[key];
  if (listener) {
    delete listeners[key];
    goog.events.unlistenByKey(listener);
    var value = this.get(key);
    var accessors = ol.Object.getAccessors(this);
    delete accessors[key];
    this.values_[key] = value;
  }
};


/**
 * Unlisten for a certain type of event.
 * @param {string|Array.<string>} type The event type or array of event types.
 * @param {function(?): ?} listener The listener function.
 * @param {Object=} opt_scope Object is whose scope to call
 *     the listener.
 * @todo stability experimental
 */
ol.Object.prototype.un = function(type, listener, opt_scope) {
  goog.events.unlisten(this, type, listener, false, opt_scope);
};


/**
 * Removes an event listener which was added with `listen()` by the key returned
 * by `on()` or `once()`.
 * @param {goog.events.Key} key Key.
 * @todo stability experimental
 */
ol.Object.prototype.unByKey = function(key) {
  goog.events.unlistenByKey(key);
};


/**
 * Removes all bindings.
 * @todo stability experimental
 */
ol.Object.prototype.unbindAll = function() {
  for (var key in ol.Object.getListeners(this)) {
    this.unbind(key);
  }
};
