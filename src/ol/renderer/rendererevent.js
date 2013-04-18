goog.provide('ol.renderer.Event');
goog.provide('ol.renderer.EventType');

goog.require('goog.events.Event');


/**
 * @enum {string}
 */
ol.renderer.EventType = {
  CHANGE: 'change'
};



/**
 * @constructor
 * @extends {goog.events.Event}
 * @param {string} type Type.
 * @param {boolean} immediate Immediate.
 * @param {Object=} opt_target Target.
 */
ol.renderer.Event = function(type, immediate, opt_target) {

  goog.base(this, type, opt_target);

  /**
   * @type {boolean}
   */
  this.immediate = immediate;

};
goog.inherits(ol.renderer.Event, goog.events.Event);
