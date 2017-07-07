goog.provide('ol.MapEventType');

/**
 * @enum {string}
 */
ol.MapEventType = {

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
