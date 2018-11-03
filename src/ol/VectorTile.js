/**
 * @module ol/VectorTile
 */
import {getUid} from './util.js';
import Tile from './Tile.js';
import TileState from './TileState.js';

/**
 * @const
 * @type {import("./extent.js").Extent}
 */
const DEFAULT_EXTENT = [0, 0, 4096, 4096];


class VectorTile extends Tile {

  /**
   * @param {import("./tilecoord.js").TileCoord} tileCoord Tile coordinate.
   * @param {TileState} state State.
   * @param {string} src Data source url.
   * @param {import("./format/Feature.js").default} format Feature format.
   * @param {import("./Tile.js").LoadFunction} tileLoadFunction Tile load function.
   * @param {import("./Tile.js").Options=} opt_options Tile options.
   */
  constructor(tileCoord, state, src, format, tileLoadFunction, opt_options) {

    super(tileCoord, state, opt_options);

    /**
     * @type {number}
     */
    this.consumers = 0;

    /**
     * @private
     * @type {import("./extent.js").Extent}
     */
    this.extent_ = null;

    /**
     * @private
     * @type {import("./format/Feature.js").default}
     */
    this.format_ = format;

    /**
     * @private
     * @type {Array<import("./Feature.js").default>}
     */
    this.features_ = null;

    /**
     * @private
     * @type {import("./featureloader.js").FeatureLoader}
     */
    this.loader_;

    /**
     * Data projection
     * @private
     * @type {import("./proj/Projection.js").default}
     */
    this.projection_ = null;

    /**
     * @private
     * @type {Object<string, import("./render/ReplayGroup.js").default>}
     */
    this.replayGroups_ = {};

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

  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    this.features_ = null;
    this.replayGroups_ = {};
    this.state = TileState.ABORT;
    this.changed();
    super.disposeInternal();
  }

  /**
   * Gets the extent of the vector tile.
   * @return {import("./extent.js").Extent} The extent.
   * @api
   */
  getExtent() {
    return this.extent_ || DEFAULT_EXTENT;
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
   * Get the features for this tile. Geometries will be in the projection returned
   * by {@link module:ol/VectorTile~VectorTile#getProjection}.
   * @return {Array<import("./Feature.js").FeatureLike>} Features.
   * @api
   */
  getFeatures() {
    return this.features_;
  }

  /**
   * @inheritDoc
   */
  getKey() {
    return this.url_;
  }

  /**
   * Get the feature projection of features returned by
   * {@link module:ol/VectorTile~VectorTile#getFeatures}.
   * @return {import("./proj/Projection.js").default} Feature projection.
   * @api
   */
  getProjection() {
    return this.projection_;
  }

  /**
   * @param {import("./layer/Layer.js").default} layer Layer.
   * @param {string} key Key.
   * @return {import("./render/ReplayGroup.js").default} Replay group.
   */
  getReplayGroup(layer, key) {
    return this.replayGroups_[getUid(layer) + ',' + key];
  }

  /**
   * @inheritDoc
   */
  load() {
    if (this.state == TileState.IDLE) {
      this.setState(TileState.LOADING);
      this.tileLoadFunction_(this, this.url_);
      this.loader_(null, NaN, null);
    }
  }

  /**
   * Handler for successful tile load.
   * @param {Array<import("./Feature.js").default>} features The loaded features.
   * @param {import("./proj/Projection.js").default} dataProjection Data projection.
   * @param {import("./extent.js").Extent} extent Extent.
   */
  onLoad(features, dataProjection, extent) {
    this.setProjection(dataProjection);
    this.setFeatures(features);
    this.setExtent(extent);
  }

  /**
   * Handler for tile load errors.
   */
  onError() {
    this.setState(TileState.ERROR);
  }

  /**
   * Function for use in an {@link module:ol/source/VectorTile~VectorTile}'s
   * `tileLoadFunction`. Sets the extent of the vector tile. This is only required
   * for tiles in projections with `tile-pixels` as units. The extent should be
   * set to `[0, 0, tilePixelSize, tilePixelSize]`, where `tilePixelSize` is
   * calculated by multiplying the tile size with the tile pixel ratio. For
   * sources using {@link module:ol/format/MVT~MVT} as feature format, the
   * {@link module:ol/format/MVT~MVT#getLastExtent} method will return the correct
   * extent. The default is `[0, 0, 4096, 4096]`.
   * @param {import("./extent.js").Extent} extent The extent.
   * @api
   */
  setExtent(extent) {
    this.extent_ = extent;
  }

  /**
   * Function for use in an {@link module:ol/source/VectorTile~VectorTile}'s `tileLoadFunction`.
   * Sets the features for the tile.
   * @param {Array<import("./Feature.js").default>} features Features.
   * @api
   */
  setFeatures(features) {
    this.features_ = features;
    this.setState(TileState.LOADED);
  }

  /**
   * Function for use in an {@link module:ol/source/VectorTile~VectorTile}'s `tileLoadFunction`.
   * Sets the projection of the features that were added with
   * {@link module:ol/VectorTile~VectorTile#setFeatures}.
   * @param {import("./proj/Projection.js").default} projection Feature projection.
   * @api
   */
  setProjection(projection) {
    this.projection_ = projection;
  }

  /**
   * @param {import("./layer/Layer.js").default} layer Layer.
   * @param {string} key Key.
   * @param {import("./render/ReplayGroup.js").default} replayGroup Replay group.
   */
  setReplayGroup(layer, key, replayGroup) {
    this.replayGroups_[getUid(layer) + ',' + key] = replayGroup;
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
