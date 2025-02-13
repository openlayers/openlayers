/**
 * @module ol/source/Cluster
 */

import Feature from '../Feature.js';
import {assert} from '../asserts.js';
import {add as addCoordinate, scale as scaleCoordinate} from '../coordinate.js';
import EventType from '../events/EventType.js';
import {
  buffer,
  createEmpty,
  createOrUpdateFromCoordinate,
  getCenter,
} from '../extent.js';
import Point from '../geom/Point.js';
import {getUid} from '../util.js';
import VectorSource from './Vector.js';

/**
 * @template {import("../Feature.js").FeatureLike} [FeatureType=import("../Feature.js").FeatureLike]
 * @typedef {(feature: FeatureType) => (Point|null)} GeometryFunction
 */

/**
 * @template {import("../Feature.js").FeatureLike} [FeatureType=import("../Feature.js").default]
 * @typedef {Object} Options
 * @property {import("./Source.js").AttributionLike} [attributions] Attributions.
 * @property {number} [distance=20] Distance in pixels within which features will
 * be clustered together.
 * @property {number} [minDistance=0] Minimum distance in pixels between clusters.
 * Will be capped at the configured distance.
 * By default no minimum distance is guaranteed. This config can be used to avoid
 * overlapping icons. As a tradoff, the cluster feature's position will no longer be
 * the center of all its features.
 * @property {GeometryFunction<FeatureType>} [geometryFunction]
 * Function that takes a {@link module:ol/Feature~Feature} as argument and returns a
 * {@link module:ol/geom/Point~Point} as cluster calculation point for the feature. When a
 * feature should not be considered for clustering, the function should return
 * `null`. The default, which works when the underlying source contains point
 * features only, is
 * ```js
 * function(feature) {
 *   return feature.getGeometry();
 * }
 * ```
 * See {@link module:ol/geom/Polygon~Polygon#getInteriorPoint} for a way to get a cluster
 * calculation point for polygons.
 * @property {function(Point, Array<FeatureType>):Feature} [createCluster]
 * Function that takes the cluster's center {@link module:ol/geom/Point~Point} and an array
 * of {@link module:ol/Feature~Feature} included in this cluster. Must return a
 * {@link module:ol/Feature~Feature} that will be used to render. Default implementation is:
 * ```js
 * function(point, features) {
 *   return new Feature({
 *     geometry: point,
 *     features: features
 *   });
 * }
 * ```
 * @property {VectorSource<FeatureType>} [source=null] Source.
 * @property {boolean} [wrapX=true] Whether to wrap the world horizontally.
 */

/**
 * @classdesc
 * Layer source to cluster vector data. Works out of the box with point
 * geometries. For other geometry types, or if not all geometries should be
 * considered for clustering, a custom `geometryFunction` can be defined.
 *
 * If the instance is disposed without also disposing the underlying
 * source `setSource(null)` has to be called to remove the listener reference
 * from the wrapped source.
 * @api
 * @template {import('../Feature.js').FeatureLike} [FeatureType=import('../Feature.js').default]
 * @extends {VectorSource<Feature<import("../geom/Geometry.js").default>>}
 */
class Cluster extends VectorSource {
  /**
   * @param {Options<FeatureType>} [options] Cluster options.
   */
  constructor(options) {
    options = options || {};
    super({
      attributions: options.attributions,
      wrapX: options.wrapX,
    });

    /**
     * @type {number|undefined}
     * @protected
     */
    this.resolution = undefined;

    /**
     * @type {number}
     * @protected
     */
    this.distance = options.distance !== undefined ? options.distance : 20;

    /**
     * @type {number}
     * @protected
     */
    this.minDistance = options.minDistance || 0;

    /**
     * @type {number}
     * @protected
     */
    this.interpolationRatio = 0;

    /**
     * @type {Array<Feature>}
     * @protected
     */
    this.features = [];

    /**
     * @type {GeometryFunction<import("../Feature.js").FeatureLike>}
     * @protected
     */
    this.geometryFunction =
      options.geometryFunction ||
      function (feature) {
        const geometry = /** @type {Point} */ (feature.getGeometry());
        assert(
          !geometry || geometry.getType() === 'Point',
          'The default `geometryFunction` can only handle `Point` or null geometries',
        );
        return geometry;
      };

    /**
     * @type {function(Point, Array<FeatureType>):Feature}
     * @private
     */
    this.createCustomCluster_ = options.createCluster;

    /**
     * @type {VectorSource<FeatureType>|null}
     * @protected
     */
    this.source = null;

    /**
     * @private
     */
    this.boundRefresh_ = this.refresh.bind(this);

    this.updateDistance(this.distance, this.minDistance);
    this.setSource(options.source || null);
  }

  /**
   * Remove all features from the source.
   * @param {boolean} [fast] Skip dispatching of {@link module:ol/source/VectorEventType~VectorEventType#removefeature} events.
   * @api
   * @override
   */
  clear(fast) {
    this.features.length = 0;
    super.clear(fast);
  }

  /**
   * Get the distance in pixels between clusters.
   * @return {number} Distance.
   * @api
   */
  getDistance() {
    return this.distance;
  }

  /**
   * Get a reference to the wrapped source.
   * @return {VectorSource<FeatureType>|null} Source.
   * @api
   */
  getSource() {
    return this.source;
  }

  /**
   * @param {import("../extent.js").Extent} extent Extent.
   * @param {number} resolution Resolution.
   * @param {import("../proj/Projection.js").default} projection Projection.
   * @override
   */
  loadFeatures(extent, resolution, projection) {
    this.source?.loadFeatures(extent, resolution, projection);
    if (resolution !== this.resolution) {
      this.resolution = resolution;
      this.refresh();
    }
  }

  /**
   * Set the distance within which features will be clusterd together.
   * @param {number} distance The distance in pixels.
   * @api
   */
  setDistance(distance) {
    this.updateDistance(distance, this.minDistance);
  }

  /**
   * Set the minimum distance between clusters. Will be capped at the
   * configured distance.
   * @param {number} minDistance The minimum distance in pixels.
   * @api
   */
  setMinDistance(minDistance) {
    this.updateDistance(this.distance, minDistance);
  }

  /**
   * The configured minimum distance between clusters.
   * @return {number} The minimum distance in pixels.
   * @api
   */
  getMinDistance() {
    return this.minDistance;
  }

  /**
   * Replace the wrapped source.
   * @param {VectorSource<FeatureType>|null} source The new source for this instance.
   * @api
   */
  setSource(source) {
    if (this.source) {
      this.source.removeEventListener(EventType.CHANGE, this.boundRefresh_);
    }
    this.source = source;
    if (source) {
      source.addEventListener(EventType.CHANGE, this.boundRefresh_);
    }
    this.refresh();
  }

  /**
   * Handle the source changing.
   * @override
   */
  refresh() {
    this.clear();
    this.cluster();
    this.addFeatures(this.features);
  }

  /**
   * Update the distances and refresh the source if necessary.
   * @param {number} distance The new distance.
   * @param {number} minDistance The new minimum distance.
   */
  updateDistance(distance, minDistance) {
    const ratio =
      distance === 0 ? 0 : Math.min(minDistance, distance) / distance;
    const changed =
      distance !== this.distance || this.interpolationRatio !== ratio;
    this.distance = distance;
    this.minDistance = minDistance;
    this.interpolationRatio = ratio;
    if (changed) {
      this.refresh();
    }
  }

  /**
   * @protected
   */
  cluster() {
    if (this.resolution === undefined || !this.source) {
      return;
    }
    const extent = createEmpty();
    const mapDistance = this.distance * this.resolution;
    const features = this.source.getFeatures();

    /** @type {Object<string, true>} */
    const clustered = {};

    for (let i = 0, ii = features.length; i < ii; i++) {
      const feature = features[i];
      if (!(getUid(feature) in clustered)) {
        const geometry = this.geometryFunction(feature);
        if (geometry) {
          const coordinates = geometry.getCoordinates();
          createOrUpdateFromCoordinate(coordinates, extent);
          buffer(extent, mapDistance, extent);

          const neighbors = this.source
            .getFeaturesInExtent(extent)
            .filter(function (neighbor) {
              const uid = getUid(neighbor);
              if (uid in clustered) {
                return false;
              }
              clustered[uid] = true;
              return true;
            });
          this.features.push(this.createCluster(neighbors, extent));
        }
      }
    }
  }

  /**
   * @param {Array<FeatureType>} features Features
   * @param {import("../extent.js").Extent} extent The searched extent for these features.
   * @return {Feature} The cluster feature.
   * @protected
   */
  createCluster(features, extent) {
    const centroid = [0, 0];
    for (let i = features.length - 1; i >= 0; --i) {
      const geometry = this.geometryFunction(features[i]);
      if (geometry) {
        addCoordinate(centroid, geometry.getCoordinates());
      } else {
        features.splice(i, 1);
      }
    }
    scaleCoordinate(centroid, 1 / features.length);
    const searchCenter = getCenter(extent);
    const ratio = this.interpolationRatio;
    const geometry = new Point([
      centroid[0] * (1 - ratio) + searchCenter[0] * ratio,
      centroid[1] * (1 - ratio) + searchCenter[1] * ratio,
    ]);
    if (this.createCustomCluster_) {
      return this.createCustomCluster_(geometry, features);
    }
    return new Feature({
      geometry,
      features,
    });
  }
}

export default Cluster;
