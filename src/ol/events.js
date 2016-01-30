goog.provide('ol.events');
goog.provide('ol.events.EventType');
goog.provide('ol.events.KeyCode');

goog.require('goog.asserts');
goog.require('goog.object');


/**
 * @enum {string}
 * @const
 */
ol.events.EventType = {
  /**
   * Generic change event.
   * @event ol.events.Event#change
   * @api
   */
  CHANGE: 'change',

  CLICK: 'click',
  DBLCLICK: 'dblclick',
  DRAGENTER: 'dragenter',
  DRAGOVER: 'dragover',
  DROP: 'drop',
  ERROR: 'error',
  KEYDOWN: 'keydown',
  KEYPRESS: 'keypress',
  LOAD: 'load',
  MOUSEDOWN: 'mousedown',
  MOUSEMOVE: 'mousemove',
  MOUSEOUT: 'mouseout',
  MOUSEUP: 'mouseup',
  MOUSEWHEEL: 'mousewheel',
  MSPOINTERDOWN: 'mspointerdown',
  RESIZE: 'resize',
  TOUCHSTART: 'touchstart',
  TOUCHMOVE: 'touchmove',
  TOUCHEND: 'touchend',
  WHEEL: 'wheel'
};


/**
 * @enum {number}
 * @const
 */
ol.events.KeyCode = {
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40
};


// Event manager inspired by
// https://google.github.io/closure-library/api/source/closure/goog/events/events.js.src.html


/**
 * Property name on an event target for the listener map associated with the
 * event target.
 * @const {string}
 * @private
 */
ol.events.LISTENER_MAP_PROP_ = 'olm_' + ((Math.random() * 1e6) | 0);


/**
 * @typedef {EventTarget|ol.events.EventTarget|
 *     {addEventListener: function(string, Function, boolean=),
 *     removeEventListener: function(string, Function, boolean=)}}
 */
ol.events.EventTargetLike;


/**
 * Key to use with {@link ol.Observable#unByKey}.
 *
 * @typedef {ol.events.ListenerObjType|Array.<ol.events.ListenerObjType>}
 * @api
 */
ol.events.Key;


/**
 * Listener function. This function is called with an event object as argument.
 * When the function returns `false`, event propagation will stop.
 *
 * @typedef {function(ol.events.Event)|function(ol.events.Event): boolean}
 * @api
 */
ol.events.ListenerFunctionType;


/**
 * @typedef {{bindTo: (Object|undefined),
 *     boundListener: (ol.events.ListenerFunctionType|undefined),
 *     callOnce: boolean,
 *     listener: ol.events.ListenerFunctionType,
 *     target: (EventTarget|ol.events.EventTarget),
 *     type: (ol.events.EventType|string),
 *     useCapture: boolean}}
 */
ol.events.ListenerObjType;


/**
 * @param {ol.events.ListenerFunctionType} listener Listener.
 * @param {ol.events.ListenerObjType} listenerObj Listener object.
 * @return {ol.events.ListenerFunctionType} Bound listener.
 */
ol.events.bindListener_ = function(listener, listenerObj) {
  return function(evt) {
    var rv = listenerObj.listener.call(listenerObj.bindTo, evt);
    if (listenerObj.callOnce) {
      ol.events.unlistenByKey(listenerObj);
    }
    return rv;
  }
};


/**
 * Finds the matching {@link ol.events.ListenerObjType} in the given listener
 * array.
 * @param {!Array<!ol.events.ListenerObjType>} listenerArray Array of listeners.
 * @param {!Function} listener The listener function.
 * @param {boolean} useCapture The capture flag for the listener.
 * @param {Object=} opt_this The `this` value inside the listener.
 * @param {boolean=} opt_remove Remove the found listener from the array.
 * @return {ol.events.ListenerObjType|undefined} The matching listener.
 * @private
 */
ol.events.findListener_ = function(
    listenerArray, listener, useCapture, opt_this, opt_remove) {
  var listenerObj;
  for (var i = 0, ii = listenerArray.length; i < ii; ++i) {
    listenerObj = listenerArray[i];
    if (listenerObj.listener === listener &&
        listenerObj.useCapture == useCapture &&
        listenerObj.bindTo === opt_this) {
      if (opt_remove) {
        listenerArray.splice(i, 1);
      }
      return listenerObj;
    }
  }
  return undefined;
};


/**
 * @param {EventTarget|ol.events.EventTarget} target Event target.
 * @param {ol.events.EventType|string|Array.<(ol.events.EventType|string)>} type
 *     Event t@param {Event|ol.events.Event} event Event to dispatch on the
 *     `target`.
 * @param {Event|ol.events.Event} event Event.
 */
ol.events.fireListeners = function(target, type, event) {
  event.type = type;
  target.dispatchEvent(event);
};


/**
 * @param {ol.events.EventTargetLike} target Target.
 * @param {ol.events.EventType|string} type Type.
 * @return {Array.<ol.events.ListenerObjType>|undefined} Listeners.
 */
ol.events.getListeners = function(target, type) {
  var listenerMap = target[ol.events.LISTENER_MAP_PROP_];
  return listenerMap ? listenerMap[type] : undefined;
};


/**
 * @param {EventTarget|ol.events.EventTarget|
 *     {removeEventListener: function(string, Function, boolean=)}} target
 *     Event target.
 * @param {ol.events.EventType|string|Array.<(ol.events.EventType|string)>} type
 *     Event type.
 * @param {ol.events.ListenerFunctionType} listener Listener.
 * @param {boolean=} opt_useCapture Use capture. For listeners on an
 *     {@link ol.events.EventTarget}, `true` simply means that the listener will
 *     be called before already registered listeners. Default is false.
 * @param {Object=} opt_this Object referenced by the `this` keyword in the
 *     listener. Default is the `target`.
 * @param {boolean=} opt_once If true, add the listener as one-off listener.
 * @return {ol.events.Key} Unique key for the listener.
 */
ol.events.listen = function(
    target, type, listener, opt_useCapture, opt_this, opt_once) {
  if (Array.isArray(type)) {
    var keys = [];
    type.forEach(function(t) {
      keys.push(ol.events.listen(target, t, listener, opt_useCapture, opt_this,
          opt_once));
    });
    return keys;
  }
  goog.asserts.assertString(type);
  var useCapture = !!opt_useCapture;
  var listenerMap = target[ol.events.LISTENER_MAP_PROP_];
  if (!listenerMap) {
    target[ol.events.LISTENER_MAP_PROP_] = listenerMap = {};
  }
  var listenerArray = listenerMap[type];
  if (!listenerArray) {
    listenerArray = listenerMap[type] = [];
  }
  var listenerObj = ol.events.findListener_(listenerArray, listener, useCapture,
      opt_this);
  if (listenerObj) {
    if (!opt_once) {
      // Turn one-off listener into a permanent one.
      listenerObj.callOnce = false;
    }
  } else {
    listenerObj = /** @type {ol.events.ListenerObjType} */ ({
      bindTo: opt_this,
      callOnce: !!opt_once,
      listener: listener,
      target: target,
      type: type,
      useCapture: useCapture
    });
    listenerObj.boundListener = ol.events.bindListener_(listener, listenerObj);
    target.addEventListener(type, listenerObj.boundListener, useCapture);
    listenerArray.push(listenerObj);
  }

  return listenerObj;
};


/**
 * @param {ol.events.EventTargetLike} target Event target.
 * @param {ol.events.EventType|string|Array.<(ol.events.EventType|string)>} type
 *     Event type.
 * @param {ol.events.ListenerFunctionType} listener Listener.
 * @param {boolean=} opt_useCapture Use capture. For listeners on an
 *     {@link ol.events.EventTarget}, `true` simply means that the listener will
 *     be called before already registered listeners. Default is false.
 * @param {Object=} opt_this Object referenced by the `this` keyword in the
 *     listener. Default is the `target`.
 * @return {ol.events.Key} Key for unlistenByKey.
 */
ol.events.listenOnce = function(
    target, type, listener, opt_useCapture, opt_this) {
  return ol.events.listen(target, type, listener, opt_useCapture, opt_this,
      true);
};


/**
 * @param {ol.events.EventTargetLike} target Event target.
 * @param {ol.events.EventType|string|Array.<(ol.events.EventType|string)>} type
 *     Event type.
 * @param {ol.events.ListenerFunctionType} listener Listener.
 * @param {boolean=} opt_useCapture Use capture. For listeners on an
 *     {@link ol.events.EventTarget}, `true` simply means that the listener will
 *     be called before already registered listeners. Default is false.
 * @param {Object=} opt_this Object referenced by the `this` keyword in the
 *     listener. Default is the `target`.
 */
ol.events.unlisten = function(
    target, type, listener, opt_useCapture, opt_this) {
  if (Array.isArray(type)) {
    type.forEach(function(t) {
      ol.events.unlisten(target, t, listener, opt_useCapture, opt_this);
    });
    return;
  }

  var listenerArray = ol.events.getListeners(target, type);
  if (listenerArray) {
    var listenerObj = ol.events.findListener_(listenerArray, listener,
        !!opt_useCapture, opt_this);
    if (listenerObj) {
      ol.events.unlistenByKey(listenerObj);
    }
  }
};


/**
 * @param {ol.events.Key} key Key or keys.
 */
ol.events.unlistenByKey = function(key) {
  if (Array.isArray(key)) {
    key.forEach(ol.events.unlistenByKey);
    return;
  }

  if (key && key.target) {
    key.target.removeEventListener(key.type, key.boundListener, key.useCapture);
    var listenerArray = ol.events.getListeners(key.target, key.type);
    if (listenerArray) {
      ol.events.findListener_(listenerArray, key.listener,
          key.useCapture, key.bindTo, true);
      if (listenerArray.length === 0) {
        var listenerMap = key.target[ol.events.LISTENER_MAP_PROP_];
        delete listenerMap[key.type];
        if (Object.keys(listenerMap).length === 0) {
          delete key.target[ol.events.LISTENER_MAP_PROP_];
        }
      }
    }
    goog.object.clear(key);
  }
};


/**
 * @param {EventTarget|ol.events.EventTarget} target Target.
 */
ol.events.unlistenAll = function(target) {
  var listenerMap = target[ol.events.LISTENER_MAP_PROP_];
  if (listenerMap) {
    for (var type in listenerMap) {
      ol.events.unlistenByKey(listenerMap[type]);
    }
  }
};
