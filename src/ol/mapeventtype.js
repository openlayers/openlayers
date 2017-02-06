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
   * Triggered after the map is moved.
   * @event ol.MapEvent#moveend
   * @api
   */
  MOVEEND: 'moveend'

};
