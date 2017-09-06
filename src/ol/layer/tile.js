import _ol_ from '../index';
import _ol_LayerType_ from '../layertype';
import _ol_layer_Layer_ from '../layer/layer';
import _ol_layer_TileProperty_ from '../layer/tileproperty';
import _ol_obj_ from '../obj';

/**
 * @classdesc
 * For layer sources that provide pre-rendered, tiled images in grids that are
 * organized by zoom levels for specific resolutions.
 * Note that any property set in the options is set as a {@link ol.Object}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @constructor
 * @extends {ol.layer.Layer}
 * @fires ol.render.Event
 * @param {olx.layer.TileOptions=} opt_options Tile layer options.
 * @api
 */
var _ol_layer_Tile_ = function(opt_options) {
  var options = opt_options ? opt_options : {};

  var baseOptions = _ol_obj_.assign({}, options);

  delete baseOptions.preload;
  delete baseOptions.useInterimTilesOnError;
  _ol_layer_Layer_.call(this,  /** @type {olx.layer.LayerOptions} */ (baseOptions));

  this.setPreload(options.preload !== undefined ? options.preload : 0);
  this.setUseInterimTilesOnError(options.useInterimTilesOnError !== undefined ?
    options.useInterimTilesOnError : true);

  /**
   * The layer type.
   * @protected
   * @type {ol.LayerType}
   */
  this.type = _ol_LayerType_.TILE;

};

_ol_.inherits(_ol_layer_Tile_, _ol_layer_Layer_);


/**
 * Return the level as number to which we will preload tiles up to.
 * @return {number} The level to preload tiles up to.
 * @observable
 * @api
 */
_ol_layer_Tile_.prototype.getPreload = function() {
  return (
  /** @type {number} */ this.get(_ol_layer_TileProperty_.PRELOAD)
  );
};


/**
 * Return the associated {@link ol.source.Tile tilesource} of the layer.
 * @function
 * @return {ol.source.Tile} Source.
 * @api
 */
_ol_layer_Tile_.prototype.getSource;


/**
 * Set the level as number to which we will preload tiles up to.
 * @param {number} preload The level to preload tiles up to.
 * @observable
 * @api
 */
_ol_layer_Tile_.prototype.setPreload = function(preload) {
  this.set(_ol_layer_TileProperty_.PRELOAD, preload);
};


/**
 * Whether we use interim tiles on error.
 * @return {boolean} Use interim tiles on error.
 * @observable
 * @api
 */
_ol_layer_Tile_.prototype.getUseInterimTilesOnError = function() {
  return (
  /** @type {boolean} */ this.get(_ol_layer_TileProperty_.USE_INTERIM_TILES_ON_ERROR)
  );
};


/**
 * Set whether we use interim tiles on error.
 * @param {boolean} useInterimTilesOnError Use interim tiles on error.
 * @observable
 * @api
 */
_ol_layer_Tile_.prototype.setUseInterimTilesOnError = function(useInterimTilesOnError) {
  this.set(
      _ol_layer_TileProperty_.USE_INTERIM_TILES_ON_ERROR, useInterimTilesOnError);
};
export default _ol_layer_Tile_;
