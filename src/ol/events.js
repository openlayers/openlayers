goog.provide('ol.events');
goog.provide('ol.events.EventType');


/**
 * @enum {string}
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
  ERROR: 'error',
  LOAD: 'load',
  MOUSEDOWN: 'mousedown',
  MOUSEMOVE: 'mousemove',
  MOUSEOUT: 'mouseout',
  MSPOINTERDOWN: 'mspointerdown',
  RESIZE: 'resize',
  TOUCHSTART: 'touchstart'
};

/**
 * Key to use with {@link ol.Observable#unByKey}.
 *
 * @typedef {string|Array.<string>}
 * @api
 */
ol.events.Key;


/**
 * @typedef {{listener: ol.events.ListenerFunctionType,
 *     target: (EventTarget|ol.events.EventTarget),
 *     thisArg: (Object|undefined),
 *     type: (ol.events.EventType|Array.<ol.events.EventType>),
 *     useCapture: boolean}}
 */
ol.events.ListenerData;


/**
 * Listener function. This function is called with an event object as argument.
 * When the function returns `false`, event propagation will stop.
 *
 * @typedef {function(ol.events.Event)|function(ol.events.Event): boolean}
 * @api
 */
ol.events.ListenerFunctionType;


/**
 * @private
 * @type {Object.<ol.events.Key, ol.events.ListenerData>}
 */
ol.events.listenersByKey_ = {};


/**
 * @private
 * @param {EventTarget|ol.events.EventTarget|
 *     {removeEventListener: function(string, Function, boolean=)}} target Event target.
 * @param {ol.events.EventType|string|Array.<(ol.events.EventType|string)>} type
 *     Event type.
 * @param {ol.events.ListenerFunctionType} listener Listener.
 * @param {boolean=} opt_useCapture Use capture. For listeners on an
 *     {@link ol.events.EventTarget}, `true` simply means that the listener will
 *     be called before already registered listeners. Default is false.
 * @param {Object=} opt_this Object referenced by the `this` keyword in the
 *     listener. Default is the `target`.
 * @return {ol.events.ListenerFunctionType} Listener that unregisters itself.
 */
ol.events.createListenOnce_ = function(target, type, listener, opt_useCapture, opt_this) {
  var count = Array.isArray(type) ? type.length : 1;
  var key = ol.events.getKey.apply(undefined, arguments);
  return function listenOnce(evt) {
    listener.call(opt_this || this, evt);
    target.removeEventListener(evt.type, listenOnce, opt_useCapture);
    --count;
    if (count === 0) {
      delete ol.events.listenersByKey_[key];
    }
  }
};


/**
 * @param {EventTarget|ol.events.EventTarget} target Event target.
 * @param {ol.events.EventType|string|Array.<(ol.events.EventType|string)>} type
 *     Event type.
 * @param {Event|ol.events.Event} event Event to dispatch on the `target`.
 */
ol.events.fireListeners = function(target, type, event) {
  event.type = type;
  target.dispatchEvent(event);
};


/**
 * @param {EventTarget|ol.events.EventTarget} target Event target.
 * @param {ol.events.EventType|string|Array.<(ol.events.EventType|string)>} type
 *     Event type.
 * @param {ol.events.ListenerFunctionType} listener Listener.
 * @param {boolean=} opt_useCapture Use capture. For listeners on an
 *     {@link ol.events.EventTarget}, `true` simply means that the listener will
 *     be called before already registered listeners. Default is false.
 * @param {Object=} opt_this Object referenced by the `this` keyword in the
 *     listener. Default is the `target`.
 * @return {!ol.events.Key} Key for unlistenByKey.
 */
ol.events.getKey = function(target, type, listener, opt_useCapture, opt_this) {
  return [
    goog.getUid(target), type.toString(),goog.getUid(listener),
    Number(!!opt_useCapture), (opt_this ? goog.getUid(opt_this) : '')
  ].toString();
};


/**
 * @param {ol.events.EventTarget} target Target.
 * @param {ol.events.EventType|string} type Type.
 * @return {Array.<ol.events.ListenerFunctionType>} Listeners.
 */
ol.events.getListeners = function(target, type) {
  return target.getListeners(type);
};


/**
 * @param {EventTarget|ol.events.EventTarget|
 *     {addEventListener: function(string, Function, boolean=)}} target Event target.
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
ol.events.listen = function(target, type, listener, opt_useCapture, opt_this) {
  var targetListener = opt_this ? listener.bind(opt_this) : listener;
  //TODO remove:
  targetListener.handler = opt_this;
  var types = Array.isArray(type) ? type : [type];
  var key = ol.events.getKey.apply(undefined, arguments);
  if (!ol.events.listenersByKey_[key]) {
    for (var i = 0, ii = types.length; i < ii; ++i) {
      target.addEventListener(types[i], targetListener, opt_useCapture);
    }
    ol.events.listenersByKey_[key] = /** @type {ol.events.ListenerData} */ ({
      listener: targetListener,
      target: target,
      thisArg: opt_this,
      type: type,
      useCapture: opt_useCapture
    });
  }
  return key;
};


/**
 * @param {EventTarget|ol.events.EventTarget|
 *     {addEventListener: function(string, Function, boolean=),
 *     removeEventListener: function(string, Function, boolean=)}} target Event target.
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
ol.events.listenOnce = function(target, type, listener, opt_useCapture, opt_this) {
  var key = ol.events.getKey.apply(undefined, arguments);
  if (!ol.events.listenersByKey_[key]) {
    var targetListener = ol.events.createListenOnce_(target, type, listener,
        opt_useCapture, opt_this);
    var onceKey = ol.events.listen(target, type, targetListener, opt_useCapture);
    ol.events.listenersByKey_[key] = ol.events.listenersByKey_[onceKey];
    delete ol.events.listenersByKey_[onceKey];
  }
  return key;
};


/**
 * @param {EventTarget|ol.events.EventTarget|{removeEventListener: function(string, Function, boolean=)}} target
 *     Event target.
 * @param {ol.events.EventType|string|Array.<(ol.events.EventType|string)>} type
 *     Event type.
 * @param {ol.events.ListenerFunctionType} listener Listener.
 * @param {boolean=} opt_useCapture Use capture. For listeners on an
 *     {@link ol.events.EventTarget}, `true` simply means that the listener will
 *     be called before already registered listeners. Default is false.
 * @param {Object=} opt_this Object referenced by the `this` keyword in the
 *     listener. Default is the `target`.
 * @return {ol.events.Key} Key that the listener was referenced with.
 */
ol.events.unlisten = function(target, type, listener, opt_useCapture, opt_this) {
  var key = ol.events.getKey.apply(undefined, arguments);
  ol.events.unlistenByKey(key);
  return key;
};


/**
 * @param {ol.events.Key} key Key or keys.
 */
ol.events.unlistenByKey = function(key) {
  var listenerData = ol.events.listenersByKey_[key];
  if (listenerData) {
    var type = listenerData.type;
    var types = Array.isArray(type) ? type : [type];
    for (var i = 0, ii = types.length; i < ii; ++i) {
      listenerData.target.removeEventListener(types[i],
          listenerData.listener, listenerData.useCapture);
    }
    delete ol.events.listenersByKey_[key];
  }
};


/**
 * @param {EventTarget|ol.events.EventTarget} target Target.
 */
ol.events.unlistenAll = function(target) {
  var listenerData;
  for (var key in ol.events.listenersByKey_) {
    listenerData = ol.events.listenersByKey_[key];
    if (listenerData.target === target || listenerData.thisArg === target) {
      ol.events.unlistenByKey(key);
    }
  }
};
