/**
 * @module ol/events/Target
 */
import Disposable from '../Disposable.js';
import {unlistenAll} from '../events.js';
import {VOID} from '../functions.js';
import Event from './Event.js';


/**
 * @typedef {EventTarget|Target} EventTargetLike
 */


/**
 * @classdesc
 * A simplified implementation of the W3C DOM Level 2 EventTarget interface.
 * See https://www.w3.org/TR/2000/REC-DOM-Level-2-Events-20001113/events.html#Events-EventTarget.
 *
 * There are two important simplifications compared to the specification:
 *
 * 1. The handling of `useCapture` in `addEventListener` and
 *    `removeEventListener`. There is no real capture model.
 * 2. The handling of `stopPropagation` and `preventDefault` on `dispatchEvent`.
 *    There is no event target hierarchy. When a listener calls
 *    `stopPropagation` or `preventDefault` on an event object, it means that no
 *    more listeners after this one will be called. Same as when the listener
 *    returns false.
 */
class Target extends Disposable {
  constructor() {

    super();

    /**
     * @private
     * @type {!Object<string, number>}
     */
    this.pendingRemovals_ = {};

    /**
     * @private
     * @type {!Object<string, number>}
     */
    this.dispatching_ = {};

    /**
     * @private
     * @type {!Object<string, Array<import("../events.js").ListenerFunction>>}
     */
    this.listeners_ = {};

  }

  /**
   * @param {string} type Type.
   * @param {import("../events.js").ListenerFunction} listener Listener.
   */
  addEventListener(type, listener) {
    let listeners = this.listeners_[type];
    if (!listeners) {
      listeners = this.listeners_[type] = [];
    }
    if (listeners.indexOf(listener) === -1) {
      listeners.push(listener);
    }
  }

  /**
   * Dispatches an event and calls all listeners listening for events
   * of this type. The event parameter can either be a string or an
   * Object with a `type` property.
   *
   * @param {{type: string,
   *     target: (EventTargetLike|undefined),
   *     propagationStopped: (boolean|undefined)}|
   *     import("./Event.js").default|string} event Event object.
   * @return {boolean|undefined} `false` if anyone called preventDefault on the
   *     event object or if any of the listeners returned false.
   * @api
   */
  dispatchEvent(event) {
    const evt = typeof event === 'string' ? new Event(event) : event;
    const type = evt.type;
    evt.target = this;
    const listeners = this.listeners_[type];
    let propagate;
    if (listeners) {
      if (!(type in this.dispatching_)) {
        this.dispatching_[type] = 0;
        this.pendingRemovals_[type] = 0;
      }
      ++this.dispatching_[type];
      for (let i = 0, ii = listeners.length; i < ii; ++i) {
        if (listeners[i].call(this, evt) === false || evt.propagationStopped) {
          propagate = false;
          break;
        }
      }
      --this.dispatching_[type];
      if (this.dispatching_[type] === 0) {
        let pendingRemovals = this.pendingRemovals_[type];
        delete this.pendingRemovals_[type];
        while (pendingRemovals--) {
          this.removeEventListener(type, VOID);
        }
        delete this.dispatching_[type];
      }
      return propagate;
    }
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    unlistenAll(this);
  }

  /**
   * Get the listeners for a specified event type. Listeners are returned in the
   * order that they will be called in.
   *
   * @param {string} type Type.
   * @return {Array<import("../events.js").ListenerFunction>} Listeners.
   */
  getListeners(type) {
    return this.listeners_[type];
  }

  /**
   * @param {string=} opt_type Type. If not provided,
   *     `true` will be returned if this event target has any listeners.
   * @return {boolean} Has listeners.
   */
  hasListener(opt_type) {
    return opt_type ?
      opt_type in this.listeners_ :
      Object.keys(this.listeners_).length > 0;
  }

  /**
   * @param {string} type Type.
   * @param {import("../events.js").ListenerFunction} listener Listener.
   */
  removeEventListener(type, listener) {
    const listeners = this.listeners_[type];
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (type in this.pendingRemovals_) {
        // make listener a no-op, and remove later in #dispatchEvent()
        listeners[index] = VOID;
        ++this.pendingRemovals_[type];
      } else {
        listeners.splice(index, 1);
        if (listeners.length === 0) {
          delete this.listeners_[type];
        }
      }
    }
  }
}


export default Target;
