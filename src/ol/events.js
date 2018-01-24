/**
 * @module ol/events
 */
import {clear} from './obj.js';


/**
 * @param {ol.EventsKey} listenerObj Listener object.
 * @return {ol.EventsListenerFunctionType} Bound listener.
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
 * Finds the matching {@link ol.EventsKey} in the given listener
 * array.
 *
 * @param {!Array<!ol.EventsKey>} listeners Array of listeners.
 * @param {!Function} listener The listener function.
 * @param {Object=} opt_this The `this` value inside the listener.
 * @param {boolean=} opt_setDeleteIndex Set the deleteIndex on the matching
 *     listener, for {@link ol.events.unlistenByKey}.
 * @return {ol.EventsKey|undefined} The matching listener object.
 */
export function findListener(listeners, listener, opt_this,
  opt_setDeleteIndex) {
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
 * @param {ol.EventTargetLike} target Target.
 * @param {string} type Type.
 * @return {Array.<ol.EventsKey>|undefined} Listeners.
 */
export function getListeners(target, type) {
  const listenerMap = target.ol_lm;
  return listenerMap ? listenerMap[type] : undefined;
}


/**
 * Get the lookup of listeners.  If one does not exist on the target, it is
 * created.
 * @param {ol.EventTargetLike} target Target.
 * @return {!Object.<string, Array.<ol.EventsKey>>} Map of
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
 * @param {ol.EventTargetLike} target Target.
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
 * a key for use with {@link ol.events.unlistenByKey}.
 *
 * @param {ol.EventTargetLike} target Event target.
 * @param {string} type Event type.
 * @param {ol.EventsListenerFunctionType} listener Listener.
 * @param {Object=} opt_this Object referenced by the `this` keyword in the
 *     listener. Default is the `target`.
 * @param {boolean=} opt_once If true, add the listener as one-off listener.
 * @return {ol.EventsKey} Unique key for the listener.
 */
export function listen(target, type, listener, opt_this, opt_once) {
  const listenerMap = getListenerMap(target);
  let listeners = listenerMap[type];
  if (!listeners) {
    listeners = listenerMap[type] = [];
  }
  let listenerObj = findListener(listeners, listener, opt_this,
    false);
  if (listenerObj) {
    if (!opt_once) {
      // Turn one-off listener into a permanent one.
      listenerObj.callOnce = false;
    }
  } else {
    listenerObj = /** @type {ol.EventsKey} */ ({
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
 * {@link ol.events.unlistenByKey} in case the listener needs to be unregistered
 * before it is called.
 *
 * When {@link ol.events.listen} is called with the same arguments after this
 * function, the self-unregistering listener will be turned into a permanent
 * listener.
 *
 * @param {ol.EventTargetLike} target Event target.
 * @param {string} type Event type.
 * @param {ol.EventsListenerFunctionType} listener Listener.
 * @param {Object=} opt_this Object referenced by the `this` keyword in the
 *     listener. Default is the `target`.
 * @return {ol.EventsKey} Key for unlistenByKey.
 */
export function listenOnce(target, type, listener, opt_this) {
  return listen(target, type, listener, opt_this, true);
}


/**
 * Unregisters an event listener on an event target. Inspired by
 * {@link https://google.github.io/closure-library/api/source/closure/goog/events/events.js.src.html}
 *
 * To return a listener, this function needs to be called with the exact same
 * arguments that were used for a previous {@link ol.events.listen} call.
 *
 * @param {ol.EventTargetLike} target Event target.
 * @param {string} type Event type.
 * @param {ol.EventsListenerFunctionType} listener Listener.
 * @param {Object=} opt_this Object referenced by the `this` keyword in the
 *     listener. Default is the `target`.
 */
export function unlisten(target, type, listener, opt_this) {
  const listeners = getListeners(target, type);
  if (listeners) {
    const listenerObj = findListener(listeners, listener, opt_this,
      true);
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
 * {@link ol.events.listen} or {@link ol.events.listenOnce}.
 *
 * @param {ol.EventsKey} key The key.
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
 * @param {ol.EventTargetLike} target Target.
 */
export function unlistenAll(target) {
  const listenerMap = getListenerMap(target);
  for (const type in listenerMap) {
    removeListeners(target, type);
  }
}
