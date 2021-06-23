/**
 * @module ol/render/EventType
 */

/**
 * @enum {string}
 */
export default {
  /**
   * Triggered before a layer is rendered.
   * @event module:ol/render/Event~RenderEvent#prerender
   * @api
   */
  PRERENDER: 'prerender',

  /**
   * Triggered after a layer is rendered.
   * @event module:ol/render/Event~RenderEvent#postrender
   * @api
   */
  POSTRENDER: 'postrender',

  /**
   * Triggered before layers are rendered.
   * The event object will not have a `context` set.
   * @event module:ol/render/Event~RenderEvent#precompose
   * @api
   */
  PRECOMPOSE: 'precompose',

  /**
   * Triggered after all layers are rendered.
   * The event object will not have a `context` set.
   * @event module:ol/render/Event~RenderEvent#postcompose
   * @api
   */
  POSTCOMPOSE: 'postcompose',

  /**
   * Triggered when rendering is complete, i.e. all sources and tiles have
   * finished loading for the current viewport, and all tiles are faded in.
   * The event object will not have a `context` set.
   * @event module:ol/render/Event~RenderEvent#rendercomplete
   * @api
   */
  RENDERCOMPLETE: 'rendercomplete',
};

/**
 * @typedef {'postrender'|'precompose'|'postcompose'|'rendercomplete'} MapRenderEventTypes
 */

/**
 * @typedef {'postrender'|'prerender'} LayerRenderEventTypes
 */
