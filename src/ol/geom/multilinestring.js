import _ol_ from '../index';
import _ol_array_ from '../array';
import _ol_extent_ from '../extent';
import _ol_geom_GeometryLayout_ from '../geom/geometrylayout';
import _ol_geom_GeometryType_ from '../geom/geometrytype';
import _ol_geom_LineString_ from '../geom/linestring';
import _ol_geom_SimpleGeometry_ from '../geom/simplegeometry';
import _ol_geom_flat_closest_ from '../geom/flat/closest';
import _ol_geom_flat_deflate_ from '../geom/flat/deflate';
import _ol_geom_flat_inflate_ from '../geom/flat/inflate';
import _ol_geom_flat_interpolate_ from '../geom/flat/interpolate';
import _ol_geom_flat_intersectsextent_ from '../geom/flat/intersectsextent';
import _ol_geom_flat_simplify_ from '../geom/flat/simplify';

/**
 * @classdesc
 * Multi-linestring geometry.
 *
 * @constructor
 * @extends {ol.geom.SimpleGeometry}
 * @param {Array.<Array.<ol.Coordinate>>} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 * @api
 */
var _ol_geom_MultiLineString_ = function(coordinates, opt_layout) {

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
  this.maxDelta_ = -1;

  /**
   * @private
   * @type {number}
   */
  this.maxDeltaRevision_ = -1;

  this.setCoordinates(coordinates, opt_layout);

};

_ol_.inherits(_ol_geom_MultiLineString_, _ol_geom_SimpleGeometry_);


/**
 * Append the passed linestring to the multilinestring.
 * @param {ol.geom.LineString} lineString LineString.
 * @api
 */
_ol_geom_MultiLineString_.prototype.appendLineString = function(lineString) {
  if (!this.flatCoordinates) {
    this.flatCoordinates = lineString.getFlatCoordinates().slice();
  } else {
    _ol_array_.extend(
        this.flatCoordinates, lineString.getFlatCoordinates().slice());
  }
  this.ends_.push(this.flatCoordinates.length);
  this.changed();
};


/**
 * Make a complete copy of the geometry.
 * @return {!ol.geom.MultiLineString} Clone.
 * @override
 * @api
 */
_ol_geom_MultiLineString_.prototype.clone = function() {
  var multiLineString = new _ol_geom_MultiLineString_(null);
  multiLineString.setFlatCoordinates(
      this.layout, this.flatCoordinates.slice(), this.ends_.slice());
  return multiLineString;
};


/**
 * @inheritDoc
 */
_ol_geom_MultiLineString_.prototype.closestPointXY = function(x, y, closestPoint, minSquaredDistance) {
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
      this.maxDelta_, false, x, y, closestPoint, minSquaredDistance);
};


/**
 * Returns the coordinate at `m` using linear interpolation, or `null` if no
 * such coordinate exists.
 *
 * `opt_extrapolate` controls extrapolation beyond the range of Ms in the
 * MultiLineString. If `opt_extrapolate` is `true` then Ms less than the first
 * M will return the first coordinate and Ms greater than the last M will
 * return the last coordinate.
 *
 * `opt_interpolate` controls interpolation between consecutive LineStrings
 * within the MultiLineString. If `opt_interpolate` is `true` the coordinates
 * will be linearly interpolated between the last coordinate of one LineString
 * and the first coordinate of the next LineString.  If `opt_interpolate` is
 * `false` then the function will return `null` for Ms falling between
 * LineStrings.
 *
 * @param {number} m M.
 * @param {boolean=} opt_extrapolate Extrapolate. Default is `false`.
 * @param {boolean=} opt_interpolate Interpolate. Default is `false`.
 * @return {ol.Coordinate} Coordinate.
 * @api
 */
_ol_geom_MultiLineString_.prototype.getCoordinateAtM = function(m, opt_extrapolate, opt_interpolate) {
  if ((this.layout != _ol_geom_GeometryLayout_.XYM &&
       this.layout != _ol_geom_GeometryLayout_.XYZM) ||
      this.flatCoordinates.length === 0) {
    return null;
  }
  var extrapolate = opt_extrapolate !== undefined ? opt_extrapolate : false;
  var interpolate = opt_interpolate !== undefined ? opt_interpolate : false;
  return _ol_geom_flat_interpolate_.lineStringsCoordinateAtM(this.flatCoordinates, 0,
      this.ends_, this.stride, m, extrapolate, interpolate);
};


/**
 * Return the coordinates of the multilinestring.
 * @return {Array.<Array.<ol.Coordinate>>} Coordinates.
 * @override
 * @api
 */
_ol_geom_MultiLineString_.prototype.getCoordinates = function() {
  return _ol_geom_flat_inflate_.coordinatess(
      this.flatCoordinates, 0, this.ends_, this.stride);
};


/**
 * @return {Array.<number>} Ends.
 */
_ol_geom_MultiLineString_.prototype.getEnds = function() {
  return this.ends_;
};


/**
 * Return the linestring at the specified index.
 * @param {number} index Index.
 * @return {ol.geom.LineString} LineString.
 * @api
 */
_ol_geom_MultiLineString_.prototype.getLineString = function(index) {
  if (index < 0 || this.ends_.length <= index) {
    return null;
  }
  var lineString = new _ol_geom_LineString_(null);
  lineString.setFlatCoordinates(this.layout, this.flatCoordinates.slice(
      index === 0 ? 0 : this.ends_[index - 1], this.ends_[index]));
  return lineString;
};


/**
 * Return the linestrings of this multilinestring.
 * @return {Array.<ol.geom.LineString>} LineStrings.
 * @api
 */
_ol_geom_MultiLineString_.prototype.getLineStrings = function() {
  var flatCoordinates = this.flatCoordinates;
  var ends = this.ends_;
  var layout = this.layout;
  /** @type {Array.<ol.geom.LineString>} */
  var lineStrings = [];
  var offset = 0;
  var i, ii;
  for (i = 0, ii = ends.length; i < ii; ++i) {
    var end = ends[i];
    var lineString = new _ol_geom_LineString_(null);
    lineString.setFlatCoordinates(layout, flatCoordinates.slice(offset, end));
    lineStrings.push(lineString);
    offset = end;
  }
  return lineStrings;
};


/**
 * @return {Array.<number>} Flat midpoints.
 */
_ol_geom_MultiLineString_.prototype.getFlatMidpoints = function() {
  var midpoints = [];
  var flatCoordinates = this.flatCoordinates;
  var offset = 0;
  var ends = this.ends_;
  var stride = this.stride;
  var i, ii;
  for (i = 0, ii = ends.length; i < ii; ++i) {
    var end = ends[i];
    var midpoint = _ol_geom_flat_interpolate_.lineString(
        flatCoordinates, offset, end, stride, 0.5);
    _ol_array_.extend(midpoints, midpoint);
    offset = end;
  }
  return midpoints;
};


/**
 * @inheritDoc
 */
_ol_geom_MultiLineString_.prototype.getSimplifiedGeometryInternal = function(squaredTolerance) {
  var simplifiedFlatCoordinates = [];
  var simplifiedEnds = [];
  simplifiedFlatCoordinates.length = _ol_geom_flat_simplify_.douglasPeuckers(
      this.flatCoordinates, 0, this.ends_, this.stride, squaredTolerance,
      simplifiedFlatCoordinates, 0, simplifiedEnds);
  var simplifiedMultiLineString = new _ol_geom_MultiLineString_(null);
  simplifiedMultiLineString.setFlatCoordinates(
      _ol_geom_GeometryLayout_.XY, simplifiedFlatCoordinates, simplifiedEnds);
  return simplifiedMultiLineString;
};


/**
 * @inheritDoc
 * @api
 */
_ol_geom_MultiLineString_.prototype.getType = function() {
  return _ol_geom_GeometryType_.MULTI_LINE_STRING;
};


/**
 * @inheritDoc
 * @api
 */
_ol_geom_MultiLineString_.prototype.intersectsExtent = function(extent) {
  return _ol_geom_flat_intersectsextent_.lineStrings(
      this.flatCoordinates, 0, this.ends_, this.stride, extent);
};


/**
 * Set the coordinates of the multilinestring.
 * @param {Array.<Array.<ol.Coordinate>>} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 * @override
 * @api
 */
_ol_geom_MultiLineString_.prototype.setCoordinates = function(coordinates, opt_layout) {
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
_ol_geom_MultiLineString_.prototype.setFlatCoordinates = function(layout, flatCoordinates, ends) {
  this.setFlatCoordinatesInternal(layout, flatCoordinates);
  this.ends_ = ends;
  this.changed();
};


/**
 * @param {Array.<ol.geom.LineString>} lineStrings LineStrings.
 */
_ol_geom_MultiLineString_.prototype.setLineStrings = function(lineStrings) {
  var layout = this.getLayout();
  var flatCoordinates = [];
  var ends = [];
  var i, ii;
  for (i = 0, ii = lineStrings.length; i < ii; ++i) {
    var lineString = lineStrings[i];
    if (i === 0) {
      layout = lineString.getLayout();
    }
    _ol_array_.extend(flatCoordinates, lineString.getFlatCoordinates());
    ends.push(flatCoordinates.length);
  }
  this.setFlatCoordinates(layout, flatCoordinates, ends);
};
export default _ol_geom_MultiLineString_;
