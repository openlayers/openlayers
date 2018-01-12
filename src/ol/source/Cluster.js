/**
 * @module ol/source/Cluster
 */

import {getUid, inherits} from '../index.js';
import {assert} from '../asserts.js';
import Feature from '../Feature.js';
import _ol_coordinate_ from '../coordinate.js';
import EventType from '../events/EventType.js';
import {buffer, createEmpty, createOrUpdateFromCoordinate} from '../extent.js';
import Point from '../geom/Point.js';
import VectorSource from '../source/Vector.js';

/**
 * @classdesc
 * Layer source to cluster vector data. Works out of the box with point
 * geometries. For other geometry types, or if not all geometries should be
 * considered for clustering, a custom `geometryFunction` can be defined.
 *
 * @constructor
 * @param {olx.source.ClusterOptions} options Constructor options.
 * @extends {ol.source.Vector}
 * @api
 */
const Cluster = function(options) {
  VectorSource.call(this, {
    attributions: options.attributions,
    extent: options.extent,
    projection: options.projection,
    wrapX: options.wrapX
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
   * @type {Array.<ol.Feature>}
   * @protected
   */
  this.features = [];

  /**
   * @param {ol.Feature} feature Feature.
   * @return {ol.geom.Point} Cluster calculation point.
   * @protected
   */
  this.geometryFunction = options.geometryFunction || function(feature) {
    const geometry = /** @type {ol.geom.Point} */ (feature.getGeometry());
    assert(geometry instanceof Point,
      10); // The default `geometryFunction` can only handle `ol.geom.Point` geometries
    return geometry;
  };

  /**
   * @type {ol.source.Vector}
   * @protected
   */
  this.source = options.source;

  this.source.on(EventType.CHANGE,
    Cluster.prototype.refresh, this);
};

inherits(Cluster, VectorSource);


/**
 * Get the distance in pixels between clusters.
 * @return {number} Distance.
 * @api
 */
Cluster.prototype.getDistance = function() {
  return this.distance;
};


/**
 * Get a reference to the wrapped source.
 * @return {ol.source.Vector} Source.
 * @api
 */
Cluster.prototype.getSource = function() {
  return this.source;
};


/**
 * @inheritDoc
 */
Cluster.prototype.loadFeatures = function(extent, resolution,
  projection) {
  this.source.loadFeatures(extent, resolution, projection);
  if (resolution !== this.resolution) {
    this.clear();
    this.resolution = resolution;
    this.cluster();
    this.addFeatures(this.features);
  }
};


/**
 * Set the distance in pixels between clusters.
 * @param {number} distance The distance in pixels.
 * @api
 */
Cluster.prototype.setDistance = function(distance) {
  this.distance = distance;
  this.refresh();
};


/**
 * handle the source changing
 * @override
 */
Cluster.prototype.refresh = function() {
  this.clear();
  this.cluster();
  this.addFeatures(this.features);
  VectorSource.prototype.refresh.call(this);
};


/**
 * @protected
 */
Cluster.prototype.cluster = function() {
  if (this.resolution === undefined) {
    return;
  }
  this.features.length = 0;
  const extent = createEmpty();
  const mapDistance = this.distance * this.resolution;
  const features = this.source.getFeatures();

  /**
   * @type {!Object.<string, boolean>}
   */
  const clustered = {};

  for (let i = 0, ii = features.length; i < ii; i++) {
    const feature = features[i];
    if (!(getUid(feature).toString() in clustered)) {
      const geometry = this.geometryFunction(feature);
      if (geometry) {
        const coordinates = geometry.getCoordinates();
        createOrUpdateFromCoordinate(coordinates, extent);
        buffer(extent, mapDistance, extent);

        let neighbors = this.source.getFeaturesInExtent(extent);
        neighbors = neighbors.filter(function(neighbor) {
          const uid = getUid(neighbor).toString();
          if (!(uid in clustered)) {
            clustered[uid] = true;
            return true;
          } else {
            return false;
          }
        });
        this.features.push(this.createCluster(neighbors));
      }
    }
  }
};


/**
 * @param {Array.<ol.Feature>} features Features
 * @return {ol.Feature} The cluster feature.
 * @protected
 */
Cluster.prototype.createCluster = function(features) {
  const centroid = [0, 0];
  for (let i = features.length - 1; i >= 0; --i) {
    const geometry = this.geometryFunction(features[i]);
    if (geometry) {
      _ol_coordinate_.add(centroid, geometry.getCoordinates());
    } else {
      features.splice(i, 1);
    }
  }
  _ol_coordinate_.scale(centroid, 1 / features.length);

  const cluster = new Feature(new Point(centroid));
  cluster.set('features', features);
  return cluster;
};
export default Cluster;
