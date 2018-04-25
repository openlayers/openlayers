/**
 * @module ol/loadingstrategy
 */


/**
 * Strategy function for loading all features with a single request.
 * @param {module:ol/extent~Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @return {Array.<module:ol/extent~Extent>} Extents.
 * @api
 */
export function all(extent, resolution) {
  return [[-Infinity, -Infinity, Infinity, Infinity]];
}


/**
 * Strategy function for loading features based on the view's extent and
 * resolution.
 * @param {module:ol/extent~Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @return {Array.<module:ol/extent~Extent>} Extents.
 * @api
 */
export function bbox(extent, resolution) {
  return [extent];
}


/**
 * Creates a strategy function for loading features based on a tile grid.
 * @param {module:ol/tilegrid/TileGrid} tileGrid Tile grid.
 * @return {function(module:ol/extent~Extent, number): Array.<module:ol/extent~Extent>} Loading strategy.
 * @api
 */
export function tile(tileGrid) {
  return (
    /**
     * @param {module:ol/extent~Extent} extent Extent.
     * @param {number} resolution Resolution.
     * @return {Array.<module:ol/extent~Extent>} Extents.
     */
    function(extent, resolution) {
      const z = tileGrid.getZForResolution(resolution);
      const tileRange = tileGrid.getTileRangeForExtentAndZ(extent, z);
      /** @type {Array.<module:ol/extent~Extent>} */
      const extents = [];
      /** @type {module:ol/tilecoord~TileCoord} */
      const tileCoord = [z, 0, 0];
      for (tileCoord[1] = tileRange.minX; tileCoord[1] <= tileRange.maxX; ++tileCoord[1]) {
        for (tileCoord[2] = tileRange.minY; tileCoord[2] <= tileRange.maxY; ++tileCoord[2]) {
          extents.push(tileGrid.getTileCoordExtent(tileCoord));
        }
      }
      return extents;
    }
  );
}
