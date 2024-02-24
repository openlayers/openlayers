/**
 * @module ol/VectorTile
 */
import Tile from './Tile.js';
import TileState from './TileState.js';

class VectorTile extends Tile {
  /**
   * @param {import("./tilecoord.js").TileCoord} tileCoord Tile coordinate.
   * @param {import("./TileState.js").default} state State.
   * @param {string} src Data source url.
   * @param {import("./format/Feature.js").default<typeof import("./Feature.js").default|typeof import("./render/Feature.js").default>} format Feature format.
   * @param {import("./Tile.js").LoadFunction} tileLoadFunction Tile load function.
   * @param {import("./Tile.js").Options} [options] Tile options.
   */
  constructor(tileCoord, state, src, format, tileLoadFunction, options) {
    super(tileCoord, state, options);

    /**
     * Extent of this tile; set by the source.
     * @type {import("./extent.js").Extent}
     */
    this.extent = null;

    /**
     * @private
     * @type {import("./format/Feature.js").default}
     */
    this.format_ = format;

    /**
     * @private
     * @type {Array<import("./Feature.js").FeatureLike>}
     */
    this.features_ = null;

    /**
     * @private
     * @type {import("./featureloader.js").FeatureLoader}
     */
    this.loader_;

    /**
     * Feature projection of this tile; set by the source.
     * @type {import("./proj/Projection.js").default}
     */
    this.projection = null;

    /**
     * Resolution of this tile; set by the source.
     * @type {number}
     */
    this.resolution;

    /**
     * @private
     * @type {import("./Tile.js").LoadFunction}
     */
    this.tileLoadFunction_ = tileLoadFunction;

    /**
     * @private
     * @type {string}
     */
    this.url_ = src;

    this.key = src;
  }

  /**
   * Get the feature format assigned for reading this tile's features.
   * @return {import("./format/Feature.js").default} Feature format.
   * @api
   */
  getFormat() {
    return this.format_;
  }

  /**
   * Get the features for this tile. Geometries will be in the view projection.
   * @return {Array<import("./Feature.js").FeatureLike>} Features.
   * @api
   */
  getFeatures() {
    return this.features_;
  }

  /**
   * Load not yet loaded URI.
   */
  load() {
    if (this.state == TileState.IDLE) {
      this.setState(TileState.LOADING);
      this.tileLoadFunction_(this, this.url_);
      if (this.loader_) {
        this.loader_(this.extent, this.resolution, this.projection);
      }
    }
  }

  /**
   * Handler for successful tile load.
   * @param {Array<import("./Feature.js").default>} features The loaded features.
   * @param {import("./proj/Projection.js").default} dataProjection Data projection.
   */
  onLoad(features, dataProjection) {
    this.setFeatures(features);
  }

  /**
   * Handler for tile load errors.
   */
  onError() {
    this.setState(TileState.ERROR);
  }

  /**
   * Function for use in an {@link module:ol/source/VectorTile~VectorTile}'s `tileLoadFunction`.
   * Sets the features for the tile.
   * @param {Array<import("./Feature.js").FeatureLike>} features Features.
   * @api
   */
  setFeatures(features) {
    this.features_ = features;
    this.setState(TileState.LOADED);
  }

  /**
   * Set the feature loader for reading this tile's features.
   * @param {import("./featureloader.js").FeatureLoader} loader Feature loader.
   * @api
   */
  setLoader(loader) {
    this.loader_ = loader;
  }
}

export default VectorTile;
