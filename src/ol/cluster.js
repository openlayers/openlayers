goog.provide('ol.Cluster');

goog.require('ol.ClusterFeature');


/**
 * @constructor
 */
ol.Cluster = function(options) {

  /**
   * 
   */
  this.distance = options['distance'] || 20;


  /**
   * TODO typedef for  a single cluster
   * {Array.<Array>}
   */
  this.clusters = [];


  /**
   * {Array.<ol.ClusterFeature>}
   */
  this.features = [];

  /**
   * @type {number}
   */
   this.smallestCluster = options['smallestCluster'] || 2;


  /**
   * TODO features must be points
   * {Array.<ol.Feature>}
   */
  this.data = options['data'];
};


/**
 * @param {ol.Extent} extent
 * @param {number} resolution
 */
ol.Cluster.prototype.cluster = function(extent, resolution) {
  var mapDistance = this.distance * resolution;
  for(var i = 0; i < this.data.length; i++) {
    var feature = this.data[i];
    //TODO check if feature is in extent
    var geom = feature.getGeometry();
    var coord = geom.getFlatCoordinates();
    if(!ol.extent.containsCoordinate(extent, coord)) {
      continue;
    }
    for(var j = i + 1; j < this.data.length; j++) {
      var feature2 = this.data[j];
      if(this.shouldCluster(feature, feature2, mapDistance)) {
        this.clusterFeatures(feature, feature2);
        break;
      }
      if(j == this.data.length - 1 && this.getClusterByFeature(feature) == -1) {
        var cluster = [feature];
        this.clusters.push(cluster);
      }
    }
  }
  this.createFeaturesFromClusters();
};


/**
 * @param {ol.Feature} feature
 * @param {ol.Feature} feature2
 * @param {number} distance
 * @returns {boolean}
 */
ol.Cluster.prototype.shouldCluster = function(feature, feature2, distance) {
  var shouldCluster = false;
  var geom = /** @type {ol.geom.Point} */ (feature.getGeometry());
  var coords = geom.getFlatCoordinates();

  var clusterIndex = this.getClusterByFeature(feature2);
  if(clusterIndex !== -1) {
    var cluster = this.clusters[clusterIndex];
    for (var k = 0; k < cluster.length; k++) {
      feature2 = cluster[k];
      var geom2 = feature2.getGeometry();
      var coords2 = geom2.getFlatCoordinates();
      var squaredDist = ol.coordinate.squaredDistance(coords, coords2);
      var featureDist = Math.sqrt(squaredDist);
      if(featureDist < distance) {
        shouldCluster = true;
        break;
      }
    }
  } else {
    //TODO coords.length && coords2.length must be 2
    var geom2 = /** @type {ol.geom.Point} */ (feature2.getGeometry());
    var coords2 = geom2.getFlatCoordinates();
    var squaredDist = ol.coordinate.squaredDistance(coords, coords2);
    var featureDist = Math.sqrt(squaredDist);
    if(featureDist < distance) {
      shouldCluster = true;
    }
  }
  return shouldCluster;
};


/**
 * @param {ol.Feature} feature
 * @returns {number}
 */
ol.Cluster.prototype.getClusterByFeature = function(feature) {
  var cluster = -1;
  for(var i = 0; i < this.clusters.length; i++) {
    if(goog.array.contains(this.clusters[i], feature)) {
      cluster = i;
      break;
    }
  }
  return cluster;
};


/**
 * @param {ol.Feature} newFeature
 * @param {ol.Feature} origFeature
 */
ol.Cluster.prototype.clusterFeatures = function(newFeature, origFeature) {
  var origCluster = this.getClusterByFeature(origFeature);
  var newCluster = this.getClusterByFeature(newFeature);
  if(origCluster !== -1 && newCluster !== -1) {
    this.joinClusters(origCluster, newCluster);
  }
  else if(origCluster !== -1) {
    this.addFeatureToCluster(newFeature, origCluster);
  }
  else if(newCluster !== -1) {
    this.addFeatureToCluster(origFeature, newCluster);
  } else {
    var cluster = [newFeature, origFeature];
    this.clusters.push(cluster);
  }
};


/**
 * @param {number} index1
 * @param {number} index2
 */
ol.Cluster.prototype.joinClusters = function(index1, index2) {
  var cluster1 = this.clusters[index1];
  var cluster2 = this.clusters[index2];
  var joinedCluster = cluster1.concat(cluster2);
  this.clusters.splice(index1, 1);
  this.clusters.splice(index2-1, 1);
  this.clusters.push(joinedCluster);
};


/**
 * @param {ol.Feature} feature
 * @param {number} clusterIndex
 */
ol.Cluster.prototype.addFeatureToCluster = function(feature, clusterIndex) {
  var cluster = this.clusters[clusterIndex];
  cluster.push(feature);
};


ol.Cluster.prototype.createFeaturesFromClusters = function() {
  for(var i = 0; i < this.clusters.length; i++) {
    var cluster = this.clusters[i];
    if(cluster.length < this.smallestCluster) {
      var features = this.features.concat(cluster);
      this.features = features;
    } else {
      var options = {
        'features': cluster
      };
      var clusterFeature = new ol.ClusterFeature(options);
      this.features.push(clusterFeature);
    }
  }
};
