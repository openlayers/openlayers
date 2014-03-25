goog.provide('ol.ClusterFeature');

//goog.require('ol.Cluster');


/**
 * @constructor
 * @extends {ol.Feature}
 */
ol.ClusterFeature = function(options) {
  goog.base(this);

  /**
   * TODO features must be points
   * {Array.<ol.Feature>}
   */
  this.features = options['features'];

  //TODO bbox for the contained features

  var coordinates = this.calculateCoordinates();
  var geometry = new ol.geom.Point(coordinates);
  this.setGeometry(geometry);
};
goog.inherits(ol.ClusterFeature, ol.Feature);


ol.ClusterFeature.prototype.calculateCoordinates = function() {
  var xSum = 0;
  var ySum = 0;
  for(var i = 0; i < this.features.length; i++) {
  	var feature = this.features[i];
  	var geom = feature.getGeometry();
  	var coords = geom.getFlatCoordinates();
  	xSum += coords[0];
  	ySum += coords[1];
  }
  var centerX = xSum / this.features.length;
  var centerY = ySum / this.features.length;
  var center = [centerX, centerY];
  return center;
};
