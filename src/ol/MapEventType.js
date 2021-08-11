/**
 * @module ol/MapEventType
 */

/**
 * @enum {string}
 */
const MapEventType = {
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
};

export default MapEventType;

/***
 * @typedef {'postrender'|'movestart'|'moveend'} Types
 */
