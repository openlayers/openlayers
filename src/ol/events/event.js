/**
 * @classdesc
 * Stripped down implementation of the W3C DOM Level 2 Event interface.
 * @see {@link https://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-interface}
 *
 * This implementation only provides `type` and `target` properties, and
 * `stopPropagation` and `preventDefault` methods. It is meant as base class
 * for higher level events defined in the library, and works with
 * {@link ol.events.EventTarget}.
 *
 * @constructor
 * @implements {oli.events.Event}
 * @param {string} type Type.
 */
var _ol_events_Event_ = function(type) {

  /**
   * @type {boolean}
   */
  this.propagationStopped;

  /**
   * The event type.
   * @type {string}
   * @api
   */
  this.type = type;

  /**
   * The event target.
   * @type {Object}
   * @api
   */
  this.target = null;

};


/**
 * Stop event propagation.
 * @function
 * @override
 * @api
 */
_ol_events_Event_.prototype.preventDefault =

  /**
   * Stop event propagation.
   * @function
   * @override
   * @api
   */
  _ol_events_Event_.prototype.stopPropagation = function() {
    this.propagationStopped = true;
  };


/**
 * @param {Event|ol.events.Event} evt Event
 */
_ol_events_Event_.stopPropagation = function(evt) {
  evt.stopPropagation();
};


/**
 * @param {Event|ol.events.Event} evt Event
 */
_ol_events_Event_.preventDefault = function(evt) {
  evt.preventDefault();
};
export default _ol_events_Event_;
