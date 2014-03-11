goog.provide('ol.MapEvent');
goog.provide('ol.MapEventType');

goog.require('goog.events.Event');


/**
 * @enum {string}
 */
ol.MapEventType = {
  POSTRENDER: 'postrender',
  MOVEEND: 'moveend'
};



/**
 * @constructor
 * @extends {goog.events.Event}
 * @param {string} type Event type.
 * @param {ol.Map} map Map.
 * @param {?oli.FrameState=} opt_frameState Frame state.
 */
ol.MapEvent = function(type, map, opt_frameState) {

  goog.base(this, type);

  /**
   * @type {ol.Map}
   */
  this.map = map;

  /**
   * @type {?oli.FrameState}
   */
  this.frameState = goog.isDef(opt_frameState) ? opt_frameState : null;

};
goog.inherits(ol.MapEvent, goog.events.Event);
