// FIXME keep cluster cache by resolution ?
// FIXME distance not respected because of the centroid

import _ol_ from '../index';
import _ol_asserts_ from '../asserts';
import _ol_Feature_ from '../feature';
import _ol_coordinate_ from '../coordinate';
import _ol_events_EventType_ from '../events/eventtype';
import _ol_extent_ from '../extent';
import _ol_geom_Point_ from '../geom/point';
import _ol_source_Vector_ from '../source/vector';

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
var _ol_source_Cluster_ = function(options) {
  _ol_source_Vector_.call(this, {
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
    _ol_asserts_.assert(geometry instanceof _ol_geom_Point_,
        10); // The default `geometryFunction` can only handle `ol.geom.Point` geometries
    return geometry;
  };

  /**
   * @type {ol.source.Vector}
   * @protected
   */
  this.source = options.source;

  this.source.on(_ol_events_EventType_.CHANGE,
      _ol_source_Cluster_.prototype.refresh, this);
};

_ol_.inherits(_ol_source_Cluster_, _ol_source_Vector_);


/**
 * Get the distance in pixels between clusters.
 * @return {number} Distance.
 * @api
 */
_ol_source_Cluster_.prototype.getDistance = function() {
  return this.distance;
};


/**
 * Get a reference to the wrapped source.
 * @return {ol.source.Vector} Source.
 * @api
 */
_ol_source_Cluster_.prototype.getSource = function() {
  return this.source;
};


/**
 * @inheritDoc
 */
_ol_source_Cluster_.prototype.loadFeatures = function(extent, resolution,
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
_ol_source_Cluster_.prototype.setDistance = function(distance) {
  this.distance = distance;
  this.refresh();
};


/**
 * handle the source changing
 * @override
 */
_ol_source_Cluster_.prototype.refresh = function() {
  this.clear();
  this.cluster();
  this.addFeatures(this.features);
  _ol_source_Vector_.prototype.refresh.call(this);
};


/**
 * @protected
 */
_ol_source_Cluster_.prototype.cluster = function() {
  if (this.resolution === undefined) {
    return;
  }
  this.features.length = 0;
  var extent = _ol_extent_.createEmpty();
  var mapDistance = this.distance * this.resolution;
  var features = this.source.getFeatures();

  /**
   * @type {!Object.<string, boolean>}
   */
  var clustered = {};

  for (var i = 0, ii = features.length; i < ii; i++) {
    var feature = features[i];
    if (!(_ol_.getUid(feature).toString() in clustered)) {
      var geometry = this.geometryFunction(feature);
      if (geometry) {
        var coordinates = geometry.getCoordinates();
        _ol_extent_.createOrUpdateFromCoordinate(coordinates, extent);
        _ol_extent_.buffer(extent, mapDistance, extent);

        var neighbors = this.source.getFeaturesInExtent(extent);
        neighbors = neighbors.filter(function(neighbor) {
          var uid = _ol_.getUid(neighbor).toString();
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
_ol_source_Cluster_.prototype.createCluster = function(features) {
  var centroid = [0, 0];
  for (var i = features.length - 1; i >= 0; --i) {
    var geometry = this.geometryFunction(features[i]);
    if (geometry) {
      _ol_coordinate_.add(centroid, geometry.getCoordinates());
    } else {
      features.splice(i, 1);
    }
  }
  _ol_coordinate_.scale(centroid, 1 / features.length);

  var cluster = new _ol_Feature_(new _ol_geom_Point_(centroid));
  cluster.set('features', features);
  return cluster;
};
export default _ol_source_Cluster_;
