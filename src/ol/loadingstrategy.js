goog.provide('ol.loadingstrategy');

goog.require('ol.TileCoord');


/**
 * @param {ol.Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @return {Array.<ol.Extent>} Extents.
 * @todo api
 */
ol.loadingstrategy.all = function(extent, resolution) {
  return [[-Infinity, -Infinity, Infinity, Infinity]];
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @return {Array.<ol.Extent>} Extents.
 * @todo api
 */
ol.loadingstrategy.bbox = function(extent, resolution) {
  return [extent];
};


/**
 * @param {ol.tilegrid.TileGrid} tileGrid Tile grid.
 * @return {function(ol.Extent, number): Array.<ol.Extent>} Loading strategy.
 * @todo api
 */
ol.loadingstrategy.createTile = function(tileGrid) {
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
        var tileCoord = new ol.TileCoord(z, 0, 0);
        for (tileCoord.x = tileRange.minX; tileCoord.x <= tileRange.maxX;
             ++tileCoord.x) {
          for (tileCoord.y = tileRange.minY; tileCoord.y <= tileRange.maxY;
               ++tileCoord.y) {
            extents.push(tileGrid.getTileCoordExtent(tileCoord));
          }
        }
        return extents;
      });
};
