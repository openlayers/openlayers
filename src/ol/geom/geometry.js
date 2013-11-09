// FIXME add MultiPoint
// FIXME add GeometryCollection
// FIXME add Z and M support
// FIXME use flat coordinate arrays

goog.provide('ol.geom.Geometry');

goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');


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
ol.geom.GeometryLayout = {
  XY: 'XY',
  XYZ: 'XYZ',
  XYM: 'XYM',
  XYZM: 'XYZM'
};



/**
 * @constructor
 * @extends {goog.events.EventTarget}
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 */
ol.geom.Geometry = function(opt_layout) {

  goog.base(this);

  /**
   * @protected
   * @type {ol.geom.GeometryLayout}
   */
  this.layout = goog.isDef(opt_layout) ? opt_layout : ol.geom.GeometryLayout.XY;

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
ol.geom.Geometry.prototype.getExtent = goog.abstractMethod;


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
 * @return {number} Stride.
 */
ol.geom.Geometry.prototype.getStride = function() {
  return this.layout.length;
};


/**
 * @return {ol.geom.GeometryType} Geometry type.
 */
ol.geom.Geometry.prototype.getType = goog.abstractMethod;


/**
 * @param {ol.TransformFunction} transformFn Transform.
 */
ol.geom.Geometry.prototype.transform = goog.abstractMethod;
