
/**
 * @fileoverview An implementation of Google Maps' MVCObject.
 * @see https://developers.google.com/maps/articles/mvcfun
 * @see https://developers.google.com/maps/documentation/javascript/reference
 */

goog.provide('ol.Object');

goog.require('goog.array');
goog.require('goog.events');
goog.require('goog.events.EventTarget');
goog.require('goog.object');


/**
 * @typedef {{target: ol.Object, key: string}}
 */
ol.ObjectAccessor;


/**
 * @enum {string}
 */
ol.ObjectProperty = {
  ACCESSORS: 'ol_accessors_',
  BINDINGS: 'ol_bindings_'
};



/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
ol.Object = function() {
  goog.base(this);
};
goog.inherits(ol.Object, goog.events.EventTarget);


/**
 * @param {string} str String.
 * @return {string} Capitalized string.
 */
ol.Object.capitalize = function(str) {
  return str.substr(0, 1).toUpperCase() + str.substr(1);
};


/**
 * @param {ol.Object|Object} arg Argument.
 * @return {ol.Object} Object.
 */
ol.Object.create = function(arg) {
  if (arg instanceof ol.Object) {
    return arg;
  } else {
    var object = new ol.Object();
    object.setOptions(arg);
    return object;
  }
};


/**
 * @private
 * @type {Object.<string, string>}
 */
ol.Object.getterNameCache_ = {};


/**
 * @param {string} str String.
 * @private
 * @return {string} Capitalized string.
 */
ol.Object.getGetterName_ = function(str) {
  return ol.Object.getterNameCache_[str] ||
      (ol.Object.getterNameCache_[str] = 'get' + ol.Object.capitalize(str));
};


/**
 * @private
 * @type {Object.<string, string>}
 */
ol.Object.setterNameCache_ = {};


/**
 * @param {string} str String.
 * @private
 * @return {string} Capitalized string.
 */
ol.Object.getSetterName_ = function(str) {
  return ol.Object.setterNameCache_[str] ||
      (ol.Object.setterNameCache_[str] = 'set' + ol.Object.capitalize(str));
};


/**
 * @param {ol.Object} obj Object.
 * @return {Object.<string, ol.ObjectAccessor>} Accessors.
 */
ol.Object.getAccessors = function(obj) {
  return obj[ol.ObjectProperty.ACCESSORS] ||
      (obj[ol.ObjectProperty.ACCESSORS] = {});
};


/**
 * @param {ol.Object} obj Object.
 * @return {Object.<string, ?number>} Listeners.
 */
ol.Object.getListeners = function(obj) {
  return obj[ol.ObjectProperty.BINDINGS] ||
      (obj[ol.ObjectProperty.BINDINGS] = {});
};


/**
 * @param {string} key Key.
 * @param {ol.Object} target Target.
 * @param {string=} opt_targetKey Target key.
 * @param {boolean=} opt_noNotify No notify.
 */
ol.Object.prototype.bindTo =
    function(key, target, opt_targetKey, opt_noNotify) {
  var targetKey = goog.isDef(opt_targetKey) ? opt_targetKey : key;
  this.unbind(key);
  var eventType = targetKey.toLowerCase() + '_changed';
  var listeners = ol.Object.getListeners(this);
  listeners[key] = goog.events.listen(target, eventType, function() {
    this.notifyInternal_(key);
  }, undefined, this);
  var accessors = ol.Object.getAccessors(this);
  accessors[key] = {target: target, key: targetKey};
  var noNotify = goog.isDef(opt_noNotify) ? opt_noNotify : false;
  if (!noNotify) {
    this.notifyInternal_(key);
  }
};


/**
 * @param {string} key Key.
 */
ol.Object.prototype.changed = function(key) {
};


/**
 * @param {string} key Key.
 * @return {*} Value.
 */
ol.Object.prototype.get = function(key) {
  var accessors = ol.Object.getAccessors(this);
  if (goog.object.containsKey(accessors, key)) {
    var accessor = accessors[key];
    var target = accessor.target;
    var targetKey = accessor.key;
    var getterName = ol.Object.getGetterName_(targetKey);
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
ol.Object.prototype.notify = function(key) {
  var accessors = ol.Object.getAccessors(this);
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
ol.Object.prototype.notifyInternal_ = function(key) {
  var changedMethodName = key + '_changed';
  if (this[changedMethodName]) {
    this[changedMethodName]();
  } else {
    this.changed(key);
  }
  var eventType = key.toLowerCase() + '_changed';
  this.dispatchEvent(eventType);
};


/**
 * @param {string} key Key.
 * @param {*} value Value.
 */
ol.Object.prototype.set = function(key, value) {
  var accessors = ol.Object.getAccessors(this);
  if (goog.object.containsKey(accessors, key)) {
    var accessor = accessors[key];
    var target = accessor.target;
    var targetKey = accessor.key;
    var setterName = ol.Object.getSetterName_(targetKey);
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
ol.Object.prototype.setOptions = function(options) {
  goog.object.forEach(options, function(value, key) {
    var setterName = ol.Object.getSetterName_(key);
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
ol.Object.prototype.setValues = ol.Object.prototype.setOptions;


/**
 * @param {string} key Key.
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
    this[key] = value;
  }
};


/**
 */
ol.Object.prototype.unbindAll = function() {
  var listeners = ol.Object.getListeners(this);
  var keys = goog.object.getKeys(listeners);
  goog.array.forEach(keys, function(key) {
    this.unbind(key);
  }, this);
};
