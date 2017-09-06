import _ol_ from '../index';
import _ol_array_ from '../array';
import _ol_extent_ from '../extent';
import _ol_geom_GeometryLayout_ from '../geom/geometrylayout';
import _ol_geom_GeometryType_ from '../geom/geometrytype';
import _ol_geom_LinearRing_ from '../geom/linearring';
import _ol_geom_Point_ from '../geom/point';
import _ol_geom_SimpleGeometry_ from '../geom/simplegeometry';
import _ol_geom_flat_area_ from '../geom/flat/area';
import _ol_geom_flat_closest_ from '../geom/flat/closest';
import _ol_geom_flat_contains_ from '../geom/flat/contains';
import _ol_geom_flat_deflate_ from '../geom/flat/deflate';
import _ol_geom_flat_inflate_ from '../geom/flat/inflate';
import _ol_geom_flat_interiorpoint_ from '../geom/flat/interiorpoint';
import _ol_geom_flat_intersectsextent_ from '../geom/flat/intersectsextent';
import _ol_geom_flat_orient_ from '../geom/flat/orient';
import _ol_geom_flat_simplify_ from '../geom/flat/simplify';
import _ol_math_ from '../math';

/**
 * @classdesc
 * Polygon geometry.
 *
 * @constructor
 * @extends {ol.geom.SimpleGeometry}
 * @param {Array.<Array.<ol.Coordinate>>} coordinates Array of linear
 *     rings that define the polygon. The first linear ring of the array
 *     defines the outer-boundary or surface of the polygon. Each subsequent
 *     linear ring defines a hole in the surface of the polygon. A linear ring
 *     is an array of vertices' coordinates where the first coordinate and the
 *     last are equivalent.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 * @api
 */
var _ol_geom_Polygon_ = function(coordinates, opt_layout) {

  _ol_geom_SimpleGeometry_.call(this);

  /**
   * @type {Array.<number>}
   * @private
   */
  this.ends_ = [];

  /**
   * @private
   * @type {number}
   */
  this.flatInteriorPointRevision_ = -1;

  /**
   * @private
   * @type {ol.Coordinate}
   */
  this.flatInteriorPoint_ = null;

  /**
   * @private
   * @type {number}
   */
  this.maxDelta_ = -1;

  /**
   * @private
   * @type {number}
   */
  this.maxDeltaRevision_ = -1;

  /**
   * @private
   * @type {number}
   */
  this.orientedRevision_ = -1;

  /**
   * @private
   * @type {Array.<number>}
   */
  this.orientedFlatCoordinates_ = null;

  this.setCoordinates(coordinates, opt_layout);

};

_ol_.inherits(_ol_geom_Polygon_, _ol_geom_SimpleGeometry_);


/**
 * Append the passed linear ring to this polygon.
 * @param {ol.geom.LinearRing} linearRing Linear ring.
 * @api
 */
_ol_geom_Polygon_.prototype.appendLinearRing = function(linearRing) {
  if (!this.flatCoordinates) {
    this.flatCoordinates = linearRing.getFlatCoordinates().slice();
  } else {
    _ol_array_.extend(this.flatCoordinates, linearRing.getFlatCoordinates());
  }
  this.ends_.push(this.flatCoordinates.length);
  this.changed();
};


/**
 * Make a complete copy of the geometry.
 * @return {!ol.geom.Polygon} Clone.
 * @override
 * @api
 */
_ol_geom_Polygon_.prototype.clone = function() {
  var polygon = new _ol_geom_Polygon_(null);
  polygon.setFlatCoordinates(
      this.layout, this.flatCoordinates.slice(), this.ends_.slice());
  return polygon;
};


/**
 * @inheritDoc
 */
_ol_geom_Polygon_.prototype.closestPointXY = function(x, y, closestPoint, minSquaredDistance) {
  if (minSquaredDistance <
      _ol_extent_.closestSquaredDistanceXY(this.getExtent(), x, y)) {
    return minSquaredDistance;
  }
  if (this.maxDeltaRevision_ != this.getRevision()) {
    this.maxDelta_ = Math.sqrt(_ol_geom_flat_closest_.getsMaxSquaredDelta(
        this.flatCoordinates, 0, this.ends_, this.stride, 0));
    this.maxDeltaRevision_ = this.getRevision();
  }
  return _ol_geom_flat_closest_.getsClosestPoint(
      this.flatCoordinates, 0, this.ends_, this.stride,
      this.maxDelta_, true, x, y, closestPoint, minSquaredDistance);
};


/**
 * @inheritDoc
 */
_ol_geom_Polygon_.prototype.containsXY = function(x, y) {
  return _ol_geom_flat_contains_.linearRingsContainsXY(
      this.getOrientedFlatCoordinates(), 0, this.ends_, this.stride, x, y);
};


/**
 * Return the area of the polygon on projected plane.
 * @return {number} Area (on projected plane).
 * @api
 */
_ol_geom_Polygon_.prototype.getArea = function() {
  return _ol_geom_flat_area_.linearRings(
      this.getOrientedFlatCoordinates(), 0, this.ends_, this.stride);
};


/**
 * Get the coordinate array for this geometry.  This array has the structure
 * of a GeoJSON coordinate array for polygons.
 *
 * @param {boolean=} opt_right Orient coordinates according to the right-hand
 *     rule (counter-clockwise for exterior and clockwise for interior rings).
 *     If `false`, coordinates will be oriented according to the left-hand rule
 *     (clockwise for exterior and counter-clockwise for interior rings).
 *     By default, coordinate orientation will depend on how the geometry was
 *     constructed.
 * @return {Array.<Array.<ol.Coordinate>>} Coordinates.
 * @override
 * @api
 */
_ol_geom_Polygon_.prototype.getCoordinates = function(opt_right) {
  var flatCoordinates;
  if (opt_right !== undefined) {
    flatCoordinates = this.getOrientedFlatCoordinates().slice();
    _ol_geom_flat_orient_.orientLinearRings(
        flatCoordinates, 0, this.ends_, this.stride, opt_right);
  } else {
    flatCoordinates = this.flatCoordinates;
  }

  return _ol_geom_flat_inflate_.coordinatess(
      flatCoordinates, 0, this.ends_, this.stride);
};


/**
 * @return {Array.<number>} Ends.
 */
_ol_geom_Polygon_.prototype.getEnds = function() {
  return this.ends_;
};


/**
 * @return {Array.<number>} Interior point.
 */
_ol_geom_Polygon_.prototype.getFlatInteriorPoint = function() {
  if (this.flatInteriorPointRevision_ != this.getRevision()) {
    var flatCenter = _ol_extent_.getCenter(this.getExtent());
    this.flatInteriorPoint_ = _ol_geom_flat_interiorpoint_.linearRings(
        this.getOrientedFlatCoordinates(), 0, this.ends_, this.stride,
        flatCenter, 0);
    this.flatInteriorPointRevision_ = this.getRevision();
  }
  return this.flatInteriorPoint_;
};


/**
 * Return an interior point of the polygon.
 * @return {ol.geom.Point} Interior point.
 * @api
 */
_ol_geom_Polygon_.prototype.getInteriorPoint = function() {
  return new _ol_geom_Point_(this.getFlatInteriorPoint());
};


/**
 * Return the number of rings of the polygon,  this includes the exterior
 * ring and any interior rings.
 *
 * @return {number} Number of rings.
 * @api
 */
_ol_geom_Polygon_.prototype.getLinearRingCount = function() {
  return this.ends_.length;
};


/**
 * Return the Nth linear ring of the polygon geometry. Return `null` if the
 * given index is out of range.
 * The exterior linear ring is available at index `0` and the interior rings
 * at index `1` and beyond.
 *
 * @param {number} index Index.
 * @return {ol.geom.LinearRing} Linear ring.
 * @api
 */
_ol_geom_Polygon_.prototype.getLinearRing = function(index) {
  if (index < 0 || this.ends_.length <= index) {
    return null;
  }
  var linearRing = new _ol_geom_LinearRing_(null);
  linearRing.setFlatCoordinates(this.layout, this.flatCoordinates.slice(
      index === 0 ? 0 : this.ends_[index - 1], this.ends_[index]));
  return linearRing;
};


/**
 * Return the linear rings of the polygon.
 * @return {Array.<ol.geom.LinearRing>} Linear rings.
 * @api
 */
_ol_geom_Polygon_.prototype.getLinearRings = function() {
  var layout = this.layout;
  var flatCoordinates = this.flatCoordinates;
  var ends = this.ends_;
  var linearRings = [];
  var offset = 0;
  var i, ii;
  for (i = 0, ii = ends.length; i < ii; ++i) {
    var end = ends[i];
    var linearRing = new _ol_geom_LinearRing_(null);
    linearRing.setFlatCoordinates(layout, flatCoordinates.slice(offset, end));
    linearRings.push(linearRing);
    offset = end;
  }
  return linearRings;
};


/**
 * @return {Array.<number>} Oriented flat coordinates.
 */
_ol_geom_Polygon_.prototype.getOrientedFlatCoordinates = function() {
  if (this.orientedRevision_ != this.getRevision()) {
    var flatCoordinates = this.flatCoordinates;
    if (_ol_geom_flat_orient_.linearRingsAreOriented(
        flatCoordinates, 0, this.ends_, this.stride)) {
      this.orientedFlatCoordinates_ = flatCoordinates;
    } else {
      this.orientedFlatCoordinates_ = flatCoordinates.slice();
      this.orientedFlatCoordinates_.length =
          _ol_geom_flat_orient_.orientLinearRings(
              this.orientedFlatCoordinates_, 0, this.ends_, this.stride);
    }
    this.orientedRevision_ = this.getRevision();
  }
  return this.orientedFlatCoordinates_;
};


/**
 * @inheritDoc
 */
_ol_geom_Polygon_.prototype.getSimplifiedGeometryInternal = function(squaredTolerance) {
  var simplifiedFlatCoordinates = [];
  var simplifiedEnds = [];
  simplifiedFlatCoordinates.length = _ol_geom_flat_simplify_.quantizes(
      this.flatCoordinates, 0, this.ends_, this.stride,
      Math.sqrt(squaredTolerance),
      simplifiedFlatCoordinates, 0, simplifiedEnds);
  var simplifiedPolygon = new _ol_geom_Polygon_(null);
  simplifiedPolygon.setFlatCoordinates(
      _ol_geom_GeometryLayout_.XY, simplifiedFlatCoordinates, simplifiedEnds);
  return simplifiedPolygon;
};


/**
 * @inheritDoc
 * @api
 */
_ol_geom_Polygon_.prototype.getType = function() {
  return _ol_geom_GeometryType_.POLYGON;
};


/**
 * @inheritDoc
 * @api
 */
_ol_geom_Polygon_.prototype.intersectsExtent = function(extent) {
  return _ol_geom_flat_intersectsextent_.linearRings(
      this.getOrientedFlatCoordinates(), 0, this.ends_, this.stride, extent);
};


/**
 * Set the coordinates of the polygon.
 * @param {Array.<Array.<ol.Coordinate>>} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 * @override
 * @api
 */
_ol_geom_Polygon_.prototype.setCoordinates = function(coordinates, opt_layout) {
  if (!coordinates) {
    this.setFlatCoordinates(_ol_geom_GeometryLayout_.XY, null, this.ends_);
  } else {
    this.setLayout(opt_layout, coordinates, 2);
    if (!this.flatCoordinates) {
      this.flatCoordinates = [];
    }
    var ends = _ol_geom_flat_deflate_.coordinatess(
        this.flatCoordinates, 0, coordinates, this.stride, this.ends_);
    this.flatCoordinates.length = ends.length === 0 ? 0 : ends[ends.length - 1];
    this.changed();
  }
};


/**
 * @param {ol.geom.GeometryLayout} layout Layout.
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {Array.<number>} ends Ends.
 */
_ol_geom_Polygon_.prototype.setFlatCoordinates = function(layout, flatCoordinates, ends) {
  this.setFlatCoordinatesInternal(layout, flatCoordinates);
  this.ends_ = ends;
  this.changed();
};


/**
 * Create an approximation of a circle on the surface of a sphere.
 * @param {ol.Sphere} sphere The sphere.
 * @param {ol.Coordinate} center Center (`[lon, lat]` in degrees).
 * @param {number} radius The great-circle distance from the center to
 *     the polygon vertices.
 * @param {number=} opt_n Optional number of vertices for the resulting
 *     polygon. Default is `32`.
 * @return {ol.geom.Polygon} The "circular" polygon.
 * @api
 */
_ol_geom_Polygon_.circular = function(sphere, center, radius, opt_n) {
  var n = opt_n ? opt_n : 32;
  /** @type {Array.<number>} */
  var flatCoordinates = [];
  var i;
  for (i = 0; i < n; ++i) {
    _ol_array_.extend(
        flatCoordinates, sphere.offset(center, radius, 2 * Math.PI * i / n));
  }
  flatCoordinates.push(flatCoordinates[0], flatCoordinates[1]);
  var polygon = new _ol_geom_Polygon_(null);
  polygon.setFlatCoordinates(
      _ol_geom_GeometryLayout_.XY, flatCoordinates, [flatCoordinates.length]);
  return polygon;
};


/**
 * Create a polygon from an extent. The layout used is `XY`.
 * @param {ol.Extent} extent The extent.
 * @return {ol.geom.Polygon} The polygon.
 * @api
 */
_ol_geom_Polygon_.fromExtent = function(extent) {
  var minX = extent[0];
  var minY = extent[1];
  var maxX = extent[2];
  var maxY = extent[3];
  var flatCoordinates =
      [minX, minY, minX, maxY, maxX, maxY, maxX, minY, minX, minY];
  var polygon = new _ol_geom_Polygon_(null);
  polygon.setFlatCoordinates(
      _ol_geom_GeometryLayout_.XY, flatCoordinates, [flatCoordinates.length]);
  return polygon;
};


/**
 * Create a regular polygon from a circle.
 * @param {ol.geom.Circle} circle Circle geometry.
 * @param {number=} opt_sides Number of sides of the polygon. Default is 32.
 * @param {number=} opt_angle Start angle for the first vertex of the polygon in
 *     radians. Default is 0.
 * @return {ol.geom.Polygon} Polygon geometry.
 * @api
 */
_ol_geom_Polygon_.fromCircle = function(circle, opt_sides, opt_angle) {
  var sides = opt_sides ? opt_sides : 32;
  var stride = circle.getStride();
  var layout = circle.getLayout();
  var polygon = new _ol_geom_Polygon_(null, layout);
  var arrayLength = stride * (sides + 1);
  var flatCoordinates = new Array(arrayLength);
  for (var i = 0; i < arrayLength; i++) {
    flatCoordinates[i] = 0;
  }
  var ends = [flatCoordinates.length];
  polygon.setFlatCoordinates(layout, flatCoordinates, ends);
  _ol_geom_Polygon_.makeRegular(
      polygon, circle.getCenter(), circle.getRadius(), opt_angle);
  return polygon;
};


/**
 * Modify the coordinates of a polygon to make it a regular polygon.
 * @param {ol.geom.Polygon} polygon Polygon geometry.
 * @param {ol.Coordinate} center Center of the regular polygon.
 * @param {number} radius Radius of the regular polygon.
 * @param {number=} opt_angle Start angle for the first vertex of the polygon in
 *     radians. Default is 0.
 */
_ol_geom_Polygon_.makeRegular = function(polygon, center, radius, opt_angle) {
  var flatCoordinates = polygon.getFlatCoordinates();
  var layout = polygon.getLayout();
  var stride = polygon.getStride();
  var ends = polygon.getEnds();
  var sides = flatCoordinates.length / stride - 1;
  var startAngle = opt_angle ? opt_angle : 0;
  var angle, offset;
  for (var i = 0; i <= sides; ++i) {
    offset = i * stride;
    angle = startAngle + (_ol_math_.modulo(i, sides) * 2 * Math.PI / sides);
    flatCoordinates[offset] = center[0] + (radius * Math.cos(angle));
    flatCoordinates[offset + 1] = center[1] + (radius * Math.sin(angle));
  }
  polygon.setFlatCoordinates(layout, flatCoordinates, ends);
};
export default _ol_geom_Polygon_;
