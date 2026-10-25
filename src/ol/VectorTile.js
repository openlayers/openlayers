/**
 * @module ol/VectorTile
 */
import Tile from './Tile.js';
import TileState from './TileState.js';
import {equivalent, getTransform} from './proj.js';
import RenderFeature from './render/Feature.js';

/**
 * @template {import('./Feature.js').FeatureLike} FeatureType
 */
class VectorTile extends Tile {
  /**
   * @param {import("./tilecoord.js").TileCoord} tileCoord Tile coordinate.
   * @param {import("./TileState.js").default} state State.
   * @param {string} src Data source url.
   * @param {import("./format/Feature.js").default<FeatureType>} format Feature format.
   * @param {import("./Tile.js").LoadFunction} tileLoadFunction Tile load function.
   * @param {import("./Tile.js").Options} [options] Tile options.
   */
  constructor(tileCoord, state, src, format, tileLoadFunction, options) {
    super(tileCoord, state, options);

    /**
     * Extent of this tile; set by the source.
     * @type {import("./extent.js").Extent|null}
     */
    this.extent = null;

    /**
     * @private
     * @type {import("./format/Feature.js").default<FeatureType>}
     */
    this.format_ = format;

    /**
     * @private
     * @type {Array<FeatureType>|null}
     */
    this.features_ = null;

    /**
     * @private
     * @type {import("./featureloader.js").FeatureLoader}
     */
    this.loader_;

    /**
     * Feature projection of this tile; set by the source.
     * @type {import("./proj/Projection.js").default|null}
     */
    this.projection = null;

    /**
     * Features transformed to another projection, and that projection.
     * @private
     * @type {{projection: import("./proj/Projection.js").default, features: Array<FeatureType>}|null}
     */
    this.reprojectedFeatures_ = null;

    /**
     * Whether all features are read-only render features, whose transformed
     * copies can be kept.
     * @private
     * @type {boolean}
     */
    this.readOnlyFeatures_ = false;

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
   * @return {string} Tile url.
   */
  getTileUrl() {
    return this.url_;
  }

  /**
   * Get the feature format assigned for reading this tile's features.
   * @return {import("./format/Feature.js").default<FeatureType>} Feature format.
   * @api
   */
  getFormat() {
    return this.format_;
  }

  /**
   * Get the features for this tile. Geometries will be in the tile's
   * `projection`, which is the source's projection.
   * @return {Array<FeatureType>|null} Features.
   * @api
   */
  getFeatures() {
    return this.features_;
  }

  /**
   * Get the features for this tile, with geometries transformed to the given
   * projection. The transformed features are copies. When all features are
   * read-only render features, the copies are created once and kept until the
   * tile's features change or another projection is asked for; otherwise
   * (`ol/Feature`, which can be modified after loading) they are created anew
   * on every call.
   * @param {import("./proj/Projection.js").default} projection Projection.
   * @return {Array<FeatureType>|null} Features.
   */
  getFeaturesInProjection(projection) {
    const features = this.features_;
    if (
      !features ||
      !this.projection ||
      equivalent(projection, this.projection)
    ) {
      return features;
    }
    const cached = this.reprojectedFeatures_;
    if (cached && equivalent(cached.projection, projection)) {
      return cached.features;
    }
    const transform = getTransform(this.projection, projection);
    if (!transform) {
      return features;
    }
    const reprojected = features.map((feature) => {
      const clone = /** @type {FeatureType} */ (feature.clone());
      clone.getGeometry()?.applyTransform(transform);
      return clone;
    });
    if (this.readOnlyFeatures_) {
      this.reprojectedFeatures_ = {projection, features: reprojected};
    }
    return reprojected;
  }

  /**
   * Transform and keep the features for the given projection ahead of
   * rendering, when they can be kept (see `getFeaturesInProjection`).
   * @param {import("./proj/Projection.js").default} projection Projection.
   */
  prepareFeaturesInProjection(projection) {
    if (this.readOnlyFeatures_) {
      this.getFeaturesInProjection(projection);
    }
  }

  /**
   * Load not yet loaded URI.
   * @override
   */
  load() {
    if (this.state == TileState.IDLE) {
      this.setState(TileState.LOADING);
      this.tileLoadFunction_(this, this.url_);
      if (this.loader_ && this.extent && this.projection) {
        this.loader_(this.extent, this.resolution, this.projection);
      }
    }
  }

  /**
   * Handler for successful tile load.
   * @param {Array<FeatureType>} features The loaded features.
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
   * Function for use in a {@link module:ol/source/VectorTile~VectorTile}'s `tileLoadFunction`.
   * Sets the features for the tile.
   * @param {Array<FeatureType>} features Features.
   * @api
   */
  setFeatures(features) {
    this.features_ = features;
    this.reprojectedFeatures_ = null;
    this.readOnlyFeatures_ =
      !!features &&
      features.every((feature) => feature instanceof RenderFeature);
    this.setState(TileState.LOADED);
  }

  /**
   * Set the feature loader for reading this tile's features.
   * @param {import("./featureloader.js").FeatureLoader<FeatureType>} loader Feature loader.
   * @api
   */
  setLoader(loader) {
    this.loader_ = loader;
  }
}

export default VectorTile;
