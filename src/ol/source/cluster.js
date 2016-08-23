// FIXME keep cluster cache by resolution ?
// FIXME distance not respected because of the centroid

goog.provide('ol.source.Cluster');

goog.require('ol');
goog.require('ol.asserts');
goog.require('ol.Feature');
goog.require('ol.coordinate');
goog.require('ol.events.EventType');
goog.require('ol.extent');
goog.require('ol.geom.Point');
goog.require('ol.source.Vector');


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
ol.source.Cluster = function(options) {
  ol.source.Vector.call(this, {
    attributions: options.attributions,
    extent: options.extent,
    logo: options.logo,
    projection: options.projection,
    wrapX: options.wrapX
  });

  /**
   * @type {number|undefined}
   * @private
   */
  this.resolution_ = undefined;

  /**
   * @type {number}
   * @private
   */
  this.distance_ = options.distance !== undefined ? options.distance : 20;

  /**
   * @type {Array.<ol.Feature>}
   * @private
   */
  this.features_ = [];

  /**
   * @param {ol.Feature} feature Feature.
   * @return {ol.geom.Point} Cluster calculation point.
   */
  this.geometryFunction_ = options.geometryFunction || function(feature) {
    var geometry = /** @type {ol.geom.Point} */ (feature.getGeometry());
    ol.asserts.assert(geometry instanceof ol.geom.Point,
        10); // The default `geometryFunction` can only handle `ol.geom.Point` geometries
    return geometry;
  };

  /**
   * @type {ol.source.Vector}
   * @private
   */
  this.source_ = options.source;

  this.source_.on(ol.events.EventType.CHANGE,
      ol.source.Cluster.prototype.refresh_, this);
};
ol.inherits(ol.source.Cluster, ol.source.Vector);


/**
 * Get a reference to the wrapped source.
 * @return {ol.source.Vector} Source.
 * @api
 */
ol.source.Cluster.prototype.getSource = function() {
  return this.source_;
};


/**
 * @inheritDoc
 */
ol.source.Cluster.prototype.loadFeatures = function(extent, resolution,
    projection) {
  this.source_.loadFeatures(extent, resolution, projection);
  if (resolution !== this.resolution_) {
    this.clear();
    this.resolution_ = resolution;
    this.cluster_();
    this.addFeatures(this.features_);
  }
};


/**
 * Set the distance in pixels between clusters.
 * @param {number} distance The distance in pixels.
 * @api
 */
ol.source.Cluster.prototype.setDistance = function(distance) {
  this.distance_ = distance;
  this.refresh_();
};


/**
 * handle the source changing
 * @private
 */
ol.source.Cluster.prototype.refresh_ = function() {
  this.clear();
  this.cluster_();
  this.addFeatures(this.features_);
  this.changed();
};


/**
 * @private
 */
ol.source.Cluster.prototype.cluster_ = function() {
  if (this.resolution_ === undefined) {
    return;
  }
  this.features_.length = 0;
  var extent = ol.extent.createEmpty();
  var mapDistance = this.distance_ * this.resolution_;
  var features = this.source_.getFeatures();

  /**
   * @type {!Object.<string, boolean>}
   */
  var clustered = {};

  for (var i = 0, ii = features.length; i < ii; i++) {
    var feature = features[i];
    if (!(ol.getUid(feature).toString() in clustered)) {
      var geometry = this.geometryFunction_(feature);
      if (geometry) {
        var coordinates = geometry.getCoordinates();
        ol.extent.createOrUpdateFromCoordinate(coordinates, extent);
        ol.extent.buffer(extent, mapDistance, extent);

        var neighbors = this.source_.getFeaturesInExtent(extent);
        goog.DEBUG && console.assert(neighbors.length >= 1, 'at least one neighbor found');
        neighbors = neighbors.filter(function(neighbor) {
          var uid = ol.getUid(neighbor).toString();
          if (!(uid in clustered)) {
            clustered[uid] = true;
            return true;
          } else {
            return false;
          }
        });
        this.features_.push(this.createCluster_(neighbors));
      }
    }
  }
  goog.DEBUG && console.assert(
      Object.keys(clustered).length == this.source_.getFeatures().length,
      'number of clustered equals number of features in the source');
};


/**
 * @param {Array.<ol.Feature>} features Features
 * @return {ol.Feature} The cluster feature.
 * @private
 */
ol.source.Cluster.prototype.createCluster_ = function(features) {
  var centroid = [0, 0];
  for (var i = features.length - 1; i >= 0; --i) {
    var geometry = this.geometryFunction_(features[i]);
    if (geometry) {
      ol.coordinate.add(centroid, geometry.getCoordinates());
    } else {
      features.splice(i, 1);
    }
  }
  ol.coordinate.scale(centroid, 1 / features.length);

  var cluster = new ol.Feature(new ol.geom.Point(centroid));
  cluster.set('features', features);
  return cluster;
};
