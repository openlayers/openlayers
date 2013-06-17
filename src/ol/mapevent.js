goog.provide('ol.MapEvent');
goog.provide('ol.MapEventType');

goog.require('goog.events.Event');
goog.require('ol.FrameState');


/**
 * @enum {string}
 */
ol.MapEventType = {
  POSTRENDER: 'postrender'
};



/**
 * @constructor
 * @extends {goog.events.Event}
 * @param {string} type Event type.
 * @param {ol.Map} map Map.
 * @param {?ol.FrameState=} opt_frameState Frame state.
 */
ol.MapEvent = function(type, map, opt_frameState) {

  goog.base(this, type);

  /**
   * @type {ol.Map}
   */
  this.map = map;

  /**
   * @type {?ol.FrameState}
   */
  this.frameState = goog.isDef(opt_frameState) ? opt_frameState : null;

};
goog.inherits(ol.MapEvent, goog.events.Event);
