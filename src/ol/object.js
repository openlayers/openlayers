/**
 * An implementation of Google Maps' MVCObject.
 * @see https://developers.google.com/maps/articles/mvcfun
 * @see https://developers.google.com/maps/documentation/javascript/reference
 */

goog.provide('ol.Object');
goog.provide('ol.ObjectEvent');
goog.provide('ol.ObjectEventType');

goog.require('goog.array');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.functions');
goog.require('goog.object');
goog.require('ol.Observable');


/**
 * @enum {string}
 */
ol.ObjectEventType = {
  /**
   * Triggered before a property is changed.
   * @event ol.ObjectEvent#beforepropertychange
   * @todo api
   */
  BEFOREPROPERTYCHANGE: 'beforepropertychange',
  /**
   * Triggered when a property is changed.
   * @event ol.ObjectEvent#propertychange
   * @todo api
   */
  PROPERTYCHANGE: 'propertychange'
};



/**
 * Object representing a property change event.
 *
 * @param {string} type The event type.
 * @param {string} key The property name.
 * @extends {goog.events.Event}
 * @implements {oli.ObjectEvent}
 * @constructor
 */
ol.ObjectEvent = function(type, key) {
  goog.base(this, type);

  /**
   * The name of the property whose value is changing.
   * @type {string}
   */
  this.key = key;

};
goog.inherits(ol.ObjectEvent, goog.events.Event);



/**
 * @constructor
 * @param {ol.Object} target
 * @param {string} key
 */
ol.ObjectAccessor = function(target, key) {

  /**
   * @type {ol.Object}
   */
  this.target = target;

  /**
   * @type {string}
   */
  this.key = key;

  /**
   * @type {function(?): ?}
   */
  this.from = goog.functions.identity;

  /**
   * @type {function(?): ?}
   */
  this.to = goog.functions.identity;
};


/**
 * @param {function(?): ?} from A function that transforms the source value
 *     before it is set to the target.
 * @param {function(?): ?} to A function that transforms the target value
 *     before it is set to the source.
 */
ol.ObjectAccessor.prototype.transform = function(from, to) {
  this.from = from;
  this.to = to;

  this.target.notify(this.key);
};



/**
 * Base class implementing KVO (Key Value Observing).
 * @constructor
 * @extends {ol.Observable}
 * @param {Object.<string, *>=} opt_values Values.
 * @fires {@link ol.ObjectEvent} ol.ObjectEvent
 * @todo api
 */
ol.Object = function(opt_values) {
  goog.base(this);

  // Call goog.getUid to ensure that the order of objects' ids is the same as
  // the order in which they were created.  This also helps to ensure that
  // object properties are always added in the same order, which helps many
  // JavaScript engines generate faster code.
  goog.getUid(this);

  /**
   * @private
   * @type {Object.<string, *>}
   */
  this.values_ = {};

  /**
   * @private
   * @type {Object.<string, ol.ObjectAccessor>}
   */
  this.accessors_ = {};

  /**
   * Lookup of beforechange listener keys.
   * @type {Object.<string, goog.events.Key>}
   * @private
   */
  this.beforeChangeListeners_ = {};

  /**
   * @private
   * @type {Object.<string, goog.events.Key>}
   */
  this.listeners_ = {};

  if (goog.isDef(opt_values)) {
    this.setValues(opt_values);
  }
};
goog.inherits(ol.Object, ol.Observable);


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
 * @param {string} key Key name.
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
 * @param {string} key String.
 * @return {string} Setter name.
 */
ol.Object.getSetterName = function(key) {
  return ol.Object.setterNameCache_.hasOwnProperty(key) ?
      ol.Object.setterNameCache_[key] :
      (ol.Object.setterNameCache_[key] = 'set' + ol.Object.capitalize(key));
};


/**
 * The bindTo method allows you to set up a two-way binding between a
 * `source` and `target` object. The method returns an
 * ol.ObjectAccessor with a transform method that lets you transform
 * values on the way from the source to the target and on the way back.
 *
 * For example, if you had two map views (sourceView and targetView)
 * and you wanted the target view to have double the resolution of the
 * source view, you could transform the resolution on the way to and
 * from the target with the following:
 *
 *     sourceView.bindTo('resolution', targetView)
 *       .transform(
 *         function(sourceResolution) {
 *           // from sourceView.resolution to targetView.resolution
 *           return 2 * sourceResolution;
 *         },
 *         function(targetResolution) {
 *           // from targetView.resolution to sourceView.resolution
 *           return targetResolution / 2;
 *         }
 *       );
 *
 * @param {string} key Key name.
 * @param {ol.Object} target Target.
 * @param {string=} opt_targetKey Target key.
 * @return {ol.ObjectAccessor}
 * @todo api
 */
ol.Object.prototype.bindTo = function(key, target, opt_targetKey) {
  var targetKey = opt_targetKey || key;
  this.unbind(key);

  // listen for change:targetkey events
  var eventType = ol.Object.getChangeEventType(targetKey);
  this.listeners_[key] = goog.events.listen(target, eventType,
      /**
       * @this {ol.Object}
       */
      function() {
        this.notifyInternal_(key);
      }, undefined, this);

  // listen for beforechange events and relay if key matches
  this.beforeChangeListeners_[key] = goog.events.listen(target,
      ol.ObjectEventType.BEFOREPROPERTYCHANGE,
      this.createBeforeChangeListener_(key, targetKey),
      undefined, this);

  var accessor = new ol.ObjectAccessor(target, targetKey);
  this.accessors_[key] = accessor;
  this.notifyInternal_(key);
  return accessor;
};


/**
 * Create a listener for beforechange events on a target object.  This listener
 * will relay events on this object if the event key matches the provided target
 * key.
 * @param {string} key The key on this object whose value will be changing.
 * @param {string} targetKey The key on the target object.
 * @return {function(this: ol.Object, ol.ObjectEvent)} Listener.
 * @private
 */
ol.Object.prototype.createBeforeChangeListener_ = function(key, targetKey) {
  /**
   * Conditionally relay beforechange events if event key matches target key.
   * @param {ol.ObjectEvent} event The beforechange event from the target.
   * @this {ol.Object}
   */
  return function(event) {
    if (event.key === targetKey) {
      this.dispatchEvent(
          new ol.ObjectEvent(ol.ObjectEventType.BEFOREPROPERTYCHANGE, key));
    }
  };
};


/**
 * Gets a value.
 * @param {string} key Key name.
 * @return {*} Value.
 * @todo api
 */
ol.Object.prototype.get = function(key) {
  var value;
  var accessors = this.accessors_;
  if (accessors.hasOwnProperty(key)) {
    var accessor = accessors[key];
    var target = accessor.target;
    var targetKey = accessor.key;
    var getterName = ol.Object.getGetterName(targetKey);
    var getter = /** @type {function(): *|undefined} */
        (goog.object.get(target, getterName));
    if (goog.isDef(getter)) {
      value = getter.call(target);
    } else {
      value = target.get(targetKey);
    }
    value = accessor.to(value);
  } else if (this.values_.hasOwnProperty(key)) {
    value = this.values_[key];
  }
  return value;
};


/**
 * Get a list of object property names.
 * @return {Array.<string>} List of property names.
 * @todo api
 */
ol.Object.prototype.getKeys = function() {
  var accessors = this.accessors_;
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
 * Get an object of all property names and values.
 * @return {Object.<string, *>} Object.
 * @todo api
 */
ol.Object.prototype.getProperties = function() {
  var properties = {};
  var key;
  for (key in this.values_) {
    properties[key] = this.values_[key];
  }
  for (key in this.accessors_) {
    properties[key] = this.get(key);
  }
  return properties;
};


/**
 * Notify all observers of a change on this property. This notifies both
 * objects that are bound to the object's property as well as the object
 * that it is bound to.
 * @param {string} key Key name.
 * @todo api
 */
ol.Object.prototype.notify = function(key) {
  var accessors = this.accessors_;
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
 * @param {string} key Key name.
 * @private
 */
ol.Object.prototype.notifyInternal_ = function(key) {
  var eventType = ol.Object.getChangeEventType(key);
  this.dispatchEvent(eventType);
  this.dispatchEvent(
      new ol.ObjectEvent(ol.ObjectEventType.PROPERTYCHANGE, key));
};


/**
 * Sets a value.
 * @param {string} key Key name.
 * @param {*} value Value.
 * @todo api
 */
ol.Object.prototype.set = function(key, value) {
  this.dispatchEvent(
      new ol.ObjectEvent(ol.ObjectEventType.BEFOREPROPERTYCHANGE, key));
  var accessors = this.accessors_;
  if (accessors.hasOwnProperty(key)) {
    var accessor = accessors[key];
    var target = accessor.target;
    var targetKey = accessor.key;
    value = accessor.from(value);
    var setterName = ol.Object.getSetterName(targetKey);
    var setter = /** @type {function(*)|undefined} */
        (goog.object.get(target, setterName));
    if (goog.isDef(setter)) {
      setter.call(target, value);
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
 * @todo api
 */
ol.Object.prototype.setValues = function(values) {
  var key;
  for (key in values) {
    this.set(key, values[key]);
  }
};


/**
 * Removes a binding. Unbinding will set the unbound property to the current
 *     value. The object will not be notified, as the value has not changed.
 * @param {string} key Key name.
 * @todo api
 */
ol.Object.prototype.unbind = function(key) {
  var listeners = this.listeners_;
  var listener = listeners[key];
  if (listener) {
    delete listeners[key];
    goog.events.unlistenByKey(listener);
    var value = this.get(key);
    delete this.accessors_[key];
    this.values_[key] = value;
  }

  // unregister any beforechange listener
  var listenerKey = this.beforeChangeListeners_[key];
  if (listenerKey) {
    goog.events.unlistenByKey(listenerKey);
    delete this.beforeChangeListeners_[key];
  }
};


/**
 * Removes all bindings.
 * @todo api
 */
ol.Object.prototype.unbindAll = function() {
  for (var key in this.listeners_) {
    this.unbind(key);
  }
};
