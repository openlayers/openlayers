/**
 * An implementation of Google Maps' MVCObject.
 * @see https://developers.google.com/maps/articles/mvcfun
 * @see https://developers.google.com/maps/documentation/javascript/reference
 */

goog.provide('ol.Object');
goog.provide('ol.ObjectEvent');
goog.provide('ol.ObjectEventType');

goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.functions');
goog.require('goog.object');
goog.require('goog.string');
goog.require('ol.Observable');


/**
 * @enum {string}
 */
ol.ObjectEventType = {
  /**
   * Triggered when a property is changed.
   * @event ol.ObjectEvent#propertychange
   * @api
   */
  PROPERTYCHANGE: 'propertychange'
};



/**
 * @classdesc
 * Events emitted by {@link ol.Object} instances are instances of this type.
 *
 * @param {string} type The event type.
 * @param {string} key The property name.
 * @param {*} oldValue The old value for `key`.
 * @extends {goog.events.Event}
 * @implements {oli.ObjectEvent}
 * @constructor
 */
ol.ObjectEvent = function(type, key, oldValue) {
  goog.base(this, type);

  /**
   * The name of the property whose value is changing.
   * @type {string}
   * @api
   */
  this.key = key;

  /**
   * The old value. To get the new value use `e.target.get(e.key)` where
   * `e` is the event object.
   * @type {*}
   * @api
   */
  this.oldValue = oldValue;

};
goog.inherits(ol.ObjectEvent, goog.events.Event);



/**
 * @constructor
 * @param {ol.Object} source Source object.
 * @param {ol.Object} target Target object.
 * @param {string} sourceKey Source key.
 * @param {string} targetKey Target key.
 */
ol.ObjectAccessor = function(source, target, sourceKey, targetKey) {

  /**
   * @type {ol.Object}
   */
  this.source = source;

  /**
   * @type {ol.Object}
   */
  this.target = target;

  /**
   * @type {string}
   */
  this.sourceKey = sourceKey;

  /**
   * @type {string}
   */
  this.targetKey = targetKey;

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
 * @api
 */
ol.ObjectAccessor.prototype.transform = function(from, to) {
  var oldValue = ol.Object.getKeyValue_(this.source, this.sourceKey);
  this.from = from;
  this.to = to;
  this.source.notify(this.sourceKey, oldValue);
};



/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Most non-trivial classes inherit from this.
 *
 * This extends {@link ol.Observable} with observable properties, where each
 * property is observable as well as the object as a whole.
 *
 * Classes that inherit from this have pre-defined properties, to which you can
 * add your own. The pre-defined properties are listed in this documentation as
 * 'Observable Properties', and have their own accessors; for example,
 * {@link ol.Map} has a `target` property, accessed with `getTarget()`  and
 * changed with `setTarget()`. Not all properties are however settable. There
 * are also general-purpose accessors `get()` and `set()`. For example,
 * `get('target')` is equivalent to `getTarget()`.
 *
 * The `set` accessors trigger a change event, and you can monitor this by
 * registering a listener. For example, {@link ol.View} has a `center`
 * property, so `view.on('change:center', function(evt) {...});` would call the
 * function whenever the value of the center property changes. Within the
 * function, `evt.target` would be the view, so `evt.target.getCenter()` would
 * return the new center.
 *
 * You can add your own observable properties with
 * `object.set('prop', 'value')`, and retrieve that with `object.get('prop')`.
 * You can listen for changes on that property value with
 * `object.on('change:prop', listener)`. You can get a list of all
 * properties with {@link ol.Object#getProperties object.getProperties()}.
 *
 * Note that the observable properties are separate from standard JS properties.
 * You can, for example, give your map object a title with
 * `map.title='New title'` and with `map.set('title', 'Another title')`. The
 * first will be a `hasOwnProperty`; the second will appear in
 * `getProperties()`. Only the second is observable.
 *
 * The observable properties also implement a form of Key Value Observing.
 * Two objects can be bound together such that a change in one will
 * automatically be reflected in the other. See `bindTo` method for more
 * details, and see {@link ol.dom.Input} for the specific case of binding an
 * object with an HTML element.
 *
 * @constructor
 * @extends {ol.Observable}
 * @param {Object.<string, *>=} opt_values An object with key-value pairs.
 * @fires ol.ObjectEvent
 * @api
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
   * @private
   * @type {Object.<string, goog.events.Key>}
   */
  this.listeners_ = {};

  if (goog.isDef(opt_values)) {
    this.setProperties(opt_values);
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
 * @param {string} key Key name.
 * @return {string} Change name.
 */
ol.Object.getChangeEventType = function(key) {
  return ol.Object.changeEventTypeCache_.hasOwnProperty(key) ?
      ol.Object.changeEventTypeCache_[key] :
      (ol.Object.changeEventTypeCache_[key] = 'change:' + key);
};


/**
 * @param {string} key String.
 * @return {string} Getter name.
 */
ol.Object.getGetterName = function(key) {
  return ol.Object.getterNameCache_.hasOwnProperty(key) ?
      ol.Object.getterNameCache_[key] :
      (ol.Object.getterNameCache_[key] = 'get' + goog.string.capitalize(key));
};


/**
 * @param {string} key String.
 * @return {string} Setter name.
 */
ol.Object.getSetterName = function(key) {
  return ol.Object.setterNameCache_.hasOwnProperty(key) ?
      ol.Object.setterNameCache_[key] :
      (ol.Object.setterNameCache_[key] = 'set' + goog.string.capitalize(key));
};


/**
 * Get the value for an object and a key. Use the getter (`getX`) if it exists,
 * otherwise use the generic `get` function.
 * @param {ol.Object} obj Object.
 * @param {string} key Key;
 * @return {*} Value;
 * @private
 */
ol.Object.getKeyValue_ = function(obj, key) {
  var getterName = ol.Object.getGetterName(key);
  var getter = /** @type {function(): *|undefined} */
      (/** @type {Object} */ (obj)[getterName]);
  return goog.isDef(getter) ? getter.call(obj) : obj.get(key);
};


/**
 * Set the value for an object and a key. Use the setter (`setX`) if it exists,
 * otherwise use the generic `set` function.
 * @param {ol.Object} obj Object.
 * @param {string} key Key.
 * @param {*} value Value.
 * @private
 */
ol.Object.setKeyValue_ = function(obj, key, value) {
  var setterName = ol.Object.getSetterName(key);
  var setter = /** @type {function(*)|undefined} */
      (/** @type {Object} */ (obj)[setterName]);
  if (goog.isDef(setter)) {
    setter.call(obj, value);
  } else {
    obj.set(key, value);
  }
};


/**
 * The bindTo method allows you to set up a two-way binding between a
 * `source` and `target` object. The method returns an object with a
 * `transform` method that you can use to provide `from` and `to`
 * functions to transform values on the way from the source to the
 * target and on the way back.
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
 * @api
 */
ol.Object.prototype.bindTo = function(key, target, opt_targetKey) {
  var targetKey = opt_targetKey || key;
  this.unbind(key);

  // listen for change:targetkey events
  var eventType = ol.Object.getChangeEventType(targetKey);
  this.listeners_[key] = goog.events.listen(target, eventType,
      /**
       * @param {ol.ObjectEvent} e Event.
       * @this {ol.Object}
       */
      function(e) {
        this.notify(key, e.oldValue);
      }, undefined, this);

  var accessor = new ol.ObjectAccessor(this, target, key, targetKey);
  this.accessors_[key] = accessor;
  this.notify(key, this.values_[key]);
  return accessor;
};


/**
 * Gets a value.
 * @param {string} key Key name.
 * @return {*} Value.
 * @api
 */
ol.Object.prototype.get = function(key) {
  var value;
  var accessors = this.accessors_;
  if (accessors.hasOwnProperty(key)) {
    var accessor = accessors[key];
    value = ol.Object.getKeyValue_(accessor.target, accessor.targetKey);
    value = accessor.to(value);
  } else if (this.values_.hasOwnProperty(key)) {
    value = this.values_[key];
  }
  return value;
};


/**
 * Get a list of object property names.
 * @return {Array.<string>} List of property names.
 * @api
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
 * @api
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
 * @param {string} key Key name.
 * @param {*} oldValue Old value.
 */
ol.Object.prototype.notify = function(key, oldValue) {
  var eventType;
  eventType = ol.Object.getChangeEventType(key);
  this.dispatchEvent(new ol.ObjectEvent(eventType, key, oldValue));
  eventType = ol.ObjectEventType.PROPERTYCHANGE;
  this.dispatchEvent(new ol.ObjectEvent(eventType, key, oldValue));
};


/**
 * Sets a value.
 * @param {string} key Key name.
 * @param {*} value Value.
 * @api
 */
ol.Object.prototype.set = function(key, value) {
  var accessors = this.accessors_;
  if (accessors.hasOwnProperty(key)) {
    var accessor = accessors[key];
    value = accessor.from(value);
    ol.Object.setKeyValue_(accessor.target, accessor.targetKey, value);
  } else {
    var oldValue = this.values_[key];
    this.values_[key] = value;
    this.notify(key, oldValue);
  }
};


/**
 * Sets a collection of key-value pairs.
 * @param {Object.<string, *>} values Values.
 * @api
 */
ol.Object.prototype.setProperties = function(values) {
  var key;
  for (key in values) {
    this.set(key, values[key]);
  }
};


/**
 * Removes a binding. Unbinding will set the unbound property to the current
 *     value. The object will not be notified, as the value has not changed.
 * @param {string} key Key name.
 * @api
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
};


/**
 * Removes all bindings.
 * @api
 */
ol.Object.prototype.unbindAll = function() {
  for (var key in this.listeners_) {
    this.unbind(key);
  }
};
