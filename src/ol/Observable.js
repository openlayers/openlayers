/**
 * @module ol/Observable
 */
import {listen, unlistenByKey, unlisten, listenOnce} from './events.js';
import EventTarget from './events/Target.js';
import EventType from './events/EventType.js';

/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * An event target providing convenient methods for listener registration
 * and unregistration. A generic `change` event is always available through
 * {@link module:ol/Observable~Observable#changed}.
 *
 * @fires import("./events/Event.js").Event
 * @api
 */
class Observable extends EventTarget {
  constructor() {

    super();

    /**
     * @private
     * @type {number}
     */
    this.revision_ = 0;

  }

  /**
   * Increases the revision counter and dispatches a 'change' event.
   * @api
   */
  changed() {
    ++this.revision_;
    this.dispatchEvent(EventType.CHANGE);
  }

  /**
   * Get the version number for this object.  Each time the object is modified,
   * its version number will be incremented.
   * @return {number} Revision.
   * @api
   */
  getRevision() {
    return this.revision_;
  }

  /**
   * Listen for a certain type of event.
   * @param {string|Array<string>} type The event type or array of event types.
   * @param {function(?): ?} listener The listener function.
   * @return {import("./events.js").EventsKey|Array<import("./events.js").EventsKey>} Unique key for the listener. If
   *     called with an array of event types as the first argument, the return
   *     will be an array of keys.
   * @api
   */
  on(type, listener) {
    if (Array.isArray(type)) {
      const len = type.length;
      const keys = new Array(len);
      for (let i = 0; i < len; ++i) {
        keys[i] = listen(this, type[i], listener);
      }
      return keys;
    } else {
      return listen(this, /** @type {string} */ (type), listener);
    }
  }

  /**
   * Listen once for a certain type of event.
   * @param {string|Array<string>} type The event type or array of event types.
   * @param {function(?): ?} listener The listener function.
   * @return {import("./events.js").EventsKey|Array<import("./events.js").EventsKey>} Unique key for the listener. If
   *     called with an array of event types as the first argument, the return
   *     will be an array of keys.
   * @api
   */
  once(type, listener) {
    if (Array.isArray(type)) {
      const len = type.length;
      const keys = new Array(len);
      for (let i = 0; i < len; ++i) {
        keys[i] = listenOnce(this, type[i], listener);
      }
      return keys;
    } else {
      return listenOnce(this, /** @type {string} */ (type), listener);
    }
  }

  /**
   * Unlisten for a certain type of event.
   * @param {string|Array<string>} type The event type or array of event types.
   * @param {function(?): ?} listener The listener function.
   * @api
   */
  un(type, listener) {
    if (Array.isArray(type)) {
      for (let i = 0, ii = type.length; i < ii; ++i) {
        unlisten(this, type[i], listener);
      }
      return;
    } else {
      unlisten(this, /** @type {string} */ (type), listener);
    }
  }
}


/**
 * Removes an event listener using the key returned by `on()` or `once()`.
 * @param {import("./events.js").EventsKey|Array<import("./events.js").EventsKey>} key The key returned by `on()`
 *     or `once()` (or an array of keys).
 * @api
 */
export function unByKey(key) {
  if (Array.isArray(key)) {
    for (let i = 0, ii = key.length; i < ii; ++i) {
      unlistenByKey(key[i]);
    }
  } else {
    unlistenByKey(/** @type {import("./events.js").EventsKey} */ (key));
  }
}


export default Observable;
