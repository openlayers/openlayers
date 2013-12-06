// FIXME add GeometryCollection

goog.provide('ol.geom.Geometry');

goog.require('goog.asserts');
goog.require('goog.events.EventType');
goog.require('goog.functions');
goog.require('goog.object');
goog.require('ol.Observable');
goog.require('ol.extent');
goog.require('ol.geom.flat');


/**
 * @enum {string}
 */
ol.geom.GeometryType = {
  POINT: 'Point',
  LINE_STRING: 'LineString',
  LINEAR_RING: 'LinearRing',
  POLYGON: 'Polygon',
  MULTI_POINT: 'MultiPoint',
  MULTI_LINE_STRING: 'MultiLineString',
  MULTI_POLYGON: 'MultiPolygon'
};


/**
 * @enum {string}
 */
ol.geom.GeometryLayout = {
  XY: 'XY',
  XYZ: 'XYZ',
  XYM: 'XYM',
  XYZM: 'XYZM'
};



/**
 * @constructor
 * @extends {ol.Observable}
 */
ol.geom.Geometry = function() {

  goog.base(this);

  /**
   * @protected
   * @type {ol.geom.GeometryLayout}
   */
  this.layout = ol.geom.GeometryLayout.XY;

  /**
   * @protected
   * @type {number}
   */
  this.stride = 2;

  /**
   * @protected
   * @type {Array.<number>}
   */
  this.flatCoordinates = null;

  /**
   * @protected
   * @type {number}
   */
  this.revision = 0;

  /**
   * @protected
   * @type {ol.Extent|undefined}
   */
  this.extent = undefined;

  /**
   * @protected
   * @type {number}
   */
  this.extentRevision = -1;

  /**
   * @private
   * @type {Object.<string, ol.geom.Geometry>}
   */
  this.simplifiedGeometryCache_ = {};

  /**
   * @private
   * @type {number}
   */
  this.simplifiedGeometryRevision_ = 0;

};
goog.inherits(ol.geom.Geometry, ol.Observable);


/**
 * @param {number} stride Stride.
 * @private
 * @return {ol.geom.GeometryLayout} layout Layout.
 */
ol.geom.Geometry.getLayoutForStride_ = function(stride) {
  if (stride == 2) {
    return ol.geom.GeometryLayout.XY;
  } else if (stride == 3) {
    return ol.geom.GeometryLayout.XYZ;
  } else if (stride == 4) {
    return ol.geom.GeometryLayout.XYZM;
  } else {
    throw new Error('unsupported stride: ' + stride);
  }
};


/**
 * @param {ol.geom.GeometryLayout} layout Layout.
 * @private
 * @return {number} Stride.
 */
ol.geom.Geometry.getStrideForLayout_ = function(layout) {
  if (layout == ol.geom.GeometryLayout.XY) {
    return 2;
  } else if (layout == ol.geom.GeometryLayout.XYZ) {
    return 3;
  } else if (layout == ol.geom.GeometryLayout.XYM) {
    return 3;
  } else if (layout == ol.geom.GeometryLayout.XYZM) {
    return 4;
  } else {
    throw new Error('unsupported layout: ' + layout);
  }
};


/**
 * @param {ol.Coordinate} coordinate Coordinate.
 * @return {boolean} Contains coordinate.
 */
ol.geom.Geometry.prototype.containsCoordinate = function(coordinate) {
  return this.containsXY(coordinate[0], coordinate[1]);
};


/**
 * @param {number} x X.
 * @param {number} y Y.
 * @return {boolean} Contains (x, y).
 */
ol.geom.Geometry.prototype.containsXY = goog.functions.FALSE;


/**
 * FIXME empty description for jsdoc
 */
ol.geom.Geometry.prototype.dispatchChangeEvent = function() {
  ++this.revision;
  this.dispatchEvent(goog.events.EventType.CHANGE);
};


/**
 * @param {ol.Extent=} opt_extent Extent.
 * @return {ol.Extent} extent Extent.
 */
ol.geom.Geometry.prototype.getExtent = function(opt_extent) {
  if (this.extentRevision != this.revision) {
    this.extent = ol.extent.createOrUpdateFromFlatCoordinates(
        this.flatCoordinates, this.stride, this.extent);
    this.extentRevision = this.revision;
  }
  goog.asserts.assert(goog.isDef(this.extent));
  return ol.extent.returnOrUpdate(this.extent, opt_extent);
};


/**
 * @return {Array.<number>} Flat coordinates.
 */
ol.geom.Geometry.prototype.getFlatCoordinates = function() {
  return this.flatCoordinates;
};


/**
 * @return {ol.geom.GeometryLayout} Layout.
 */
ol.geom.Geometry.prototype.getLayout = function() {
  return this.layout;
};


/**
 * @return {number} Revision.
 */
ol.geom.Geometry.prototype.getRevision = function() {
  return this.revision;
};


/**
 * @param {number} squaredTolerance Squared tolerance.
 * @return {ol.geom.Geometry} Simplified geometry.
 */
ol.geom.Geometry.prototype.getSimplifiedGeometry = function(squaredTolerance) {
  if (this.simplifiedGeometryRevision_ != this.revision) {
    goog.object.clear(this.simplifiedGeometryCache_);
    this.simplifiedGeometryRevision_ = this.revision;
  }
  if (squaredTolerance < 0) {
    return this;
  }
  var key = squaredTolerance.toString();
  if (this.simplifiedGeometryCache_.hasOwnProperty(key)) {
    return this.simplifiedGeometryCache_[key];
  } else {
    var simplifiedGeometry =
        this.getSimplifiedGeometryInternal(squaredTolerance);
    this.simplifiedGeometryCache_[key] = simplifiedGeometry;
    return simplifiedGeometry;
  }
};


/**
 * @param {number} squaredTolerance Squared tolerance.
 * @return {ol.geom.Geometry} Simplified geometry.
 * @protected
 */
ol.geom.Geometry.prototype.getSimplifiedGeometryInternal =
    function(squaredTolerance) {
  return this;
};


/**
 * @return {number} Stride.
 */
ol.geom.Geometry.prototype.getStride = function() {
  return this.stride;
};


/**
 * @return {ol.geom.GeometryType} Geometry type.
 */
ol.geom.Geometry.prototype.getType = goog.abstractMethod;


/**
 * @param {ol.geom.GeometryLayout} layout Layout.
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @protected
 */
ol.geom.Geometry.prototype.setFlatCoordinatesInternal =
    function(layout, flatCoordinates) {
  this.stride = ol.geom.Geometry.getStrideForLayout_(layout);
  this.layout = layout;
  this.flatCoordinates = flatCoordinates;
};


/**
 * @param {ol.geom.GeometryLayout|undefined} layout Layout.
 * @param {Array} coordinates Coordinates.
 * @param {number} nesting Nesting.
 * @protected
 */
ol.geom.Geometry.prototype.setLayout =
    function(layout, coordinates, nesting) {
  /** @type {number} */
  var stride;
  if (goog.isDef(layout)) {
    stride = ol.geom.Geometry.getStrideForLayout_(layout);
  } else {
    var i;
    for (i = 0; i < nesting; ++i) {
      if (coordinates.length === 0) {
        this.layout = ol.geom.GeometryLayout.XY;
        this.stride = 2;
        return;
      } else {
        coordinates = /** @type {Array} */ (coordinates[0]);
      }
    }
    stride = (/** @type {Array} */ (coordinates)).length;
    layout = ol.geom.Geometry.getLayoutForStride_(stride);
  }
  this.layout = layout;
  this.stride = stride;
};


/**
 * @param {ol.TransformFunction} transformFn Transform.
 */
ol.geom.Geometry.prototype.transform = function(transformFn) {
  if (!goog.isNull(this.flatCoordinates)) {
    transformFn(this.flatCoordinates, this.flatCoordinates, this.stride);
    this.dispatchChangeEvent();
  }
};


/**
 * @typedef {ol.Coordinate}
 */
ol.geom.RawPoint;


/**
 * @typedef {Array.<ol.Coordinate>}
 */
ol.geom.RawLineString;


/**
 * @typedef {Array.<ol.Coordinate>}
 *
 */
ol.geom.RawLinearRing;


/**
 * @typedef {Array.<ol.geom.RawLinearRing>}
 */
ol.geom.RawPolygon;


/**
 * @typedef {Array.<ol.geom.RawPoint>}
 */
ol.geom.RawMultiPoint;


/**
 * @typedef {Array.<ol.geom.RawLineString>}
 */
ol.geom.RawMultiLineString;


/**
 * @typedef {Array.<ol.geom.RawPolygon>}
 */
ol.geom.RawMultiPolygon;


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {goog.vec.Mat4.AnyType} transform Transform.
 * @param {Array.<number>=} opt_dest Destination.
 * @return {Array.<number>} Transformed flat coordinates.
 */
ol.geom.transformGeometry2D = function(geometry, transform, opt_dest) {
  var flatCoordinates = geometry.getFlatCoordinates();
  if (goog.isNull(flatCoordinates)) {
    return null;
  } else {
    var stride = geometry.getStride();
    return ol.geom.flat.transform2D(
        flatCoordinates, stride, transform, opt_dest);
  }
};
