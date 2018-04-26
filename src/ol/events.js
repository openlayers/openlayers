/**
 * @module ol/events
 */
import {clear} from './obj.js';


/**
 * Key to use with {@link module:ol/Observable~Observable#unByKey}.
 * @typedef {Object} EventsKey
 * @property {Object} [bindTo]
 * @property {module:ol/events~ListenerFunction} [boundListener]
 * @property {boolean} callOnce
 * @property {number} [deleteIndex]
 * @property {module:ol/events~ListenerFunction} listener
 * @property {EventTarget|module:ol/events/EventTarget} target
 * @property {string} type
 * @api
 */


/**
 * Listener function. This function is called with an event object as argument.
 * When the function returns `false`, event propagation will stop.
 *
 * @typedef {function(module:ol/events/Event)|function(module:ol/events/Event): boolean} ListenerFunction
 * @api
 */


/**
 * @param {module:ol/events~EventsKey} listenerObj Listener object.
 * @return {module:ol/events~ListenerFunction} Bound listener.
 */
export function bindListener(listenerObj) {
  const boundListener = function(evt) {
    const listener = listenerObj.listener;
    const bindTo = listenerObj.bindTo || listenerObj.target;
    if (listenerObj.callOnce) {
      unlistenByKey(listenerObj);
    }
    return listener.call(bindTo, evt);
  };
  listenerObj.boundListener = boundListener;
  return boundListener;
}


/**
 * Finds the matching {@link module:ol/events~EventsKey} in the given listener
 * array.
 *
 * @param {!Array<!module:ol/events~EventsKey>} listeners Array of listeners.
 * @param {!Function} listener The listener function.
 * @param {Object=} opt_this The `this` value inside the listener.
 * @param {boolean=} opt_setDeleteIndex Set the deleteIndex on the matching
 *     listener, for {@link module:ol/events~unlistenByKey}.
 * @return {module:ol/events~EventsKey|undefined} The matching listener object.
 */
export function findListener(listeners, listener, opt_this, opt_setDeleteIndex) {
  let listenerObj;
  for (let i = 0, ii = listeners.length; i < ii; ++i) {
    listenerObj = listeners[i];
    if (listenerObj.listener === listener &&
        listenerObj.bindTo === opt_this) {
      if (opt_setDeleteIndex) {
        listenerObj.deleteIndex = i;
      }
      return listenerObj;
    }
  }
  return undefined;
}


/**
 * @param {module:ol/events/EventTarget~EventTargetLike} target Target.
 * @param {string} type Type.
 * @return {Array.<module:ol/events~EventsKey>|undefined} Listeners.
 */
export function getListeners(target, type) {
  const listenerMap = target.ol_lm;
  return listenerMap ? listenerMap[type] : undefined;
}


/**
 * Get the lookup of listeners.  If one does not exist on the target, it is
 * created.
 * @param {module:ol/events/EventTarget~EventTargetLike} target Target.
 * @return {!Object.<string, Array.<module:ol/events~EventsKey>>} Map of
 *     listeners by event type.
 */
function getListenerMap(target) {
  let listenerMap = target.ol_lm;
  if (!listenerMap) {
    listenerMap = target.ol_lm = {};
  }
  return listenerMap;
}


/**
 * Clean up all listener objects of the given type.  All properties on the
 * listener objects will be removed, and if no listeners remain in the listener
 * map, it will be removed from the target.
 * @param {module:ol/events/EventTarget~EventTargetLike} target Target.
 * @param {string} type Type.
 */
function removeListeners(target, type) {
  const listeners = getListeners(target, type);
  if (listeners) {
    for (let i = 0, ii = listeners.length; i < ii; ++i) {
      target.removeEventListener(type, listeners[i].boundListener);
      clear(listeners[i]);
    }
    listeners.length = 0;
    const listenerMap = target.ol_lm;
    if (listenerMap) {
      delete listenerMap[type];
      if (Object.keys(listenerMap).length === 0) {
        delete target.ol_lm;
      }
    }
  }
}


/**
 * Registers an event listener on an event target. Inspired by
 * {@link https://google.github.io/closure-library/api/source/closure/goog/events/events.js.src.html}
 *
 * This function efficiently binds a `listener` to a `this` object, and returns
 * a key for use with {@link module:ol/events~unlistenByKey}.
 *
 * @param {module:ol/events/EventTarget~EventTargetLike} target Event target.
 * @param {string} type Event type.
 * @param {module:ol/events~ListenerFunction} listener Listener.
 * @param {Object=} opt_this Object referenced by the `this` keyword in the
 *     listener. Default is the `target`.
 * @param {boolean=} opt_once If true, add the listener as one-off listener.
 * @return {module:ol/events~EventsKey} Unique key for the listener.
 */
export function listen(target, type, listener, opt_this, opt_once) {
  const listenerMap = getListenerMap(target);
  let listeners = listenerMap[type];
  if (!listeners) {
    listeners = listenerMap[type] = [];
  }
  let listenerObj = findListener(listeners, listener, opt_this, false);
  if (listenerObj) {
    if (!opt_once) {
      // Turn one-off listener into a permanent one.
      listenerObj.callOnce = false;
    }
  } else {
    listenerObj = /** @type {module:ol/events~EventsKey} */ ({
      bindTo: opt_this,
      callOnce: !!opt_once,
      listener: listener,
      target: target,
      type: type
    });
    target.addEventListener(type, bindListener(listenerObj));
    listeners.push(listenerObj);
  }

  return listenerObj;
}


/**
 * Registers a one-off event listener on an event target. Inspired by
 * {@link https://google.github.io/closure-library/api/source/closure/goog/events/events.js.src.html}
 *
 * This function efficiently binds a `listener` as self-unregistering listener
 * to a `this` object, and returns a key for use with
 * {@link module:ol/events~unlistenByKey} in case the listener needs to be
 * unregistered before it is called.
 *
 * When {@link module:ol/events~listen} is called with the same arguments after this
 * function, the self-unregistering listener will be turned into a permanent
 * listener.
 *
 * @param {module:ol/events/EventTarget~EventTargetLike} target Event target.
 * @param {string} type Event type.
 * @param {module:ol/events~ListenerFunction} listener Listener.
 * @param {Object=} opt_this Object referenced by the `this` keyword in the
 *     listener. Default is the `target`.
 * @return {module:ol/events~EventsKey} Key for unlistenByKey.
 */
export function listenOnce(target, type, listener, opt_this) {
  return listen(target, type, listener, opt_this, true);
}


/**
 * Unregisters an event listener on an event target. Inspired by
 * {@link https://google.github.io/closure-library/api/source/closure/goog/events/events.js.src.html}
 *
 * To return a listener, this function needs to be called with the exact same
 * arguments that were used for a previous {@link module:ol/events~listen} call.
 *
 * @param {module:ol/events/EventTarget~EventTargetLike} target Event target.
 * @param {string} type Event type.
 * @param {module:ol/events~ListenerFunction} listener Listener.
 * @param {Object=} opt_this Object referenced by the `this` keyword in the
 *     listener. Default is the `target`.
 */
export function unlisten(target, type, listener, opt_this) {
  const listeners = getListeners(target, type);
  if (listeners) {
    const listenerObj = findListener(listeners, listener, opt_this, true);
    if (listenerObj) {
      unlistenByKey(listenerObj);
    }
  }
}


/**
 * Unregisters event listeners on an event target. Inspired by
 * {@link https://google.github.io/closure-library/api/source/closure/goog/events/events.js.src.html}
 *
 * The argument passed to this function is the key returned from
 * {@link module:ol/events~listen} or {@link module:ol/events~listenOnce}.
 *
 * @param {module:ol/events~EventsKey} key The key.
 */
export function unlistenByKey(key) {
  if (key && key.target) {
    key.target.removeEventListener(key.type, key.boundListener);
    const listeners = getListeners(key.target, key.type);
    if (listeners) {
      const i = 'deleteIndex' in key ? key.deleteIndex : listeners.indexOf(key);
      if (i !== -1) {
        listeners.splice(i, 1);
      }
      if (listeners.length === 0) {
        removeListeners(key.target, key.type);
      }
    }
    clear(key);
  }
}


/**
 * Unregisters all event listeners on an event target. Inspired by
 * {@link https://google.github.io/closure-library/api/source/closure/goog/events/events.js.src.html}
 *
 * @param {module:ol/events/EventTarget~EventTargetLike} target Target.
 */
export function unlistenAll(target) {
  const listenerMap = getListenerMap(target);
  for (const type in listenerMap) {
    removeListeners(target, type);
  }
}
