goog.provide('ol.loadingstrategy');


/**
 * Strategy function for loading all features with a single request.
 * @param {ol.Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @return {Array.<ol.Extent>} Extents.
 * @api
 */
ol.loadingstrategy.all = function(extent, resolution) {
  return [[-Infinity, -Infinity, Infinity, Infinity]];
};


/**
 * Strategy function for loading features based on the view's extent and
 * resolution.
 * @param {ol.Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @return {Array.<ol.Extent>} Extents.
 * @api
 */
ol.loadingstrategy.bbox = function(extent, resolution) {
  return [extent];
};


/**
 * Creates a strategy function for loading features based on a tile grid.
 * @param {ol.tilegrid.TileGrid} tileGrid Tile grid.
 * @return {function(ol.Extent, number): Array.<ol.Extent>} Loading strategy.
 * @api
 */
ol.loadingstrategy.tile = function(tileGrid) {
  return (
  /**
       * @param {ol.Extent} extent Extent.
       * @param {number} resolution Resolution.
       * @return {Array.<ol.Extent>} Extents.
       */
    function(extent, resolution) {
      var z = tileGrid.getZForResolution(resolution);
      var tileRange = tileGrid.getTileRangeForExtentAndZ(extent, z);
      /** @type {Array.<ol.Extent>} */
      var extents = [];
      /** @type {ol.TileCoord} */
      var tileCoord = [z, 0, 0];
      for (tileCoord[1] = tileRange.minX; tileCoord[1] <= tileRange.maxX;
        ++tileCoord[1]) {
        for (tileCoord[2] = tileRange.minY; tileCoord[2] <= tileRange.maxY;
          ++tileCoord[2]) {
          extents.push(tileGrid.getTileCoordExtent(tileCoord));
        }
      }
      return extents;
    });
};
