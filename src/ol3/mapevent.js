goog.provide('ol3.MapEvent');

goog.require('goog.events.Event');



/**
 * @constructor
 * @extends {goog.events.Event}
 * @param {string} type Event type.
 * @param {ol3.Map} map Map.
 */
ol3.MapEvent = function(type, map) {

  goog.base(this, type);

  /**
   * @type {ol3.Map}
   */
  this.map = map;

  /**
   * @type {boolean}
   */
  this.defaultPrevented = false;

};
goog.inherits(ol3.MapEvent, goog.events.Event);


/**
 * Prevents the default action.
 */
ol3.MapEvent.prototype.preventDefault = function() {
  goog.base(this, 'preventDefault');
  this.defaultPrevented = true;
};
