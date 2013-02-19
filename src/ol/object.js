
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
  CHANGED: 'changed'
};


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
 * @param {Object.<string, *>=} opt_values Values.
 */
ol.Object = function(opt_values) {
  goog.base(this);
  if (goog.isDef(opt_values)) {
    this.setValues(opt_values);
  }
};
goog.inherits(ol.Object, goog.events.EventTarget);


/**
 * @private
 * @type {Object.<string, string>}
 */
ol.Object.changedEventTypeCache_ = {};


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
 * @return {string} Changed name.
 */
ol.Object.getChangedEventType = function(key) {
  return ol.Object.changedEventTypeCache_[key] ||
      (ol.Object.changedEventTypeCache_[key] = key.toLowerCase() + '_changed');
};


/**
 * @param {string} key String.
 * @return {string} Getter name.
 */
ol.Object.getGetterName = function(key) {
  return ol.Object.getterNameCache_[key] ||
      (ol.Object.getterNameCache_[key] = 'get' + ol.Object.capitalize(key));
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
 * @param {string} key String.
 * @return {string} Setter name.
 */
ol.Object.getSetterName = function(key) {
  return ol.Object.setterNameCache_[key] ||
      (ol.Object.setterNameCache_[key] = 'set' + ol.Object.capitalize(key));
};


/**
 * @param {string} key Key.
 * @param {ol.Object} target Target.
 * @param {string=} opt_targetKey Target key.
 * @param {boolean=} opt_noNotify No notify.
 */
ol.Object.prototype.bindTo =
    function(key, target, opt_targetKey, opt_noNotify) {
  var targetKey = opt_targetKey || key;
  this.unbind(key);
  var eventType = ol.Object.getChangedEventType(targetKey);
  var listeners = ol.Object.getListeners(this);
  listeners[key] = goog.events.listen(target, eventType, function() {
    this.notifyInternal_(key);
  }, undefined, this);
  var accessors = ol.Object.getAccessors(this);
  accessors[key] = {target: target, key: targetKey};
  var noNotify = opt_noNotify || false;
  if (!noNotify) {
    this.notifyInternal_(key);
  }
};


/**
 * @param {string} key Key.
 */
ol.Object.prototype.changed = goog.nullFunction;


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
    var getterName = ol.Object.getGetterName(targetKey);
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
  var eventType = ol.Object.getChangedEventType(key);
  this.dispatchEvent(eventType);
  this.dispatchEvent(ol.ObjectEventType.CHANGED);
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
    var setterName = ol.Object.getSetterName(targetKey);
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
  var key, value, setterName;
  for (key in options) {
    value = options[key];
    setterName = ol.Object.getSetterName(key);
    if (this[setterName]) {
      this[setterName](value);
    } else {
      this.set(key, value);
    }
  }
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
 * Removes all bindings.
 */
ol.Object.prototype.unbindAll = function() {
  for (var key in ol.Object.getListeners(this)) {
    this.unbind(key);
  }
};
