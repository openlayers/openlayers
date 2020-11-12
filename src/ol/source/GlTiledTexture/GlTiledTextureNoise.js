import GlTiledTextureAbstract from './GlTiledTextureAbstract.js'

/**
 * @module ol/source/GlTiles
 */

export default class GlTiledTextureTerrainRGB extends GlTiledTextureAbstract {
  /**
   * @param {XYZ} arrayType Instance of XYZ tile source for the
   *
   * A wrapper over a XYZ tile source. Unpacks elevation data from Terrain-RGB-encoded
   * tiles. Expects tiles to follow the Mapbox Terrain-RGB format, as per
   * https://docs.mapbox.com/help/troubleshooting/access-elevation-data/
   */
  constructor(xyz) {
    this.xyz = xyz;
  }

  /**
   * @param {import("../tilegrid/TileGrid.js").default} [tileGrid] Tile grid.
   * @param {import("../tilecoord.js").TileCoord} tileCoord Tile coordinate (for the given TileGrid).
   * @param {import("../size.js").Size} tileSize Tile size.
   * @param {import("../extent.js").Extent} tileExtent BBox of the tile, in the map's display CRS.
   *
   * @return {Promise<TypedArray>}
   */
  getTiledData(tileGrid, tileCoord, tileSize, tileExtent) {
    return Promise.resolve(
      (new this.arrayType_(tileSize[0] * tileSize[1]))
      .map(()=>Math.random() * (this.range_) + this.min_)
    );

  }

}
