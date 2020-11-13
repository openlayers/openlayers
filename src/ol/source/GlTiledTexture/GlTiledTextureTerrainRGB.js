import GlTiledTextureAbstract from './GlTiledTextureAbstract.js'
import {createCanvasContext2D} from '../../dom.js';
import {listenOnce} from '../../events.js';
import EventType from '../../events/EventType.js';

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
  constructor(xyz, fetchFuncName = undefined) {
    super(fetchFuncName);

    this.xyz = xyz;

    // Create a canvas context the size of the XYZ tile source, just to be able
    // to run getImageData() to fetch pixel values.
    let tileSize = xyz.tileGrid.tileSize_;
    if (typeof tileSize === "number") {
      tileSize = [tileSize, tileSize];
    }
    this.ctx_ = createCanvasContext2D(tileSize[0], tileSize[1]);
  }

  /**
   * @param {import("../tilegrid/TileGrid.js").default} [tileGrid] Tile grid.
   * @param {import("../tilecoord.js").TileCoord} tileCoord Tile coordinate (for the given TileGrid).
   * @param {import("../size.js").Size} tileSize Tile size.
   * @param {import("../extent.js").Extent} tileExtent BBox of the tile, in the map's display CRS.
   *
   * @return {Promise<Uint8ClampedArray>}
   */
  getTiledData(tileGrid, tileCoord, tileSize, tileExtent) {

    return new Promise((res, rej)=>{
      /**
       * TODO: Sanity checks on tileGrid, tileSize; they should match those of the XYZ
       * tile source.
       */

      const tile = this.xyz.getTile(tileCoord[0], tileCoord[1], tileCoord[2]);

      listenOnce(tile.getImage(), EventType.LOAD, (ev)=>{
        const img = ev.target || ev.path[0];

        this.ctx_.drawImage(img,
                            0, 0, tileSize[0], tileSize[1],
                            0, 0, tileSize[0], tileSize[1]);
        const imageData = this.ctx_.getImageData(0, 0, tileSize[0], tileSize[1]);
        res(imageData);
      });
      listenOnce(tile.getImage(), EventType.ERROR, (ev)=>{
        rej(ev.target || ev.path[0]);
      });

      tile.load();
    });
  }

  // Returns the GLSL implementation of the Mapbox Terrain-RGB decode implementation,
  // also taking into account normalization of byte values (0..255 to 0..1)
  // height = -10000 + ((R * 256 * 256 + G * 256 + B) * 0.1)
  getFetchFunctionDef(uniformName){
    if (!this.fetchFuncName_) { return ""; }
    return Promise.resolve(`float ${this.fetchFuncName_}(vec2 texelCoords) {
      vec4 texel = texture2D(${uniformName}, texelCoords.st);
      return -10000. + (
        texel.r * 65536. +
        texel.g * 256. +
        texel.b
      ) * 25.5;
    }`);
  }

}
