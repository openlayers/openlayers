// FIXME add GeometryCollection

goog.provide('ol.geom.Geometry');

goog.require('goog.asserts');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('goog.functions');
goog.require('ol.extent');
goog.require('ol.geom.flat');


/**
 * @enum {string}
 */
ol.geom.Type = {
  POINT: 'Point',
  LINE_STRING: 'LineString',
  POLYGON: 'Polygon',
  MULTI_POINT: 'MultiPoint',
  MULTI_LINE_STRING: 'MultiLineString',
  MULTI_POLYGON: 'MultiPolygon'
};


/**
 * @enum {string}
 */
ol.geom.Layout = {
  XY: 'XY',
  XYZ: 'XYZ',
  XYM: 'XYM',
  XYZM: 'XYZM'
};



/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
ol.geom.Geometry = function() {

  goog.base(this);

  /**
   * @protected
   * @type {ol.geom.Layout}
   */
  this.layout = ol.geom.Layout.XY;

  /**
   * @protected
   * @type {number}
   */
  this.stride = 2;

  /**
   * @protected
   * @type {Array.<number>}
   */
  this.flatCoordinates = [];

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

};
goog.inherits(ol.geom.Geometry, goog.events.EventTarget);


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
 * @return {ol.geom.Layout} Layout.
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
 * @return {number} Stride.
 */
ol.geom.Geometry.prototype.getStride = function() {
  return this.stride;
};


/**
 * @return {ol.geom.Type} Geometry type.
 */
ol.geom.Geometry.prototype.getType = goog.abstractMethod;


/**
 * @param {ol.geom.Layout|undefined} layout Layout.
 * @param {Array} coordinates Coordinates.
 * @param {number} nesting Nesting.
 * @protected
 */
ol.geom.Geometry.prototype.setLayout =
    function(layout, coordinates, nesting) {
  /** @type {number} */
  var stride;
  if (goog.isDef(layout)) {
    if (layout == ol.geom.Layout.XY) {
      stride = 2;
    } else if (layout == ol.geom.Layout.XYZ) {
      stride = 3;
    } else if (layout == ol.geom.Layout.XYM) {
      stride = 3;
    } else if (layout == ol.geom.Layout.XYZM) {
      stride = 4;
    } else {
      throw new Error('unsupported layout: ' + layout);
    }
  } else {
    var i;
    for (i = 0; i < nesting; ++i) {
      if (coordinates.length === 0) {
        this.layout = ol.geom.Layout.XY;
        this.stride = 2;
        return;
      } else {
        coordinates = coordinates[0];
      }
    }
    stride = (/** @type {Array} */ (coordinates)).length;
    if (stride == 2) {
      layout = ol.geom.Layout.XY;
    } else if (stride == 3) {
      layout = ol.geom.Layout.XYZ;
    } else if (stride == 4) {
      layout = ol.geom.Layout.XYZM;
    } else {
      throw new Error('unsupported stride: ' + stride);
    }
  }
  this.layout = layout;
  this.stride = stride;
};


/**
 * @param {ol.TransformFunction} transformFn Transform.
 */
ol.geom.Geometry.prototype.transform = function(transformFn) {
  transformFn(this.flatCoordinates, this.flatCoordinates, this.stride);
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
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<number>} ends Ends.
 * @param {number} stride Stride.
 * @return {number} End.
 */
ol.geom.orientFlatLinearRings =
    function(flatCoordinates, offset, ends, stride) {
  var i, ii;
  for (i = 0, ii = ends.length; i < ii; ++i) {
    var end = ends[i];
    var isClockwise = ol.geom.flat.linearRingIsClockwise(
        flatCoordinates, offset, end, stride);
    var reverse = i === 0 ? !isClockwise : isClockwise;
    if (reverse) {
      ol.geom.flat.reverseCoordinates(flatCoordinates, offset, end, stride);
    }
    offset = end;
  }
  return offset;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<Array.<number>>} endss Endss.
 * @param {number} stride Stride.
 * @return {number} End.
 */
ol.geom.orientFlatLinearRingss =
    function(flatCoordinates, offset, endss, stride) {
  var i, ii;
  for (i = 0, ii = endss.length; i < ii; ++i) {
    offset = ol.geom.orientFlatLinearRings(
        flatCoordinates, offset, endss[i], stride);
  }
  return offset;
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {goog.vec.Mat4.AnyType} transform Transform.
 * @param {Array.<number>=} opt_dest Destination.
 * @return {Array.<number>} Transformed flat coordinates.
 */
ol.geom.transformGeometry2D = function(geometry, transform, opt_dest) {
  var flatCoordinates = geometry.getFlatCoordinates();
  var stride = geometry.getStride();
  return ol.geom.flat.transform2D(
      flatCoordinates, stride, transform, opt_dest);
};
