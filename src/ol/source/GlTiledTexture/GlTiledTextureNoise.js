/**
 * @module ol/source/GlTiledTexture/GlTiledTextureNoise
 */

import GlTiledTextureAbstract from './GlTiledTextureAbstract.js';

/**
 * @typedef {Object} Options
 * @param {Object} [arrayType=Uint8Array] Prototype for the desired TypedArray
 * @param {number} [min=0] Minimum value for the noise
 * @param {number} [max=255] Maximum value for the noise
 * @param {string} [fetchFuncName] Name of the texture fetch function to be defined in the fragment shader code
 */

export default class GlTiledTextureTerrainRGB extends GlTiledTextureAbstract {
  /**
   * @param {Options=} options
   * A noise generator. Constructor must receive the prototype of a TypedArray
   * (e.g. "Uint8Array" itself, and not an existing typed array). Each tile will
   * contain (pseudo-)random noise between the given minimum and maximum.
   */
  constructor({arrayType, min, max, fetchFuncName}) {
    super(fetchFuncName);
    this.arrayType_ = arrayType || Uint8Array;
    this.min_ = min || 0;
    this.max_ = max || 255;
    this.range_ = this.max_ - this.min_;
  }

  /**
   * @inheritDoc
   */
  getTiledData({tileGrid, tileCoord, tileSize, tileExtent}) {
    return Promise.resolve(
      new this.arrayType_(tileSize[0] * tileSize[1]).map(
        () => Math.random() * this.range_ + this.min_
      )
    );
  }
}
