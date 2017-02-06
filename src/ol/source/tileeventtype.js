goog.provide('ol.source.TileEventType');

/**
 * @enum {string}
 */
ol.source.TileEventType = {

  /**
   * Triggered when a tile starts loading.
   * @event ol.source.Tile.Event#tileloadstart
   * @api
   */
  TILELOADSTART: 'tileloadstart',

  /**
   * Triggered when a tile finishes loading.
   * @event ol.source.Tile.Event#tileloadend
   * @api
   */
  TILELOADEND: 'tileloadend',

  /**
   * Triggered if tile loading results in an error.
   * @event ol.source.Tile.Event#tileloaderror
   * @api
   */
  TILELOADERROR: 'tileloaderror'

};
