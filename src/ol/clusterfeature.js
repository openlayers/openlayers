goog.provide('ol.ClusterFeature');

goog.require('goog.asserts');
goog.require('ol.Feature');
goog.require('ol.extent');
goog.require('ol.geom.Point');



/**
 * @constructor
 * @param {olx.ClusterFeatureOptions} options
 * @extends {ol.Feature}
 */
ol.ClusterFeature = function(options) {
  goog.base(this);

  /**
   * {Array.<ol.Feature>}
   */
  this.features = options.features;

  /**
   * @type {ol.Extent}
   */
  this.bbox = this.calculateBbox();

  var coordinates = this.calculateCoordinates();
  var geometry = new ol.geom.Point(coordinates);
  this.setGeometry(geometry);
};
goog.inherits(ol.ClusterFeature, ol.Feature);


/**
 * @return {ol.Extent}
 */
ol.ClusterFeature.prototype.calculateBbox = function() {
  var coordsArray = [];
  for (var i = 0; i < this.features.length; i++) {
    var feature = this.features[i];
    var geom = feature.getGeometry();
    goog.asserts.assert(geom instanceof ol.geom.Point);
    var coords = geom.getCoordinates();
    coordsArray.push(coords);
  }
  var extent = ol.extent.boundingExtent(coordsArray);
  return extent;
};


/**
 * @return {ol.Coordinate}
 */
ol.ClusterFeature.prototype.calculateCoordinates = function() {
  var xSum = 0;
  var ySum = 0;
  for (var i = 0; i < this.features.length; i++) {
    var feature = this.features[i];
    var geom = feature.getGeometry();
    goog.asserts.assert(geom instanceof ol.geom.Point);
    var coords = geom.getCoordinates();
    xSum += coords[0];
    ySum += coords[1];
  }
  var centerX = xSum / this.features.length;
  var centerY = ySum / this.features.length;
  var center = [centerX, centerY];
  return center;
};
