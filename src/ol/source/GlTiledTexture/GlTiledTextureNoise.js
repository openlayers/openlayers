import GlTiledTextureAbstract from './GlTiledTextureAbstract.js';

/**
 * @module ol/source/GlTiles
 */

export default class GlTiledTextureTerrainRGB extends GlTiledTextureAbstract {
  /**
   * @param {Object=Uint8Array} arrayType Prototype for the desired TypedArray
   * @param {Number=0} min Minimum value for the noise
   * @param {Number=255} max Maximum value for the noise
   * @param {string=undefined} fetchFuncName Name of the texture fetch function to be defined in the fragment shader code
   *
   * A noise generator. Constructor must receive the prototype of a TypedArray
   * (e.g. "Uint8Array" itself, and not an existing typed array). Each tile will
   * contain (pseudo-)random noise between the given minimum and maximum.
   */
  constructor(arrayType = Uint8Array, min = 0, max = 255, fetchFuncName) {
    super(fetchFuncName);
    this.arrayType_ = arrayType;
    this.min_ = min;
    this.max_ = max;
  }

  /**
   * @param {import("../tilegrid/TileGrid.js").default} [tileGrid] Tile grid.
   * @param {import("../tilecoord.js").TileCoord} tileCoord Tile coordinate (for the given TileGrid).
   * @param {import("../size.js").Size} tileSize Tile size.
   * @param {import("../extent.js").Extent} tileExtent BBox of the tile, in the map's display CRS.
   *
   * @return {Promise<TypedArray>} A set of random data for the requested tile
   */
  getTiledData(tileGrid, tileCoord, tileSize, tileExtent) {
    return Promise.resolve(
      new this.arrayType_(tileSize[0] * tileSize[1]).map(
        () => Math.random() * this.range_ + this.min_
      )
    );
  }
}
