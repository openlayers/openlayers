/**
 * @module ol/source/GlTiles
 */

export default class GlTiledTextureAbstract {
  /**
   * The basis of concrete GlTiledTextures. Needs subclasses to implement the getTiledData() method.
   */
  constructor() {}

  /**
   * @property {import("../tilegrid/TileGrid.js").default} [tileGrid] Tile grid.
   * @param {import("../tilecoord.js").TileCoord} tileCoord Tile coordinate (for the given TileGrid).
   * @param {import("../size.js").Size} tileSize Tile size.
   * @param {import("../extent.js").Extent} tileExtent BBox of the tile, in the map's display CRS.
   *
   * @return {Promise<TypedArray>}
   *
   * Must returns a Promise to a TypedArray (Uint8Array, Float32Array, etc) for the given extents
   * and tile grid/coordinate.
   */
  getTiledData(tileGrid, tileCoord, tileSize, tileExtent) {
    return Promise.reject();
  }
}

