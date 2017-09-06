import _ol_ from '../index';
import _ol_LayerType_ from '../layertype';
import _ol_asserts_ from '../asserts';
import _ol_layer_TileProperty_ from '../layer/tileproperty';
import _ol_layer_Vector_ from '../layer/vector';
import _ol_layer_VectorTileRenderType_ from '../layer/vectortilerendertype';
import _ol_obj_ from '../obj';

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
var _ol_layer_VectorTile_ = function(opt_options) {
  var options = opt_options ? opt_options : {};

  var baseOptions = _ol_obj_.assign({}, options);

  delete baseOptions.preload;
  delete baseOptions.useInterimTilesOnError;
  _ol_layer_Vector_.call(this,  /** @type {olx.layer.VectorOptions} */ (baseOptions));

  this.setPreload(options.preload ? options.preload : 0);
  this.setUseInterimTilesOnError(options.useInterimTilesOnError ?
    options.useInterimTilesOnError : true);

  _ol_asserts_.assert(options.renderMode == undefined ||
      options.renderMode == _ol_layer_VectorTileRenderType_.IMAGE ||
      options.renderMode == _ol_layer_VectorTileRenderType_.HYBRID ||
      options.renderMode == _ol_layer_VectorTileRenderType_.VECTOR,
  28); // `renderMode` must be `'image'`, `'hybrid'` or `'vector'`

  /**
   * @private
   * @type {ol.layer.VectorTileRenderType|string}
   */
  this.renderMode_ = options.renderMode || _ol_layer_VectorTileRenderType_.HYBRID;

  /**
   * The layer type.
   * @protected
   * @type {ol.LayerType}
   */
  this.type = _ol_LayerType_.VECTOR_TILE;

};

_ol_.inherits(_ol_layer_VectorTile_, _ol_layer_Vector_);


/**
 * Return the level as number to which we will preload tiles up to.
 * @return {number} The level to preload tiles up to.
 * @observable
 * @api
 */
_ol_layer_VectorTile_.prototype.getPreload = function() {
  return (
  /** @type {number} */ this.get(_ol_layer_TileProperty_.PRELOAD)
  );
};


/**
 * @return {ol.layer.VectorTileRenderType|string} The render mode.
 */
_ol_layer_VectorTile_.prototype.getRenderMode = function() {
  return this.renderMode_;
};


/**
 * Whether we use interim tiles on error.
 * @return {boolean} Use interim tiles on error.
 * @observable
 * @api
 */
_ol_layer_VectorTile_.prototype.getUseInterimTilesOnError = function() {
  return (
  /** @type {boolean} */ this.get(_ol_layer_TileProperty_.USE_INTERIM_TILES_ON_ERROR)
  );
};


/**
 * Set the level as number to which we will preload tiles up to.
 * @param {number} preload The level to preload tiles up to.
 * @observable
 * @api
 */
_ol_layer_VectorTile_.prototype.setPreload = function(preload) {
  this.set(_ol_layer_TileProperty_.PRELOAD, preload);
};


/**
 * Set whether we use interim tiles on error.
 * @param {boolean} useInterimTilesOnError Use interim tiles on error.
 * @observable
 * @api
 */
_ol_layer_VectorTile_.prototype.setUseInterimTilesOnError = function(useInterimTilesOnError) {
  this.set(
      _ol_layer_TileProperty_.USE_INTERIM_TILES_ON_ERROR, useInterimTilesOnError);
};


/**
 * Return the associated {@link ol.source.VectorTile vectortilesource} of the layer.
 * @function
 * @return {ol.source.VectorTile} Source.
 * @api
 */
_ol_layer_VectorTile_.prototype.getSource;
export default _ol_layer_VectorTile_;
