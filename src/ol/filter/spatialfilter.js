goog.provide('ol.filter.Spatial');
goog.provide('ol.filter.SpatialType');

goog.require('ol.filter.Filter');



/**
 * @constructor
 * @extends {ol.filter.Filter}
 * @param {ol.filter.SpatialOptions} options Options.
 */
ol.filter.Spatial = function(options) {
  goog.base(this);

  /**
   * @type {ol.filter.SpatialType}
   * @private
   */
  this.type_ = options.type;

  this.property_ = options.property;

  this.value_ = options.value;

  this.distance_ = options.distance;

  this.distanceUnits_ = options.distanceUnits;

  this.projection_ = options.projection;
};
goog.inherits(ol.filter.Spatial, ol.filter.Filter);


/**
 * @return {ol.filter.SpatialType} The type of spatial filter.
 */
ol.filter.Spatial.prototype.getType = function() {
  return this.type_;
};


/**
 * @return {string} The projection of the spatial filter.
 */
ol.filter.Spatial.prototype.getProjection = function() {
  return this.projection_;
};


/**
 * @return {string|undefined} The property to filter on.
 */
ol.filter.Spatial.prototype.getProperty = function() {
  return this.property_;
};


/**
 * @return {ol.geom.Geometry} The value of the spatial filter.
 */
ol.filter.Spatial.prototype.getValue = function() {
  return this.value_;
};


/**
 * @return {number|undefined} The distance for a DWITHIN filter.
 */
ol.filter.Spatial.prototype.getDistance = function() {
  return this.distance_;
};


/**
 * @return {string|undefined} The distance units in the case of DWITHIN.
 */
ol.filter.Spatial.prototype.getDistanceUnits = function() {
  return this.distanceUnits_;
};


/**
 * @inheritDoc
 */
ol.filter.Spatial.prototype.applies = function(feature) {
  var geometry = feature.getGeometry();
  var intersect = false;
  if (!goog.isNull(geometry)) {
    switch (this.type_) {
      case ol.filter.SpatialType.BBOX:
      case ol.filter.SpatialType.INTERSECTS:
        // TODO compare this.value_ with geometry and set intersect
        break;
      default:
        throw new Error('Applies is not implemented for this spatial' +
            'filter type: ' + this.type_);
        break;
    }
  }
  return intersect;
};


/**
 * @enum {string}
 */
ol.filter.SpatialType = {
  BBOX: 'BBOX',
  INTERSECTS: 'INTERSECTS',
  DWITHIN: 'DWITHIN',
  WITHIN: 'WITHIN',
  CONTAINS: 'CONTAINS'
};
