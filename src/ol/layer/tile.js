goog.provide('ol.layer.Tile');

goog.require('ol');
goog.require('ol.layer.Layer');
goog.require('ol.obj');


/**
 * @enum {string}
 */
ol.layer.TileProperty = {
  PRELOAD: 'preload',
  USE_INTERIM_TILES_ON_ERROR: 'useInterimTilesOnError'
};


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
 * @api stable
 */
ol.layer.Tile = function(opt_options) {
  var options = opt_options ? opt_options : {};

  var baseOptions = ol.obj.assign({}, options);

  delete baseOptions.preload;
  delete baseOptions.useInterimTilesOnError;
  ol.layer.Layer.call(this,  /** @type {olx.layer.LayerOptions} */ (baseOptions));

  this.setPreload(options.preload !== undefined ? options.preload : 0);
  this.setUseInterimTilesOnError(options.useInterimTilesOnError !== undefined ?
      options.useInterimTilesOnError : true);
};
ol.inherits(ol.layer.Tile, ol.layer.Layer);


/**
 * Return the level as number to which we will preload tiles up to.
 * @return {number} The level to preload tiles up to.
 * @observable
 * @api
 */
ol.layer.Tile.prototype.getPreload = function() {
  return /** @type {number} */ (this.get(ol.layer.TileProperty.PRELOAD));
};


/**
 * Return the associated {@link ol.source.Tile tilesource} of the layer.
 * @function
 * @return {ol.source.Tile} Source.
 * @api stable
 */
ol.layer.Tile.prototype.getSource;


/**
 * Set the level as number to which we will preload tiles up to.
 * @param {number} preload The level to preload tiles up to.
 * @observable
 * @api
 */
ol.layer.Tile.prototype.setPreload = function(preload) {
  this.set(ol.layer.TileProperty.PRELOAD, preload);
};


/**
 * Whether we use interim tiles on error.
 * @return {boolean} Use interim tiles on error.
 * @observable
 * @api
 */
ol.layer.Tile.prototype.getUseInterimTilesOnError = function() {
  return /** @type {boolean} */ (
      this.get(ol.layer.TileProperty.USE_INTERIM_TILES_ON_ERROR));
};


/**
 * Set whether we use interim tiles on error.
 * @param {boolean} useInterimTilesOnError Use interim tiles on error.
 * @observable
 * @api
 */
ol.layer.Tile.prototype.setUseInterimTilesOnError = function(useInterimTilesOnError) {
  this.set(
      ol.layer.TileProperty.USE_INTERIM_TILES_ON_ERROR, useInterimTilesOnError);
};
