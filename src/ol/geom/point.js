goog.provide('ol.geom.Point');

goog.require('goog.asserts');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.SharedVertices');
goog.require('ol.geom.Vertex');



/**
 * @constructor
 * @extends {ol.geom.Geometry}
 * @param {ol.geom.Vertex} coordinates Coordinates array (e.g. [x, y]).
 * @param {ol.geom.SharedVertices=} opt_shared Shared vertices.
 */
ol.geom.Point = function(coordinates, opt_shared) {
  goog.base(this);

  var vertices = opt_shared,
      dimension;

  if (!goog.isDef(vertices)) {
    dimension = coordinates.length;
    vertices = new ol.geom.SharedVertices({dimension: dimension});
  }

  /**
   * @type {ol.geom.SharedVertices}
   */
  this.vertices = vertices;

  /**
   * @type {number}
   * @private
   */
  this.sharedId_ = vertices.add([coordinates]);

  /**
   * @type {number}
   */
  this.dimension = vertices.getDimension();
  goog.asserts.assert(this.dimension >= 2);

  /**
   * @type {ol.Extent}
   * @private
   */
  this.bounds_ = null;

};
goog.inherits(ol.geom.Point, ol.geom.Geometry);


/**
 * @param {number} dim Coordinate dimension.
 * @return {number} The coordinate value.
 */
ol.geom.Point.prototype.get = function(dim) {
  return this.vertices.get(this.sharedId_, 0, dim);
};


/**
 * @inheritDoc
 */
ol.geom.Point.prototype.getBounds = function() {
  if (goog.isNull(this.bounds_)) {
    var x = this.get(0),
        y = this.get(1);
    this.bounds_ = [x, x, y, y];
  }
  return this.bounds_;
};


/**
 * @inheritDoc
 * @return {ol.geom.Vertex} Coordinates array.
 */
ol.geom.Point.prototype.getCoordinates = function() {
  var coordinates = new Array(this.dimension);
  for (var i = 0; i < this.dimension; ++i) {
    coordinates[i] = this.get(i);
  }
  return coordinates;
};


/**
 * @inheritDoc
 */
ol.geom.Point.prototype.getType = function() {
  return ol.geom.GeometryType.POINT;
};


/**
 * Get the identifier used to mark this point in the shared vertices structure.
 * @return {number} The identifier.
 */
ol.geom.Point.prototype.getSharedId = function() {
  return this.sharedId_;
};
