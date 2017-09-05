import _ol_ from './index';
import _ol_events_Event_ from './events/event';

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
var _ol_MapEvent_ = function(type, map, opt_frameState) {

  _ol_events_Event_.call(this, type);

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

_ol_.inherits(_ol_MapEvent_, _ol_events_Event_);
export default _ol_MapEvent_;
