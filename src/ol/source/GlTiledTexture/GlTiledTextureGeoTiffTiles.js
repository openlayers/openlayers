import GlTiledTextureAbstract from './GlTiledTextureAbstract.js'

/**
 * @module ol/source/GlTiles
 */

export default class GlTiledTextureGeoTiffTiles extends GlTiledTextureAbstract {
  /**
   * @param {TileImage} xyz Instance of TileImage / XYZ tile source for the Terrain-RGB tiles
   * @param {Function} geotiffFactory Factory function to create GeoTIFF instances from URLs. Should be `GeoTIFF.fromUrl`
   * @param {number=0} sample Which sample (AKA channel) to query (zero-indexed). For WebGL1
   * compatibility, only one channel per instance is allowed.
   * @param {number=-999} fillValue Value to be used for pixels with no data.
   * @param {string=undefined} fetchFuncName
   *
   * A wrapper of GeoTIFF.js functionality. Extracts data from *one* GeoTIFF file
   * in such a way that can be fed to a GlTiles source.
   */
  constructor(xyz, geotiffFactory, sample=0, fillValue = -999, fetchFuncName = undefined ) {
    super(fetchFuncName);
    this.sample_ = sample;
    this.fillValue_ = fillValue;
    this.factory_ = geotiffFactory;
    this.xyz_ = xyz;

    this.anyTile_ = new Promise((res, rej)=>{
      this.resolveAnyTile_ = res;
    });
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

    const urlTileCoord = this.xyz_.getTileCoordForTileUrlFunction(tileCoord/*, projection*/);
//     const url = this.tileUrlFunction(urlTileCoord, pixelRatio, projection);
    const url = this.xyz_.tileUrlFunction(urlTileCoord);

    return this.factory_(url).then(tiff=>tiff.getImage()).then(img=>{
      this.resolveAnyTile_(img);
      const bbox = img.getBoundingBox();

      return img.readRasters({
//         window: bbox,
//         width: bbox[2] - bbox[0],
//         height: bbox[3] - bbox[1],
//         resampleMethod: 'nearest',
        width: tileSize[0],
        height: tileSize[1],
        samples: [this.sample_],
        fillValue: this.fillValue_
      }).then(rasters=>{
//         console.log(rasters[0]);
//         console.warn(img, bbox, tileSize, rasters);
        console.warn(img, bbox, tileSize, tileGrid);
        return rasters[0]
      });
    });

  }

  /**
   * @param {String} uniformName BBox of the tile, in the map's display CRS.
   * @return {Promise<String>}
   *
   * Returns a string containing valid GLSL shader code, defining a function
   * with the name provided at instantiation time, taking data from the uniform name
   * passed at run time.
   *
   * This wraps over any 16- or 32-bit data packed into the WebGL1 4x8-bit RGBA texture.
   */
  getFetchFunctionDef(uniformName){
    return this.anyTile_.then((img)=>{
      const dir = img.getFileDirectory();
      const bits = dir.BitsPerSample[this.sample_];
      const format = dir.SampleFormat[this.sample_]; // 1 = uint; 2 = int; 3 = float

      let body = '';

      if (bits === 8 && format === 1) {
        body = `return texel.x * 256.;`;
      } else if (bits === 8 && format === 2) {
        /// TODO: Check if .x > 128.0 and shift by -256.0??
        body = `return texel.x * 256.;`;
      } else if (bits === 16 && format === 1) {
        body = `return texel.x * 256. + texel.a * 65536.0;`;
      } else if (bits === 16 && format === 2) {
        /// TODO: Check if .y > 128.0 and shift by -256.0??
        body = `return texel.x * 256. + texel.a * 65536.0;`;
      } else {
        if (format === 1) {
          console.warn(`GeoTIFF pixel format not yet implemented (${bits} bits, uint)`);
        } else if (format === 2) {
          console.warn(`GeoTIFF pixel format not yet implemented (${bits} bits, int)`);
        } else if (format === 2) {
          console.warn(`GeoTIFF pixel format not yet implemented (${bits} bits, float)`);
        } else {
          console.warn(`GeoTIFF pixel format not yet implemented (${bits} bits, unknown uint/int/float)`);
        }
        return Promise.reject();
      }

      return `float ${this.fetchFuncName_}(vec2 texelCoords) {
        vec4 texel = texture2D(${uniformName}, texelCoords.st);
        ${body}
      }`
    });

  }

}
