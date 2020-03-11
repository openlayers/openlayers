import GlTiledTextureAbstract from './GlTiledTextureAbstract.js'

/**
 * @module ol/source/GlTiles
 */

export default class GlTiledTextureNoise extends GlTiledTextureAbstract {
  /**
   * @param {Object=Uint8Array} arrayType Prototype of the TypedArray to use.
   * @param {number=0} min Minimum value of the pseudorandom noise (inclusive).
   * @param {number=256} max maximum value of the pseudorandom noise (exclusive).
   *
   * A wrapper of Math.random(). Returns tiles with pseudorandom noise within min/max values
   */
  constructor(arrayType = Uint8Array, min=0, max = 255 ) {
    this.arrayType_ = arrayType;
    this.min_ = min;
    this.range_= max - min;
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
