goog.provide('ol.events.Event');


/**
 * @constructor
 * @param {ol.events.EventType|string} type Type.
 * @param {Object=} opt_target Target.
 */
ol.events.Event = function(type, opt_target) {

  /**
   * @type {boolean}
   */
  this.propagationStopped;

  /**
   * @type {string}
   */
  this.type = type;

  /**
   * @type {Object|undefined}
   */
  this.target = opt_target;

};


/**
 * Stop event propagation
 */
ol.events.Event.prototype.preventDefault =
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
