/**
 * @module ol/events/EventTarget
 */
import {inherits} from '../util.js';
import Disposable from '../Disposable.js';
import {unlistenAll} from '../events.js';
import {UNDEFINED} from '../functions.js';
import Event from '../events/Event.js';


/**
 * @typedef {EventTarget|module:ol/events/EventTarget} EventTargetLike
 */


/**
 * @classdesc
 * A simplified implementation of the W3C DOM Level 2 EventTarget interface.
 * @see {@link https://www.w3.org/TR/2000/REC-DOM-Level-2-Events-20001113/events.html#Events-EventTarget}
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
 *
 * @constructor
 * @extends {module:ol/Disposable}
 */
const EventTarget = function() {

  Disposable.call(this);

  /**
   * @private
   * @type {!Object.<string, number>}
   */
  this.pendingRemovals_ = {};

  /**
   * @private
   * @type {!Object.<string, number>}
   */
  this.dispatching_ = {};

  /**
   * @private
   * @type {!Object.<string, Array.<module:ol/events~ListenerFunction>>}
   */
  this.listeners_ = {};

};

inherits(EventTarget, Disposable);


/**
 * @param {string} type Type.
 * @param {module:ol/events~ListenerFunction} listener Listener.
 */
EventTarget.prototype.addEventListener = function(type, listener) {
  let listeners = this.listeners_[type];
  if (!listeners) {
    listeners = this.listeners_[type] = [];
  }
  if (listeners.indexOf(listener) === -1) {
    listeners.push(listener);
  }
};


/**
 * @param {{type: string,
 *     target: (EventTarget|module:ol/events/EventTarget|undefined)}|module:ol/events/Event|
 *     string} event Event or event type.
 * @return {boolean|undefined} `false` if anyone called preventDefault on the
 *     event object or if any of the listeners returned false.
 */
EventTarget.prototype.dispatchEvent = function(event) {
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
        this.removeEventListener(type, UNDEFINED);
      }
      delete this.dispatching_[type];
    }
    return propagate;
  }
};


/**
 * @inheritDoc
 */
EventTarget.prototype.disposeInternal = function() {
  unlistenAll(this);
};


/**
 * Get the listeners for a specified event type. Listeners are returned in the
 * order that they will be called in.
 *
 * @param {string} type Type.
 * @return {Array.<module:ol/events~ListenerFunction>} Listeners.
 */
EventTarget.prototype.getListeners = function(type) {
  return this.listeners_[type];
};


/**
 * @param {string=} opt_type Type. If not provided,
 *     `true` will be returned if this EventTarget has any listeners.
 * @return {boolean} Has listeners.
 */
EventTarget.prototype.hasListener = function(opt_type) {
  return opt_type ?
    opt_type in this.listeners_ :
    Object.keys(this.listeners_).length > 0;
};


/**
 * @param {string} type Type.
 * @param {module:ol/events~ListenerFunction} listener Listener.
 */
EventTarget.prototype.removeEventListener = function(type, listener) {
  const listeners = this.listeners_[type];
  if (listeners) {
    const index = listeners.indexOf(listener);
    if (type in this.pendingRemovals_) {
      // make listener a no-op, and remove later in #dispatchEvent()
      listeners[index] = UNDEFINED;
      ++this.pendingRemovals_[type];
    } else {
      listeners.splice(index, 1);
      if (listeners.length === 0) {
        delete this.listeners_[type];
      }
    }
  }
};
export default EventTarget;
