/**
 * @module ol/layer/WebGLTile
 */
import BaseTileLayer from './BaseTile.js';


/**
 * @typedef {import("./BaseTile.js").Options} Options
 */


/**
 * @classdesc
 * For layer sources that provide pre-rendered, tiled images in grids that are
 * organized by zoom levels for specific resolutions.
 * Note that any property set in the options is set as a {@link module:ol/Object~BaseObject}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @api
 */
class WebGLTileLayer extends BaseTileLayer {

  /**
   * @param {Options=} opt_options Tile layer options.
   */
  constructor(opt_options) {
    super(opt_options);
  }

  /**
   * Create a renderer for this layer.
   * @return {import("../renderer/Layer.js").default} A layer renderer.
   * @protected
   */
  createRenderer() {
    // TODO: rework WebGL renderers to share context
    return null;
  }

}

export default WebGLTileLayer;
