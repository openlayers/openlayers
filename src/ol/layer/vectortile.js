goog.provide('ol.layer.VectorTile');

goog.require('ol');
goog.require('ol.asserts');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
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
      options.renderMode == ol.layer.VectorTile.RenderType.IMAGE ||
      options.renderMode == ol.layer.VectorTile.RenderType.HYBRID ||
      options.renderMode == ol.layer.VectorTile.RenderType.VECTOR,
      28); // `renderMode` must be `'image'`, `'hybrid'` or `'vector'`

  /**
   * @private
   * @type {ol.layer.VectorTile.RenderType|string}
   */
  this.renderMode_ = options.renderMode || ol.layer.VectorTile.RenderType.HYBRID;

};
ol.inherits(ol.layer.VectorTile, ol.layer.Vector);


/**
 * Return the level as number to which we will preload tiles up to.
 * @return {number} The level to preload tiles up to.
 * @observable
 * @api
 */
ol.layer.VectorTile.prototype.getPreload = function() {
  return /** @type {number} */ (this.get(ol.layer.VectorTile.Property.PRELOAD));
};


/**
 * @return {ol.layer.VectorTile.RenderType|string} The render mode.
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
      this.get(ol.layer.VectorTile.Property.USE_INTERIM_TILES_ON_ERROR));
};


/**
 * Set the level as number to which we will preload tiles up to.
 * @param {number} preload The level to preload tiles up to.
 * @observable
 * @api
 */
ol.layer.VectorTile.prototype.setPreload = function(preload) {
  this.set(ol.layer.Tile.Property.PRELOAD, preload);
};


/**
 * Set whether we use interim tiles on error.
 * @param {boolean} useInterimTilesOnError Use interim tiles on error.
 * @observable
 * @api
 */
ol.layer.VectorTile.prototype.setUseInterimTilesOnError = function(useInterimTilesOnError) {
  this.set(
      ol.layer.Tile.Property.USE_INTERIM_TILES_ON_ERROR, useInterimTilesOnError);
};


/**
 * @enum {string}
 */
ol.layer.VectorTile.Property = {
  PRELOAD: 'preload',
  USE_INTERIM_TILES_ON_ERROR: 'useInterimTilesOnError'
};


/**
 * @enum {string}
 * Render mode for vector tiles:
 *  * `'image'`: Vector tiles are rendered as images. Great performance, but
 *    point symbols and texts are always rotated with the view and pixels are
 *    scaled during zoom animations.
 *  * `'hybrid'`: Polygon and line elements are rendered as images, so pixels
 *    are scaled during zoom animations. Point symbols and texts are accurately
 *    rendered as vectors and can stay upright on rotated views.
 *  * `'vector'`: Vector tiles are rendered as vectors. Most accurate rendering
 *    even during animations, but slower performance than the other options.
 * @api
 */
ol.layer.VectorTile.RenderType = {
  IMAGE: 'image',
  HYBRID: 'hybrid',
  VECTOR: 'vector'
};
