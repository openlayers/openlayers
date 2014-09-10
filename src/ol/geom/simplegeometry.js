goog.provide('ol.geom.SimpleGeometry');

goog.require('goog.asserts');
goog.require('goog.functions');
goog.require('goog.object');
goog.require('ol.extent');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.flat.transform');



/**
 * @classdesc
 * Abstract base class; only used for creating subclasses; do not instantiate
 * in apps, as cannot be rendered.
 *
 * @constructor
 * @extends {ol.geom.Geometry}
 * @api stable
 */
ol.geom.SimpleGeometry = function() {

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

};
goog.inherits(ol.geom.SimpleGeometry, ol.geom.Geometry);


/**
 * @param {number} stride Stride.
 * @private
 * @return {ol.geom.GeometryLayout} layout Layout.
 */
ol.geom.SimpleGeometry.getLayoutForStride_ = function(stride) {
  if (stride == 2) {
    return ol.geom.GeometryLayout.XY;
  } else if (stride == 3) {
    return ol.geom.GeometryLayout.XYZ;
  } else if (stride == 4) {
    return ol.geom.GeometryLayout.XYZM;
  } else {
    goog.asserts.fail('unsupported stride: ' + stride);
  }
};


/**
 * @param {ol.geom.GeometryLayout} layout Layout.
 * @private
 * @return {number} Stride.
 */
ol.geom.SimpleGeometry.getStrideForLayout_ = function(layout) {
  if (layout == ol.geom.GeometryLayout.XY) {
    return 2;
  } else if (layout == ol.geom.GeometryLayout.XYZ) {
    return 3;
  } else if (layout == ol.geom.GeometryLayout.XYM) {
    return 3;
  } else if (layout == ol.geom.GeometryLayout.XYZM) {
    return 4;
  } else {
    goog.asserts.fail('unsupported layout: ' + layout);
  }
};


/**
 * @inheritDoc
 */
ol.geom.SimpleGeometry.prototype.containsXY = goog.functions.FALSE;


/**
 * @inheritDoc
 * @api stable
 */
ol.geom.SimpleGeometry.prototype.getExtent = function(opt_extent) {
  if (this.extentRevision != this.getRevision()) {
    this.extent = ol.extent.createOrUpdateFromFlatCoordinates(
        this.flatCoordinates, 0, this.flatCoordinates.length, this.stride,
        this.extent);
    this.extentRevision = this.getRevision();
  }
  goog.asserts.assert(goog.isDef(this.extent));
  return ol.extent.returnOrUpdate(this.extent, opt_extent);
};


/**
 * @return {ol.Coordinate} First coordinate.
 * @api stable
 */
ol.geom.SimpleGeometry.prototype.getFirstCoordinate = function() {
  return this.flatCoordinates.slice(0, this.stride);
};


/**
 * @return {Array.<number>} Flat coordinates.
 */
ol.geom.SimpleGeometry.prototype.getFlatCoordinates = function() {
  return this.flatCoordinates;
};


/**
 * @return {ol.Coordinate} Last point.
 * @api stable
 */
ol.geom.SimpleGeometry.prototype.getLastCoordinate = function() {
  return this.flatCoordinates.slice(this.flatCoordinates.length - this.stride);
};


/**
 * @return {ol.geom.GeometryLayout} Layout.
 * @api stable
 */
ol.geom.SimpleGeometry.prototype.getLayout = function() {
  return this.layout;
};


/**
 * @inheritDoc
 */
ol.geom.SimpleGeometry.prototype.getSimplifiedGeometry =
    function(squaredTolerance) {
  if (this.simplifiedGeometryRevision != this.getRevision()) {
    goog.object.clear(this.simplifiedGeometryCache);
    this.simplifiedGeometryMaxMinSquaredTolerance = 0;
    this.simplifiedGeometryRevision = this.getRevision();
  }
  // If squaredTolerance is negative or if we know that simplification will not
  // have any effect then just return this.
  if (squaredTolerance < 0 ||
      (this.simplifiedGeometryMaxMinSquaredTolerance !== 0 &&
       squaredTolerance <= this.simplifiedGeometryMaxMinSquaredTolerance)) {
    return this;
  }
  var key = squaredTolerance.toString();
  if (this.simplifiedGeometryCache.hasOwnProperty(key)) {
    return this.simplifiedGeometryCache[key];
  } else {
    var simplifiedGeometry =
        this.getSimplifiedGeometryInternal(squaredTolerance);
    var simplifiedFlatCoordinates = simplifiedGeometry.getFlatCoordinates();
    if (simplifiedFlatCoordinates.length < this.flatCoordinates.length) {
      this.simplifiedGeometryCache[key] = simplifiedGeometry;
      return simplifiedGeometry;
    } else {
      // Simplification did not actually remove any coordinates.  We now know
      // that any calls to getSimplifiedGeometry with a squaredTolerance less
      // than or equal to the current squaredTolerance will also not have any
      // effect.  This allows us to short circuit simplification (saving CPU
      // cycles) and prevents the cache of simplified geometries from filling
      // up with useless identical copies of this geometry (saving memory).
      this.simplifiedGeometryMaxMinSquaredTolerance = squaredTolerance;
      return this;
    }
  }
};


/**
 * @param {number} squaredTolerance Squared tolerance.
 * @return {ol.geom.SimpleGeometry} Simplified geometry.
 * @protected
 */
ol.geom.SimpleGeometry.prototype.getSimplifiedGeometryInternal =
    function(squaredTolerance) {
  return this;
};


/**
 * @return {number} Stride.
 */
ol.geom.SimpleGeometry.prototype.getStride = function() {
  return this.stride;
};


/**
 * @param {ol.geom.GeometryLayout} layout Layout.
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @protected
 */
ol.geom.SimpleGeometry.prototype.setFlatCoordinatesInternal =
    function(layout, flatCoordinates) {
  this.stride = ol.geom.SimpleGeometry.getStrideForLayout_(layout);
  this.layout = layout;
  this.flatCoordinates = flatCoordinates;
};


/**
 * @param {ol.geom.GeometryLayout|undefined} layout Layout.
 * @param {Array} coordinates Coordinates.
 * @param {number} nesting Nesting.
 * @protected
 */
ol.geom.SimpleGeometry.prototype.setLayout =
    function(layout, coordinates, nesting) {
  /** @type {number} */
  var stride;
  if (goog.isDef(layout)) {
    stride = ol.geom.SimpleGeometry.getStrideForLayout_(layout);
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
    layout = ol.geom.SimpleGeometry.getLayoutForStride_(stride);
  }
  this.layout = layout;
  this.stride = stride;
};


/**
 * @inheritDoc
 */
ol.geom.SimpleGeometry.prototype.applyTransform = function(transformFn) {
  if (!goog.isNull(this.flatCoordinates)) {
    transformFn(this.flatCoordinates, this.flatCoordinates, this.stride);
    this.dispatchChangeEvent();
  }
};


/**
 * @param {ol.geom.SimpleGeometry} simpleGeometry Simple geometry.
 * @param {goog.vec.Mat4.Number} transform Transform.
 * @param {Array.<number>=} opt_dest Destination.
 * @return {Array.<number>} Transformed flat coordinates.
 */
ol.geom.transformSimpleGeometry2D =
    function(simpleGeometry, transform, opt_dest) {
  var flatCoordinates = simpleGeometry.getFlatCoordinates();
  if (goog.isNull(flatCoordinates)) {
    return null;
  } else {
    var stride = simpleGeometry.getStride();
    return ol.geom.flat.transform.transform2D(
        flatCoordinates, 0, flatCoordinates.length, stride,
        transform, opt_dest);
  }
};
