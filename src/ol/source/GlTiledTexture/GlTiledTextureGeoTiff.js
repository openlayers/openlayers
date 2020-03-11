import GlTiledTextureAbstract from './GlTiledTextureAbstract.js'

/**
 * @module ol/source/GlTiles
 */

export default class GlTiledTextureGeoTiff extends GlTiledTextureAbstract {
  /**
   * @param {GeoTIFF|Promise<GeoTIFF>} tiff A GeoTIFF.js instance, or a Promise to such.
   * @param {number=0} sample Which sample (AKA channel) to query (zero-indexed). For WebGL1
   * compatibility, only one channel per instance is allowed.
   * @param {number=-999} fillValue Value to be used for pixels with no data.
   *
   * A wrapper of GeoTIFF.js functionality. Extracts data from a GeoTIFF in such a way that can be
   * fed to a GlTiles source.
   */
  constructor(tiff, sample=0, fillValue = -999 ) {
    this.sample_ = sample;
    this.fillValue_ = fillValue;

    if (!("getImage" in tiff)) {
      // A Promise to a GeoTIFF was passed
      this.tiff_ = tiff.then(loadedTiff=>
        loadedTiff.getImage().then(this.loadImage_.bind(this))
      );
    } else {
      // A resolved GeoTIFF was passed
      this.tiff_ = tiff.getImage().then(this.loadImage_.bind(this));
    }
  }

  loadImage_(img) {
    // Caches the pixel width & heigth, and the geographical bbox of the geotiff.
    this.width_ = img.getWidth();
    this.height_ = img.getHeight();
    this.bbox_ = img.getBoundingBox();
    this.bboxWidth_ = this.bbox_[2] - this.bbox_[0];
    this.bboxHeight_ = this.bbox_[3] - this.bbox_[1];

    // Sanity check. The (zero-indexed) requested sample must be within the number
    // of available samples.
    if (this.sample_ >= img.getSamplesPerPixel()) {
      throw new Error("Requested sample " + Number(this.sample_) + ", but only " + img.getSamplesPerPixel() + " samples are available")
    }

    return img;
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
    return this.tiff_.then(img=>{
      // TODO: sanity check on the GeoTIFF CRS vs the given TileGrid.

      // Calculate the pixel coords to be fetched from the projected coords and the image size
      const x1 = ((tileExtent[2] - this.bbox_[0]) / this.bboxWidth_) * this.width_;
      const x2 = ((tileExtent[0] - this.bbox_[0]) / this.bboxWidth_) * this.width_;
      const y1 = ((tileExtent[3] - this.bbox_[1]) / this.bboxHeight_) * this.height_;
      const y2 = ((tileExtent[1] - this.bbox_[1]) / this.bboxHeight_) * this.height_;

      return img.readRasters({
        window: [x2, this.height_ - y1, x1, this.height_ - y2].map(i=>Math.round(i)),
        width: tileSize[0],
        height: tileSize[1],
        resampleMethod: 'nearest',
        samples: [this.sample_],
        fillValue: this.fillValue_
      }).then(rasters=>rasters[0]);
    });
  }

}
