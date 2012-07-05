
/**
 * @fileoverview An implementation of Google Maps' MVCObject.
 * @see https://developers.google.com/maps/articles/mvcfun
 * @see https://developers.google.com/maps/documentation/javascript/reference
 */

goog.provide('ol.MVCObject');

goog.require('goog.array');
goog.require('goog.events');
goog.require('goog.events.EventTarget');
goog.require('goog.object');


/**
 * @typedef {{target: ol.MVCObject, key: string}}
 */
ol.MVCObjectAccessor;



/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
ol.MVCObject = function() {
  goog.base(this);
};
goog.inherits(ol.MVCObject, goog.events.EventTarget);


/**
 * @param {string} str String.
 * @return {string} Capitalized string.
 */
ol.MVCObject.capitalize = function(str) {
  return str.substr(0, 1).toUpperCase() + str.substr(1);
};


/**
 * @param {ol.MVCObject|Object} arg Argument.
 * @return {ol.MVCObject} MVCObject.
 */
ol.MVCObject.create = function(arg) {
  if (arg instanceof ol.MVCObject) {
    return arg;
  } else {
    var mvcObject = new ol.MVCObject();
    mvcObject.setOptions(arg);
    return mvcObject;
  }
};


/**
 * @private
 * @type {Object.<string, string>}
 */
ol.MVCObject.getterNameCache_ = {};


/**
 * @param {string} str String.
 * @private
 * @return {string} Capitalized string.
 */
ol.MVCObject.getGetterName_ = function(str) {
  return ol.MVCObject.getterNameCache_[str] ||
      (ol.MVCObject.getterNameCache_[str] =
          'get' + ol.MVCObject.capitalize(str));
};


/**
 * @private
 * @type {Object.<string, string>}
 */
ol.MVCObject.setterNameCache_ = {};


/**
 * @param {string} str String.
 * @private
 * @return {string} Capitalized string.
 */
ol.MVCObject.getSetterName_ = function(str) {
  return ol.MVCObject.setterNameCache_[str] ||
      (ol.MVCObject.setterNameCache_[str] =
          'set' + ol.MVCObject.capitalize(str));
};


/**
 * @param {ol.MVCObject} obj Object.
 * @return {Object.<string, ol.MVCObjectAccessor>} Accessors.
 */
ol.MVCObject.getAccessors = function(obj) {
  return obj['gm_accessors_'] || (obj['gm_accessors_'] = {});
};


/**
 * @param {ol.MVCObject} obj Object.
 * @return {Object.<string, ?number>} Listeners.
 */
ol.MVCObject.getListeners = function(obj) {
  return obj['gm_bindings_'] || (obj['gm_bindings_'] = {});
};


/**
 * @param {string} key Key.
 * @param {ol.MVCObject} target Target.
 * @param {string=} opt_targetKey Target key.
 * @param {boolean=} opt_noNotify No notify.
 */
ol.MVCObject.prototype.bindTo =
    function(key, target, opt_targetKey, opt_noNotify) {
  var targetKey = goog.isDef(opt_targetKey) ? opt_targetKey : key;
  this.unbind(key);
  var eventType = targetKey.toLowerCase() + '_changed';
  var listeners = ol.MVCObject.getListeners(this);
  listeners[key] = goog.events.listen(target, eventType, function() {
    this.notifyInternal_(key);
  }, undefined, this);
  var accessors = ol.MVCObject.getAccessors(this);
  accessors[key] = {target: target, key: targetKey};
  var noNotify = goog.isDef(opt_noNotify) ? opt_noNotify : false;
  if (!noNotify) {
    this.notifyInternal_(key);
  }
};


/**
 * @param {string} key Key.
 */
ol.MVCObject.prototype.changed = function(key) {
};


/**
 * @param {string} key Key.
 * @return {*} Value.
 */
ol.MVCObject.prototype.get = function(key) {
  var accessors = ol.MVCObject.getAccessors(this);
  if (goog.object.containsKey(accessors, key)) {
    var accessor = accessors[key];
    var target = accessor.target;
    var targetKey = accessor.key;
    var getterName = ol.MVCObject.getGetterName_(targetKey);
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
ol.MVCObject.prototype.notify = function(key) {
  var accessors = ol.MVCObject.getAccessors(this);
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
ol.MVCObject.prototype.notifyInternal_ = function(key) {
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
ol.MVCObject.prototype.set = function(key, value) {
  var accessors = ol.MVCObject.getAccessors(this);
  if (goog.object.containsKey(accessors, key)) {
    var accessor = accessors[key];
    var target = accessor.target;
    var targetKey = accessor.key;
    var setterName = ol.MVCObject.getSetterName_(targetKey);
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
ol.MVCObject.prototype.setOptions = function(options) {
  goog.object.forEach(options, function(value, key) {
    var setterName = ol.MVCObject.getSetterName_(key);
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
ol.MVCObject.prototype.setValues = ol.MVCObject.prototype.setOptions;


/**
 * @param {string} key Key.
 */
ol.MVCObject.prototype.unbind = function(key) {
  var listeners = ol.MVCObject.getListeners(this);
  var listener = listeners[key];
  if (listener) {
    delete listeners[key];
    goog.events.unlistenByKey(listener);
    var value = this.get(key);
    var accessors = ol.MVCObject.getAccessors(this);
    delete accessors[key];
    this[key] = value;
  }
};


/**
 */
ol.MVCObject.prototype.unbindAll = function() {
  var listeners = ol.MVCObject.getListeners(this);
  var keys = goog.object.getKeys(listeners);
  goog.array.forEach(keys, function(key) {
    this.unbind(key);
  }, this);
};
