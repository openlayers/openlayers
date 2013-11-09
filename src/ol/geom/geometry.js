// FIXME add MultiPoint
// FIXME add GeometryCollection

goog.provide('ol.geom.Geometry');

goog.require('goog.asserts');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('ol.extent');


/**
 * @enum {string}
 */
ol.geom.GeometryType = {
  POINT: 'Point',
  LINE_STRING: 'LineString',
  POLYGON: 'Polygon',
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
 * @return {ol.geom.GeometryType} Geometry type.
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
    stride = coordinates.length;
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
 * @param {Array.<ol.Coordinate>} coordinates Coordinates.
 * @param {number} stride Stride.
 * @return {number} offset Offset.
 */
ol.geom.deflateCoordinates =
    function(flatCoordinates, offset, coordinates, stride) {
  var i, ii;
  for (i = 0, ii = coordinates.length; i < ii; ++i) {
    var coordinate = coordinates[i];
    goog.asserts.assert(coordinate.length == stride);
    var j;
    for (j = 0; j < stride; ++j) {
      flatCoordinates[offset++] = coordinate[j];
    }
  }
  return offset;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {Array.<ol.Coordinate>=} opt_coordinates Coordinates.
 * @return {Array.<ol.Coordinate>} Coordinates.
 */
ol.geom.inflateCoordinates =
    function(flatCoordinates, offset, end, stride, opt_coordinates) {
  var coordinates = goog.isDef(opt_coordinates) ? opt_coordinates : [];
  var i = 0;
  var j;
  for (j = offset; j < end; j += stride) {
    coordinates[i++] = flatCoordinates.slice(j, j + stride);
  }
  coordinates.length = i;
  return coordinates;
};
