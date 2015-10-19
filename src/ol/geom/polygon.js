goog.provide('ol.geom.Polygon');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.math');
goog.require('ol');
goog.require('ol.extent');
goog.require('ol.geom.GeometryLayout');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.LinearRing');
goog.require('ol.geom.Point');
goog.require('ol.geom.SimpleGeometry');
goog.require('ol.geom.flat.area');
goog.require('ol.geom.flat.closest');
goog.require('ol.geom.flat.contains');
goog.require('ol.geom.flat.deflate');
goog.require('ol.geom.flat.inflate');
goog.require('ol.geom.flat.interiorpoint');
goog.require('ol.geom.flat.intersectsextent');
goog.require('ol.geom.flat.orient');
goog.require('ol.geom.flat.simplify');



/**
 * @classdesc
 * Polygon geometry.
 *
 * @constructor
 * @extends {ol.geom.SimpleGeometry}
 * @param {Array.<Array.<ol.Coordinate>>} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 * @api stable
 */
ol.geom.Polygon = function(coordinates, opt_layout) {

  goog.base(this);

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
goog.inherits(ol.geom.Polygon, ol.geom.SimpleGeometry);


/**
 * Append the passed linear ring to this polygon.
 * @param {ol.geom.LinearRing} linearRing Linear ring.
 * @api stable
 */
ol.geom.Polygon.prototype.appendLinearRing = function(linearRing) {
  goog.asserts.assert(linearRing.getLayout() == this.layout,
      'layout of linearRing should match layout');
  if (!this.flatCoordinates) {
    this.flatCoordinates = linearRing.getFlatCoordinates().slice();
  } else {
    goog.array.extend(this.flatCoordinates, linearRing.getFlatCoordinates());
  }
  this.ends_.push(this.flatCoordinates.length);
  this.changed();
};


/**
 * Make a complete copy of the geometry.
 * @return {!ol.geom.Polygon} Clone.
 * @api stable
 */
ol.geom.Polygon.prototype.clone = function() {
  var polygon = new ol.geom.Polygon(null);
  polygon.setFlatCoordinates(
      this.layout, this.flatCoordinates.slice(), this.ends_.slice());
  return polygon;
};


/**
 * @inheritDoc
 */
ol.geom.Polygon.prototype.closestPointXY =
    function(x, y, closestPoint, minSquaredDistance) {
  if (minSquaredDistance <
      ol.extent.closestSquaredDistanceXY(this.getExtent(), x, y)) {
    return minSquaredDistance;
  }
  if (this.maxDeltaRevision_ != this.getRevision()) {
    this.maxDelta_ = Math.sqrt(ol.geom.flat.closest.getsMaxSquaredDelta(
        this.flatCoordinates, 0, this.ends_, this.stride, 0));
    this.maxDeltaRevision_ = this.getRevision();
  }
  return ol.geom.flat.closest.getsClosestPoint(
      this.flatCoordinates, 0, this.ends_, this.stride,
      this.maxDelta_, true, x, y, closestPoint, minSquaredDistance);
};


/**
 * @inheritDoc
 */
ol.geom.Polygon.prototype.containsXY = function(x, y) {
  return ol.geom.flat.contains.linearRingsContainsXY(
      this.getOrientedFlatCoordinates(), 0, this.ends_, this.stride, x, y);
};


/**
 * Return the area of the polygon on projected plane.
 * @return {number} Area (on projected plane).
 * @api stable
 */
ol.geom.Polygon.prototype.getArea = function() {
  return ol.geom.flat.area.linearRings(
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
 * @api stable
 */
ol.geom.Polygon.prototype.getCoordinates = function(opt_right) {
  var flatCoordinates;
  if (opt_right !== undefined) {
    flatCoordinates = this.getOrientedFlatCoordinates().slice();
    ol.geom.flat.orient.orientLinearRings(
        flatCoordinates, 0, this.ends_, this.stride, opt_right);
  } else {
    flatCoordinates = this.flatCoordinates;
  }

  return ol.geom.flat.inflate.coordinatess(
      flatCoordinates, 0, this.ends_, this.stride);
};


/**
 * @return {Array.<number>} Ends.
 */
ol.geom.Polygon.prototype.getEnds = function() {
  return this.ends_;
};


/**
 * @return {Array.<number>} Interior point.
 */
ol.geom.Polygon.prototype.getFlatInteriorPoint = function() {
  if (this.flatInteriorPointRevision_ != this.getRevision()) {
    var flatCenter = ol.extent.getCenter(this.getExtent());
    this.flatInteriorPoint_ = ol.geom.flat.interiorpoint.linearRings(
        this.getOrientedFlatCoordinates(), 0, this.ends_, this.stride,
        flatCenter, 0);
    this.flatInteriorPointRevision_ = this.getRevision();
  }
  return this.flatInteriorPoint_;
};


/**
 * Return an interior point of the polygon.
 * @return {ol.geom.Point} Interior point.
 * @api stable
 */
ol.geom.Polygon.prototype.getInteriorPoint = function() {
  return new ol.geom.Point(this.getFlatInteriorPoint());
};


/**
 * Return the number of rings of the polygon,  this includes the exterior
 * ring and any interior rings.
 *
 * @return {number} Number of rings.
 * @api
 */
ol.geom.Polygon.prototype.getLinearRingCount = function() {
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
 * @api stable
 */
ol.geom.Polygon.prototype.getLinearRing = function(index) {
  goog.asserts.assert(0 <= index && index < this.ends_.length,
      'index should be in between 0 and and length of this.ends_');
  if (index < 0 || this.ends_.length <= index) {
    return null;
  }
  var linearRing = new ol.geom.LinearRing(null);
  linearRing.setFlatCoordinates(this.layout, this.flatCoordinates.slice(
      index === 0 ? 0 : this.ends_[index - 1], this.ends_[index]));
  return linearRing;
};


/**
 * Return the linear rings of the polygon.
 * @return {Array.<ol.geom.LinearRing>} Linear rings.
 * @api stable
 */
ol.geom.Polygon.prototype.getLinearRings = function() {
  var layout = this.layout;
  var flatCoordinates = this.flatCoordinates;
  var ends = this.ends_;
  var linearRings = [];
  var offset = 0;
  var i, ii;
  for (i = 0, ii = ends.length; i < ii; ++i) {
    var end = ends[i];
    var linearRing = new ol.geom.LinearRing(null);
    linearRing.setFlatCoordinates(layout, flatCoordinates.slice(offset, end));
    linearRings.push(linearRing);
    offset = end;
  }
  return linearRings;
};


/**
 * @return {Array.<number>} Oriented flat coordinates.
 */
ol.geom.Polygon.prototype.getOrientedFlatCoordinates = function() {
  if (this.orientedRevision_ != this.getRevision()) {
    var flatCoordinates = this.flatCoordinates;
    if (ol.geom.flat.orient.linearRingsAreOriented(
        flatCoordinates, 0, this.ends_, this.stride)) {
      this.orientedFlatCoordinates_ = flatCoordinates;
    } else {
      this.orientedFlatCoordinates_ = flatCoordinates.slice();
      this.orientedFlatCoordinates_.length =
          ol.geom.flat.orient.orientLinearRings(
              this.orientedFlatCoordinates_, 0, this.ends_, this.stride);
    }
    this.orientedRevision_ = this.getRevision();
  }
  return this.orientedFlatCoordinates_;
};


/**
 * @inheritDoc
 */
ol.geom.Polygon.prototype.getSimplifiedGeometryInternal =
    function(squaredTolerance) {
  var simplifiedFlatCoordinates = [];
  var simplifiedEnds = [];
  simplifiedFlatCoordinates.length = ol.geom.flat.simplify.quantizes(
      this.flatCoordinates, 0, this.ends_, this.stride,
      Math.sqrt(squaredTolerance),
      simplifiedFlatCoordinates, 0, simplifiedEnds);
  var simplifiedPolygon = new ol.geom.Polygon(null);
  simplifiedPolygon.setFlatCoordinates(
      ol.geom.GeometryLayout.XY, simplifiedFlatCoordinates, simplifiedEnds);
  return simplifiedPolygon;
};


/**
 * @inheritDoc
 * @api stable
 */
ol.geom.Polygon.prototype.getType = function() {
  return ol.geom.GeometryType.POLYGON;
};


/**
 * @inheritDoc
 * @api stable
 */
ol.geom.Polygon.prototype.intersectsExtent = function(extent) {
  return ol.geom.flat.intersectsextent.linearRings(
      this.getOrientedFlatCoordinates(), 0, this.ends_, this.stride, extent);
};


/**
 * Set the coordinates of the polygon.
 * @param {Array.<Array.<ol.Coordinate>>} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 * @api stable
 */
ol.geom.Polygon.prototype.setCoordinates = function(coordinates, opt_layout) {
  if (!coordinates) {
    this.setFlatCoordinates(ol.geom.GeometryLayout.XY, null, this.ends_);
  } else {
    this.setLayout(opt_layout, coordinates, 2);
    if (!this.flatCoordinates) {
      this.flatCoordinates = [];
    }
    var ends = ol.geom.flat.deflate.coordinatess(
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
ol.geom.Polygon.prototype.setFlatCoordinates =
    function(layout, flatCoordinates, ends) {
  if (!flatCoordinates) {
    goog.asserts.assert(ends && ends.length === 0,
        'ends must be an empty array');
  } else if (ends.length === 0) {
    goog.asserts.assert(flatCoordinates.length === 0,
        'flatCoordinates should be an empty array');
  } else {
    goog.asserts.assert(flatCoordinates.length == ends[ends.length - 1],
        'the length of flatCoordinates should be the last entry of ends');
  }
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
 * @api stable
 */
ol.geom.Polygon.circular = function(sphere, center, radius, opt_n) {
  var n = opt_n ? opt_n : 32;
  /** @type {Array.<number>} */
  var flatCoordinates = [];
  var i;
  for (i = 0; i < n; ++i) {
    goog.array.extend(
        flatCoordinates, sphere.offset(center, radius, 2 * Math.PI * i / n));
  }
  flatCoordinates.push(flatCoordinates[0], flatCoordinates[1]);
  var polygon = new ol.geom.Polygon(null);
  polygon.setFlatCoordinates(
      ol.geom.GeometryLayout.XY, flatCoordinates, [flatCoordinates.length]);
  return polygon;
};


/**
 * Create a polygon from an extent. The layout used is `XY`.
 * @param {ol.Extent} extent The extent.
 * @return {ol.geom.Polygon} The polygon.
 * @api
 */
ol.geom.Polygon.fromExtent = function(extent) {
  var minX = extent[0];
  var minY = extent[1];
  var maxX = extent[2];
  var maxY = extent[3];
  var flatCoordinates =
      [minX, minY, minX, maxY, maxX, maxY, maxX, minY, minX, minY];
  var polygon = new ol.geom.Polygon(null);
  polygon.setFlatCoordinates(
      ol.geom.GeometryLayout.XY, flatCoordinates, [flatCoordinates.length]);
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
ol.geom.Polygon.fromCircle = function(circle, opt_sides, opt_angle) {
  var sides = opt_sides ? opt_sides : 32;
  var stride = circle.getStride();
  var layout = circle.getLayout();
  var polygon = new ol.geom.Polygon(null, layout);
  var flatCoordinates = goog.array.repeat(0, stride * (sides + 1));
  var ends = [flatCoordinates.length];
  polygon.setFlatCoordinates(layout, flatCoordinates, ends);
  ol.geom.Polygon.makeRegular(
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
ol.geom.Polygon.makeRegular = function(polygon, center, radius, opt_angle) {
  var flatCoordinates = polygon.getFlatCoordinates();
  var layout = polygon.getLayout();
  var stride = polygon.getStride();
  var ends = polygon.getEnds();
  goog.asserts.assert(ends.length === 1, 'only 1 ring is supported');
  var sides = flatCoordinates.length / stride - 1;
  var startAngle = opt_angle ? opt_angle : 0;
  var angle, offset;
  for (var i = 0; i <= sides; ++i) {
    offset = i * stride;
    angle = startAngle + (goog.math.modulo(i, sides) * 2 * Math.PI / sides);
    flatCoordinates[offset] = center[0] + (radius * Math.cos(angle));
    flatCoordinates[offset + 1] = center[1] + (radius * Math.sin(angle));
  }
  polygon.setFlatCoordinates(layout, flatCoordinates, ends);
};
