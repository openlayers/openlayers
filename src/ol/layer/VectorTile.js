/**
 * @module ol/layer/VectorTile
 */
import {inherits} from '../index.js';
import LayerType from '../LayerType.js';
import {assert} from '../asserts.js';
import TileProperty from '../layer/TileProperty.js';
import VectorLayer from '../layer/Vector.js';
import VectorTileRenderType from '../layer/VectorTileRenderType.js';
import {assign} from '../obj.js';

/**
 * @classdesc
 * Layer for vector tile data that is rendered client-side.
 * Note that any property set in the options is set as a {@link ol.Object}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @constructor
 * @extends {ol.layer.Vector}
 * @param {olx.layer.VectorTileOptions=} opt_options Options.
 * @api
 */
const VectorTileLayer = function(opt_options) {
  const options = opt_options ? opt_options : {};

  let renderMode = options.renderMode || VectorTileRenderType.HYBRID;
  assert(renderMode == undefined ||
      renderMode == VectorTileRenderType.IMAGE ||
      renderMode == VectorTileRenderType.HYBRID ||
      renderMode == VectorTileRenderType.VECTOR,
  28); // `renderMode` must be `'image'`, `'hybrid'` or `'vector'`
  if (options.declutter && renderMode == VectorTileRenderType.IMAGE) {
    renderMode = VectorTileRenderType.HYBRID;
  }
  options.renderMode = renderMode;

  const baseOptions = assign({}, options);

  delete baseOptions.preload;
  delete baseOptions.useInterimTilesOnError;
  VectorLayer.call(this,  /** @type {olx.layer.VectorOptions} */ (baseOptions));

  this.setPreload(options.preload ? options.preload : 0);
  this.setUseInterimTilesOnError(options.useInterimTilesOnError ?
    options.useInterimTilesOnError : true);

  /**
   * The layer type.
   * @protected
   * @type {ol.LayerType}
   */
  this.type = LayerType.VECTOR_TILE;

};

inherits(VectorTileLayer, VectorLayer);


/**
 * Return the level as number to which we will preload tiles up to.
 * @return {number} The level to preload tiles up to.
 * @observable
 * @api
 */
VectorTileLayer.prototype.getPreload = function() {
  return (/** @type {number} */ this.get(TileProperty.PRELOAD));
};


/**
 * Whether we use interim tiles on error.
 * @return {boolean} Use interim tiles on error.
 * @observable
 * @api
 */
VectorTileLayer.prototype.getUseInterimTilesOnError = function() {
  return (/** @type {boolean} */ this.get(TileProperty.USE_INTERIM_TILES_ON_ERROR));
};


/**
 * Set the level as number to which we will preload tiles up to.
 * @param {number} preload The level to preload tiles up to.
 * @observable
 * @api
 */
VectorTileLayer.prototype.setPreload = function(preload) {
  this.set(TileProperty.PRELOAD, preload);
};


/**
 * Set whether we use interim tiles on error.
 * @param {boolean} useInterimTilesOnError Use interim tiles on error.
 * @observable
 * @api
 */
VectorTileLayer.prototype.setUseInterimTilesOnError = function(useInterimTilesOnError) {
  this.set(TileProperty.USE_INTERIM_TILES_ON_ERROR, useInterimTilesOnError);
};


/**
 * Return the associated {@link ol.source.VectorTile vectortilesource} of the layer.
 * @function
 * @return {ol.source.VectorTile} Source.
 * @api
 */
VectorTileLayer.prototype.getSource;
export default VectorTileLayer;
