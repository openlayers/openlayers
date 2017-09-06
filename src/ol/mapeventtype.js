/**
 * @enum {string}
 */
var _ol_MapEventType_ = {

  /**
   * Triggered after a map frame is rendered.
   * @event ol.MapEvent#postrender
   * @api
   */
  POSTRENDER: 'postrender',

  /**
   * Triggered when the map starts moving.
   * @event ol.MapEvent#movestart
   * @api
   */
  MOVESTART: 'movestart',

  /**
   * Triggered after the map is moved.
   * @event ol.MapEvent#moveend
   * @api
   */
  MOVEEND: 'moveend'

};

export default _ol_MapEventType_;
