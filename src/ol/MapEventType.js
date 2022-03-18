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
   * Triggered when loading of additional map data (tiles, images, features) starts.
   * @event module:ol/render/Event~RenderEvent#loadstart
   * @api
   */
  LOADSTART: 'loadstart',

  /**
   * Triggered when loading of additional map data has completed.
   * @event module:ol/render/Event~RenderEvent#loadend
   * @api
   */
  LOADEND: 'loadend',
};

/***
 * @typedef {'postrender'|'movestart'|'moveend'|'loadstart'|'loadend'} Types
 */
