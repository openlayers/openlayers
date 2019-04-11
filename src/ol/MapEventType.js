/**
 * @module ol/MapEventType
 */

/**
 * @enum {string}
 */
export default {

  /**
   * Triggered after a map frame is rendered.
   * @event module:ol/MapEvent~MapEvent#postrender
   * @api
   */
  POSTRENDER: 'postrender',

  /**
   * Triggered when the map starts moving.
   * @event module:ol/MapEvent~MapEvent#movestart
   * @api
   */
  MOVESTART: 'movestart',

  /**
   * Triggered after the map is moved.
   * @event module:ol/MapEvent~MapEvent#moveend
   * @api
   */
  MOVEEND: 'moveend',

  /**
   * Triggered after the map entered fullscreen.
   * @event module:ol/MapEvent~MapEvent#enterfullscreen
   * @api
   */
  ENTERFULLSCREEN: 'enterfullscreen',

  /**
   * Triggered after the map leave fullscreen.
   * @event module:ol/MapEvent~MapEvent#leavefullscreen
   * @api
   */
  LEAVEFULLSCREEN: 'leavefullscreen'

};
