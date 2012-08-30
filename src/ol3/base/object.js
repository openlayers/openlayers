
/**
 * @fileoverview An implementation of Google Maps' MVCObject.
 * @see https://developers.google.com/maps/articles/mvcfun
 * @see https://developers.google.com/maps/documentation/javascript/reference
 */

goog.provide('ol3.Object');

goog.require('goog.array');
goog.require('goog.events');
goog.require('goog.events.EventTarget');
goog.require('goog.object');


/**
 * @enum {string}
 */
ol3.ObjectProperty = {
  ACCESSORS: 'ol_accessors_',
  BINDINGS: 'ol_bindings_'
};



/**
 * @constructor
 * @extends {goog.events.EventTarget}
 * @param {Object.<string, *>=} opt_values Values.
 */
ol3.Object = function(opt_values) {
  goog.base(this);
  if (goog.isDef(opt_values)) {
    this.setValues(opt_values);
  }
};
goog.inherits(ol3.Object, goog.events.EventTarget);


/**
 * @private
 * @type {Object.<string, string>}
 */
ol3.Object.changedEventTypeCache_ = {};


/**
 * @private
 * @type {Object.<string, string>}
 */
ol3.Object.getterNameCache_ = {};


/**
 * @private
 * @type {Object.<string, string>}
 */
ol3.Object.setterNameCache_ = {};


/**
 * @param {string} str String.
 * @return {string} Capitalized string.
 */
ol3.Object.capitalize = function(str) {
  return str.substr(0, 1).toUpperCase() + str.substr(1);
};


/**
 * @param {ol3.Object} obj Object.
 * @return {Object.<string, {target: ol3.Object, key: string}>} Accessors.
 */
ol3.Object.getAccessors = function(obj) {
  return obj[ol3.ObjectProperty.ACCESSORS] ||
      (obj[ol3.ObjectProperty.ACCESSORS] = {});
};


/**
 * @param {string} key Key.
 * @return {string} Changed name.
 */
ol3.Object.getChangedEventType = function(key) {
  return ol3.Object.changedEventTypeCache_[key] ||
      (ol3.Object.changedEventTypeCache_[key] = key.toLowerCase() + '_changed');
};


/**
 * @param {string} key String.
 * @return {string} Getter name.
 */
ol3.Object.getGetterName = function(key) {
  return ol3.Object.getterNameCache_[key] ||
      (ol3.Object.getterNameCache_[key] = 'get' + ol3.Object.capitalize(key));
};


/**
 * @param {ol3.Object} obj Object.
 * @return {Object.<string, ?number>} Listeners.
 */
ol3.Object.getListeners = function(obj) {
  return obj[ol3.ObjectProperty.BINDINGS] ||
      (obj[ol3.ObjectProperty.BINDINGS] = {});
};


/**
 * @param {string} key String.
 * @return {string} Setter name.
 */
ol3.Object.getSetterName = function(key) {
  return ol3.Object.setterNameCache_[key] ||
      (ol3.Object.setterNameCache_[key] = 'set' + ol3.Object.capitalize(key));
};


/**
 * @param {string} key Key.
 * @param {ol3.Object} target Target.
 * @param {string=} opt_targetKey Target key.
 * @param {boolean=} opt_noNotify No notify.
 */
ol3.Object.prototype.bindTo =
    function(key, target, opt_targetKey, opt_noNotify) {
  var targetKey = opt_targetKey || key;
  this.unbind(key);
  var eventType = ol3.Object.getChangedEventType(targetKey);
  var listeners = ol3.Object.getListeners(this);
  listeners[key] = goog.events.listen(target, eventType, function() {
    this.notifyInternal_(key);
  }, undefined, this);
  var accessors = ol3.Object.getAccessors(this);
  accessors[key] = {target: target, key: targetKey};
  var noNotify = opt_noNotify || false;
  if (!noNotify) {
    this.notifyInternal_(key);
  }
};


/**
 * @param {string} key Key.
 */
ol3.Object.prototype.changed = goog.nullFunction;


/**
 * @param {string} key Key.
 * @return {*} Value.
 */
ol3.Object.prototype.get = function(key) {
  var accessors = ol3.Object.getAccessors(this);
  if (goog.object.containsKey(accessors, key)) {
    var accessor = accessors[key];
    var target = accessor.target;
    var targetKey = accessor.key;
    var getterName = ol3.Object.getGetterName(targetKey);
    if (target[getterName]) {
      return target[getterName]();
    } else {
      return target.get(targetKey);
    }
  } else {
    return this[key];
  }
};


/**
 * @param {string} key Key.
 */
ol3.Object.prototype.notify = function(key) {
  var accessors = ol3.Object.getAccessors(this);
  if (goog.object.containsKey(accessors, key)) {
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
ol3.Object.prototype.notifyInternal_ = function(key) {
  var eventType = ol3.Object.getChangedEventType(key);
  this.dispatchEvent(eventType);
};


/**
 * @param {string} key Key.
 * @param {*} value Value.
 */
ol3.Object.prototype.set = function(key, value) {
  var accessors = ol3.Object.getAccessors(this);
  if (goog.object.containsKey(accessors, key)) {
    var accessor = accessors[key];
    var target = accessor.target;
    var targetKey = accessor.key;
    var setterName = ol3.Object.getSetterName(targetKey);
    if (target[setterName]) {
      target[setterName](value);
    } else {
      target.set(targetKey, value);
    }
  } else {
    this[key] = value;
    this.notifyInternal_(key);
  }
};


/**
 * @param {Object.<string, *>} options Options.
 */
ol3.Object.prototype.setOptions = function(options) {
  goog.object.forEach(options, function(value, key) {
    var setterName = ol3.Object.getSetterName(key);
    if (this[setterName]) {
      this[setterName](value);
    } else {
      this.set(key, value);
    }
  }, this);
};


/**
 * @param {Object.<string, *>} values Values.
 */
ol3.Object.prototype.setValues = ol3.Object.prototype.setOptions;


/**
 * @param {string} key Key.
 */
ol3.Object.prototype.unbind = function(key) {
  var listeners = ol3.Object.getListeners(this);
  var listener = listeners[key];
  if (listener) {
    delete listeners[key];
    goog.events.unlistenByKey(listener);
    var value = this.get(key);
    var accessors = ol3.Object.getAccessors(this);
    delete accessors[key];
    this[key] = value;
  }
};


/**
 */
ol3.Object.prototype.unbindAll = function() {
  var listeners = ol3.Object.getListeners(this);
  var keys = goog.object.getKeys(listeners);
  goog.array.forEach(keys, function(key) {
    this.unbind(key);
  }, this);
};
