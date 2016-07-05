goog.provide('ol.events.Event');


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
ol.events.Event = function(type) {

  /**
   * @type {boolean}
   */
  this.propagationStopped;

  /**
   * The event type.
   * @type {string}
   * @api stable
   */
  this.type = type;

  /**
   * The event target.
   * @type {Object}
   * @api stable
   */
  this.target = null;

};


/**
 * Stop event propagation.
 * @function
 * @api stable
 */
ol.events.Event.prototype.preventDefault =

/**
 * Stop event propagation.
 * @function
 * @api stable
 */
ol.events.Event.prototype.stopPropagation = function() {
  this.propagationStopped = true;
};


/**
 * @param {Event|ol.events.Event} evt Event
 */
ol.events.Event.stopPropagation = function(evt) {
  evt.stopPropagation();
};


/**
 * @param {Event|ol.events.Event} evt Event
 */
ol.events.Event.preventDefault = function(evt) {
  evt.preventDefault();
};
