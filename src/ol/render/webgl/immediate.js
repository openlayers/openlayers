goog.provide('ol.render.webgl.Immediate');

goog.require('ol');
goog.require('ol.extent');
goog.require('ol.geom.GeometryType');
goog.require('ol.render.ReplayType');
goog.require('ol.render.VectorContext');
goog.require('ol.render.webgl.ReplayGroup');


/**
 * @constructor
 * @extends {ol.render.VectorContext}
 * @param {ol.webgl.Context} context Context.
 * @param {ol.Coordinate} center Center.
 * @param {number} resolution Resolution.
 * @param {number} rotation Rotation.
 * @param {ol.Size} size Size.
 * @param {ol.Extent} extent Extent.
 * @param {number} pixelRatio Pixel ratio.
 * @struct
 */
ol.render.webgl.Immediate = function(context, center, resolution, rotation, size, extent, pixelRatio) {
  ol.render.VectorContext.call(this);

  /**
   * @private
   */
  this.context_ = context;

  /**
   * @private
   */
  this.center_ = center;

  /**
   * @private
   */
  this.extent_ = extent;

  /**
   * @private
   */
  this.pixelRatio_ = pixelRatio;

  /**
   * @private
   */
  this.size_ = size;

  /**
   * @private
   */
  this.rotation_ = rotation;

  /**
   * @private
   */
  this.resolution_ = resolution;

  /**
   * @private
   * @type {ol.style.Image}
   */
  this.imageStyle_ = null;

};
ol.inherits(ol.render.webgl.Immediate, ol.render.VectorContext);


/**
 * Set the rendering style.  Note that since this is an immediate rendering API,
 * any `zIndex` on the provided style will be ignored.
 *
 * @param {ol.style.Style} style The rendering style.
 * @api
 */
ol.render.webgl.Immediate.prototype.setStyle = function(style) {
  this.setImageStyle(style.getImage());
};


/**
 * Render a geometry into the canvas.  Call
 * {@link ol.render.webgl.Immediate#setStyle} first to set the rendering style.
 *
 * @param {ol.geom.Geometry|ol.render.Feature} geometry The geometry to render.
 * @api
 */
ol.render.webgl.Immediate.prototype.drawGeometry = function(geometry) {
  var type = geometry.getType();
  switch (type) {
    case ol.geom.GeometryType.POINT:
      this.drawPoint(/** @type {ol.geom.Point} */ (geometry), null);
      break;
    case ol.geom.GeometryType.MULTI_POINT:
      this.drawMultiPoint(/** @type {ol.geom.MultiPoint} */ (geometry), null);
      break;
    case ol.geom.GeometryType.GEOMETRY_COLLECTION:
      this.drawGeometryCollection(/** @type {ol.geom.GeometryCollection} */ (geometry), null);
      break;
    default:
      goog.DEBUG && console.assert(false, 'Unsupported geometry type: ' + type);
  }
};


/**
 * @inheritDoc
 * @api
 */
ol.render.webgl.Immediate.prototype.drawFeature = function(feature, style) {
  var geometry = style.getGeometryFunction()(feature);
  if (!geometry ||
      !ol.extent.intersects(this.extent_, geometry.getExtent())) {
    return;
  }
  this.setStyle(style);
  goog.DEBUG && console.assert(geometry, 'geometry must be truthy');
  this.drawGeometry(geometry);
};


/**
 * @inheritDoc
 */
ol.render.webgl.Immediate.prototype.drawGeometryCollection = function(geometry, data) {
  var geometries = geometry.getGeometriesArray();
  var i, ii;
  for (i = 0, ii = geometries.length; i < ii; ++i) {
    this.drawGeometry(geometries[i]);
  }
};


/**
 * @inheritDoc
 */
ol.render.webgl.Immediate.prototype.drawPoint = function(geometry, data) {
  var context = this.context_;
  var replayGroup = new ol.render.webgl.ReplayGroup(1, this.extent_);
  var replay = /** @type {ol.render.webgl.ImageReplay} */ (
      replayGroup.getReplay(0, ol.render.ReplayType.IMAGE));
  replay.setImageStyle(this.imageStyle_);
  replay.drawPoint(geometry, data);
  replay.finish(context);
  // default colors
  var opacity = 1;
  var skippedFeatures = {};
  var featureCallback;
  var oneByOne = false;
  replay.replay(this.context_, this.center_, this.resolution_, this.rotation_,
      this.size_, this.pixelRatio_, opacity, skippedFeatures, featureCallback,
      oneByOne);
  replay.getDeleteResourcesFunction(context)();
};


/**
 * @inheritDoc
 */
ol.render.webgl.Immediate.prototype.drawMultiPoint = function(geometry, data) {
  var context = this.context_;
  var replayGroup = new ol.render.webgl.ReplayGroup(1, this.extent_);
  var replay = /** @type {ol.render.webgl.ImageReplay} */ (
      replayGroup.getReplay(0, ol.render.ReplayType.IMAGE));
  replay.setImageStyle(this.imageStyle_);
  replay.drawMultiPoint(geometry, data);
  replay.finish(context);
  var opacity = 1;
  var skippedFeatures = {};
  var featureCallback;
  var oneByOne = false;
  replay.replay(this.context_, this.center_, this.resolution_, this.rotation_,
      this.size_, this.pixelRatio_, opacity, skippedFeatures, featureCallback,
      oneByOne);
  replay.getDeleteResourcesFunction(context)();
};


/**
 * @inheritDoc
 */
ol.render.webgl.Immediate.prototype.setImageStyle = function(imageStyle) {
  this.imageStyle_ = imageStyle;
};
