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
goog.require('ol.Observable');


/**
 * @enum {string}
 */
ol.ObjectEventType = {
  /**
   * Triggered before a property is changed.
   * @event ol.ObjectEvent#beforepropertychange
   * @api
   */
  BEFOREPROPERTYCHANGE: 'beforepropertychange',
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
 * @extends {goog.events.Event}
 * @implements {oli.ObjectEvent}
 * @constructor
 */
ol.ObjectEvent = function(type, key) {
  goog.base(this, type);

  /**
   * The name of the property whose value is changing.
   * @type {string}
   * @api
   */
  this.key = key;

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
  this.from = from;
  this.to = to;
  this.source.notify(this.sourceKey);
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
 * You can add your own observable properties with `set('myProp', 'new value')`,
 * and retrieve that with `get('myProp')`. A change listener can then be
 * registered with `on('change:myProp', ...)`. And a change can be triggered
 * with `dispatchEvent('change:myProp')`. You can get a list of all properties
 * with `getProperties()`.
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
       * @this {ol.Object}
       */
      function() {
        this.notify(key);
      }, undefined, this);

  // listen for beforechange events and relay if key matches
  this.beforeChangeListeners_[key] = goog.events.listen(target,
      ol.ObjectEventType.BEFOREPROPERTYCHANGE,
      this.createBeforeChangeListener_(key, targetKey),
      undefined, this);

  var accessor = new ol.ObjectAccessor(this, target, key, targetKey);
  this.accessors_[key] = accessor;
  this.notify(key);
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
 * @api
 */
ol.Object.prototype.get = function(key) {
  var value;
  var accessors = this.accessors_;
  if (accessors.hasOwnProperty(key)) {
    var accessor = accessors[key];
    var target = accessor.target;
    var targetKey = accessor.targetKey;
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
 */
ol.Object.prototype.notify = function(key) {
  var eventType = ol.Object.getChangeEventType(key);
  this.dispatchEvent(eventType);
  this.dispatchEvent(
      new ol.ObjectEvent(ol.ObjectEventType.PROPERTYCHANGE, key));
};


/**
 * Sets a value.
 * @param {string} key Key name.
 * @param {*} value Value.
 * @api
 */
ol.Object.prototype.set = function(key, value) {
  this.dispatchEvent(
      new ol.ObjectEvent(ol.ObjectEventType.BEFOREPROPERTYCHANGE, key));
  var accessors = this.accessors_;
  if (accessors.hasOwnProperty(key)) {
    var accessor = accessors[key];
    var target = accessor.target;
    var targetKey = accessor.targetKey;
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
    this.notify(key);
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

  // unregister any beforechange listener
  var listenerKey = this.beforeChangeListeners_[key];
  if (listenerKey) {
    goog.events.unlistenByKey(listenerKey);
    delete this.beforeChangeListeners_[key];
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
