goog.provide('ol.layer.Tile');

goog.require('ol.layer.Layer');


/**
 * @enum {string}
 */
ol.layer.TileProperty = {
  PRELOAD: 'preload',
  USE_INTERIM_TILES_ON_ERROR: 'useInterimTilesOnError'
};



/**
 * @constructor
 * @extends {ol.layer.Layer}
 * @fires {@link ol.render.Event} ol.render.Event
 * @param {olx.layer.TileOptions} options Tile layer options.
 * @todo observable preload {number} the level to preload tiles up to
 * @todo api
 */
ol.layer.Tile = function(options) {
  goog.base(this, options);

};
goog.inherits(ol.layer.Tile, ol.layer.Layer);


/**
 * @return {number|undefined} Preload.
 */
ol.layer.Tile.prototype.getPreload = function() {
  return /** @type {number|undefined} */ (
      this.get(ol.layer.TileProperty.PRELOAD));
};
goog.exportProperty(
    ol.layer.Tile.prototype,
    'getPreload',
    ol.layer.Tile.prototype.getPreload);


/**
 * @param {number} preload Preload.
 */
ol.layer.Tile.prototype.setPreload = function(preload) {
  this.set(ol.layer.TileProperty.PRELOAD, preload);
};
goog.exportProperty(
    ol.layer.Tile.prototype,
    'setPreload',
    ol.layer.Tile.prototype.setPreload);


/**
 * @return {boolean|undefined} Use interim tiles on error.
 */
ol.layer.Tile.prototype.getUseInterimTilesOnError = function() {
  return /** @type {boolean|undefined} */ (
      this.get(ol.layer.TileProperty.USE_INTERIM_TILES_ON_ERROR));
};
goog.exportProperty(
    ol.layer.Tile.prototype,
    'getUseInterimTilesOnError',
    ol.layer.Tile.prototype.getUseInterimTilesOnError);


/**
 * @param {boolean|undefined} useInterimTilesOnError Use interim tiles on error.
 */
ol.layer.Tile.prototype.setUseInterimTilesOnError =
    function(useInterimTilesOnError) {
  this.set(
      ol.layer.TileProperty.USE_INTERIM_TILES_ON_ERROR, useInterimTilesOnError);
};
goog.exportProperty(
    ol.layer.Tile.prototype,
    'setUseInterimTilesOnError',
    ol.layer.Tile.prototype.setUseInterimTilesOnError);
