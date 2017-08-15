goog.provide('ol.MapEvent');

goog.require('ol');
goog.require('ol.events.Event');


/**
 * @classdesc
 * Events emitted as map events are instances of this type.
 * See {@link ol.Map} for which events trigger a map event.
 *
 * @constructor
 * @extends {ol.events.Event}
 * @implements {oli.MapEvent}
 * @param {string} type Event type.
 * @param {ol.PluggableMap} map Map.
 * @param {?olx.FrameState=} opt_frameState Frame state.
 */
ol.MapEvent = function(type, map, opt_frameState) {

  ol.events.Event.call(this, type);

  /**
   * The map where the event occurred.
   * @type {ol.PluggableMap}
   * @api
   */
  this.map = map;

  /**
   * The frame state at the time of the event.
   * @type {?olx.FrameState}
   * @api
   */
  this.frameState = opt_frameState !== undefined ? opt_frameState : null;

};
ol.inherits(ol.MapEvent, ol.events.Event);
