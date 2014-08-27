goog.provide('ol.geom.Polygon');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('ol.array');
goog.require('ol.extent');
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

  this.setCoordinates(coordinates,
      /** @type {ol.geom.GeometryLayout|undefined} */ (opt_layout));

};
goog.inherits(ol.geom.Polygon, ol.geom.SimpleGeometry);


/**
 * @param {ol.geom.LinearRing} linearRing Linear ring.
 * @api stable
 */
ol.geom.Polygon.prototype.appendLinearRing = function(linearRing) {
  goog.asserts.assert(linearRing.getLayout() == this.layout);
  if (goog.isNull(this.flatCoordinates)) {
    this.flatCoordinates = linearRing.getFlatCoordinates().slice();
  } else {
    ol.array.safeExtend(this.flatCoordinates, linearRing.getFlatCoordinates());
  }
  this.ends_.push(this.flatCoordinates.length);
  this.dispatchChangeEvent();
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
 * @return {number} Area (on projected plane).
 * @api stable
 */
ol.geom.Polygon.prototype.getArea = function() {
  return ol.geom.flat.area.linearRings(
      this.getOrientedFlatCoordinates(), 0, this.ends_, this.stride);
};


/**
 * @return {Array.<Array.<ol.Coordinate>>} Coordinates.
 * @api stable
 */
ol.geom.Polygon.prototype.getCoordinates = function() {
  return ol.geom.flat.inflate.coordinatess(
      this.flatCoordinates, 0, this.ends_, this.stride);
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
 * @return {ol.geom.Point} Interior point.
 * @api stable
 */
ol.geom.Polygon.prototype.getInteriorPoint = function() {
  return new ol.geom.Point(this.getFlatInteriorPoint());
};


/**
 * @param {number} index Index.
 * @return {ol.geom.LinearRing} Linear ring.
 * @api stable
 */
ol.geom.Polygon.prototype.getLinearRing = function(index) {
  goog.asserts.assert(0 <= index && index < this.ends_.length);
  if (index < 0 || this.ends_.length <= index) {
    return null;
  }
  var linearRing = new ol.geom.LinearRing(null);
  linearRing.setFlatCoordinates(this.layout, this.flatCoordinates.slice(
      index === 0 ? 0 : this.ends_[index - 1], this.ends_[index]));
  return linearRing;
};


/**
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
 * @param {Array.<Array.<ol.Coordinate>>} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 * @api stable
 */
ol.geom.Polygon.prototype.setCoordinates = function(coordinates, opt_layout) {
  if (goog.isNull(coordinates)) {
    this.setFlatCoordinates(ol.geom.GeometryLayout.XY, null, this.ends_);
  } else {
    this.setLayout(opt_layout, coordinates, 2);
    if (goog.isNull(this.flatCoordinates)) {
      this.flatCoordinates = [];
    }
    var ends = ol.geom.flat.deflate.coordinatess(
        this.flatCoordinates, 0, coordinates, this.stride, this.ends_);
    this.flatCoordinates.length = ends.length === 0 ? 0 : ends[ends.length - 1];
    this.dispatchChangeEvent();
  }
};


/**
 * @param {ol.geom.GeometryLayout} layout Layout.
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {Array.<number>} ends Ends.
 */
ol.geom.Polygon.prototype.setFlatCoordinates =
    function(layout, flatCoordinates, ends) {
  if (goog.isNull(flatCoordinates)) {
    goog.asserts.assert(!goog.isNull(ends) && ends.length === 0);
  } else if (ends.length === 0) {
    goog.asserts.assert(flatCoordinates.length === 0);
  } else {
    goog.asserts.assert(flatCoordinates.length == ends[ends.length - 1]);
  }
  this.setFlatCoordinatesInternal(layout, flatCoordinates);
  this.ends_ = ends;
  this.dispatchChangeEvent();
};


/**
 * Create an approximation of a circle on the surface of a sphere.
 * @param {ol.Sphere} sphere The sphere.
 * @param {ol.Coordinate} center Center.
 * @param {number} radius Radius.
 * @param {number=} opt_n Optional number of points.  Default is `32`.
 * @return {ol.geom.Polygon} Circle geometry.
 * @api stable
 */
ol.geom.Polygon.circular = function(sphere, center, radius, opt_n) {
  var n = goog.isDef(opt_n) ? opt_n : 32;
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
