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
    var geometry = /** @type {ol.geom.Point} */ (feature.getGeometry());
    ol.asserts.assert(geometry instanceof ol.geom.Point,
        10); // The default `geometryFunction` can only handle `ol.geom.Point` geometries
    return geometry;
  };

  /**
   * @type {ol.source.Vector}
   * @protected
   */
  this.source = options.source;

  this.source.on(ol.events.EventType.CHANGE,
      ol.source.Cluster.prototype.refresh, this);
};
ol.inherits(ol.source.Cluster, ol.source.Vector);


/**
 * Get the distance in pixels between clusters.
 * @return {number} Distance.
 * @api
 */
ol.source.Cluster.prototype.getDistance = function() {
  return this.distance;
};


/**
 * Get a reference to the wrapped source.
 * @return {ol.source.Vector} Source.
 * @api
 */
ol.source.Cluster.prototype.getSource = function() {
  return this.source;
};


/**
 * @inheritDoc
 */
ol.source.Cluster.prototype.loadFeatures = function(extent, resolution,
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
ol.source.Cluster.prototype.setDistance = function(distance) {
  this.distance = distance;
  this.refresh();
};


/**
 * handle the source changing
 * @override
 */
ol.source.Cluster.prototype.refresh = function() {
  this.clear();
  this.cluster();
  this.addFeatures(this.features);
  ol.source.Vector.prototype.refresh.call(this);
};


/**
 * @protected
 */
ol.source.Cluster.prototype.cluster = function() {
  if (this.resolution === undefined) {
    return;
  }
  this.features.length = 0;
  var extent = ol.extent.createEmpty();
  var mapDistance = this.distance * this.resolution;
  var features = this.source.getFeatures();

  /**
   * @type {!Object.<string, boolean>}
   */
  var clustered = {};

  for (var i = 0, ii = features.length; i < ii; i++) {
    var feature = features[i];
    if (!(ol.getUid(feature).toString() in clustered)) {
      var geometry = this.geometryFunction(feature);
      if (geometry) {
        var coordinates = geometry.getCoordinates();
        ol.extent.createOrUpdateFromCoordinate(coordinates, extent);
        ol.extent.buffer(extent, mapDistance, extent);

        var neighbors = this.source.getFeaturesInExtent(extent);
        neighbors = neighbors.filter(function(neighbor) {
          var uid = ol.getUid(neighbor).toString();
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
ol.source.Cluster.prototype.createCluster = function(features) {
  var centroid = [0, 0];
  for (var i = features.length - 1; i >= 0; --i) {
    var geometry = this.geometryFunction(features[i]);
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
