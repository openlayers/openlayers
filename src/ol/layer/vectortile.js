goog.provide('ol.layer.VectorTile');

goog.require('ol');
goog.require('ol.LayerType');
goog.require('ol.asserts');
goog.require('ol.layer.TileProperty');
goog.require('ol.layer.Vector');
goog.require('ol.layer.VectorTileRenderType');
goog.require('ol.obj');


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
ol.layer.VectorTile = function(opt_options) {
  var options = opt_options ? opt_options : {};

  var baseOptions = ol.obj.assign({}, options);

  delete baseOptions.preload;
  delete baseOptions.useInterimTilesOnError;
  ol.layer.Vector.call(this,  /** @type {olx.layer.VectorOptions} */ (baseOptions));

  this.setPreload(options.preload ? options.preload : 0);
  this.setUseInterimTilesOnError(options.useInterimTilesOnError ?
    options.useInterimTilesOnError : true);

  ol.asserts.assert(options.renderMode == undefined ||
      options.renderMode == ol.layer.VectorTileRenderType.IMAGE ||
      options.renderMode == ol.layer.VectorTileRenderType.HYBRID ||
      options.renderMode == ol.layer.VectorTileRenderType.VECTOR,
  28); // `renderMode` must be `'image'`, `'hybrid'` or `'vector'`

  /**
   * @private
   * @type {ol.layer.VectorTileRenderType|string}
   */
  this.renderMode_ = options.renderMode || ol.layer.VectorTileRenderType.HYBRID;

  /**
   * The layer type.
   * @protected
   * @type {ol.LayerType}
   */
  this.type = ol.LayerType.VECTOR_TILE;

};
ol.inherits(ol.layer.VectorTile, ol.layer.Vector);


/**
 * Return the level as number to which we will preload tiles up to.
 * @return {number} The level to preload tiles up to.
 * @observable
 * @api
 */
ol.layer.VectorTile.prototype.getPreload = function() {
  return /** @type {number} */ (this.get(ol.layer.TileProperty.PRELOAD));
};


/**
 * @return {ol.layer.VectorTileRenderType|string} The render mode.
 */
ol.layer.VectorTile.prototype.getRenderMode = function() {
  return this.renderMode_;
};


/**
 * Whether we use interim tiles on error.
 * @return {boolean} Use interim tiles on error.
 * @observable
 * @api
 */
ol.layer.VectorTile.prototype.getUseInterimTilesOnError = function() {
  return /** @type {boolean} */ (
    this.get(ol.layer.TileProperty.USE_INTERIM_TILES_ON_ERROR));
};


/**
 * Set the level as number to which we will preload tiles up to.
 * @param {number} preload The level to preload tiles up to.
 * @observable
 * @api
 */
ol.layer.VectorTile.prototype.setPreload = function(preload) {
  this.set(ol.layer.TileProperty.PRELOAD, preload);
};


/**
 * Set whether we use interim tiles on error.
 * @param {boolean} useInterimTilesOnError Use interim tiles on error.
 * @observable
 * @api
 */
ol.layer.VectorTile.prototype.setUseInterimTilesOnError = function(useInterimTilesOnError) {
  this.set(
      ol.layer.TileProperty.USE_INTERIM_TILES_ON_ERROR, useInterimTilesOnError);
};


/**
 * Return the associated {@link ol.source.VectorTile vectortilesource} of the layer.
 * @function
 * @return {ol.source.VectorTile} Source.
 * @api
 */
ol.layer.VectorTile.prototype.getSource;
