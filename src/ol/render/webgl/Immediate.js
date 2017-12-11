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

  /**
   * @private
   * @type {ol.style.Fill}
   */
  this.fillStyle_ = null;

  /**
   * @private
   * @type {ol.style.Stroke}
   */
  this.strokeStyle_ = null;

  /**
   * @private
   * @type {ol.style.Text}
   */
  this.textStyle_ = null;

};
ol.inherits(ol.render.webgl.Immediate, ol.render.VectorContext);


/**
 * @param {ol.render.webgl.ReplayGroup} replayGroup Replay group.
 * @param {ol.geom.Geometry|ol.render.Feature} geometry Geometry.
 * @private
 */
ol.render.webgl.Immediate.prototype.drawText_ = function(replayGroup, geometry) {
  var context = this.context_;
  var replay = /** @type {ol.render.webgl.TextReplay} */ (
    replayGroup.getReplay(0, ol.render.ReplayType.TEXT));
  replay.setTextStyle(this.textStyle_);
  replay.drawText(geometry, null);
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
 * Set the rendering style.  Note that since this is an immediate rendering API,
 * any `zIndex` on the provided style will be ignored.
 *
 * @param {ol.style.Style} style The rendering style.
 * @override
 * @api
 */
ol.render.webgl.Immediate.prototype.setStyle = function(style) {
  this.setFillStrokeStyle(style.getFill(), style.getStroke());
  this.setImageStyle(style.getImage());
  this.setTextStyle(style.getText());
};


/**
 * Render a geometry into the canvas.  Call
 * {@link ol.render.webgl.Immediate#setStyle} first to set the rendering style.
 *
 * @param {ol.geom.Geometry|ol.render.Feature} geometry The geometry to render.
 * @override
 * @api
 */
ol.render.webgl.Immediate.prototype.drawGeometry = function(geometry) {
  var type = geometry.getType();
  switch (type) {
    case ol.geom.GeometryType.POINT:
      this.drawPoint(/** @type {ol.geom.Point} */ (geometry), null);
      break;
    case ol.geom.GeometryType.LINE_STRING:
      this.drawLineString(/** @type {ol.geom.LineString} */ (geometry), null);
      break;
    case ol.geom.GeometryType.POLYGON:
      this.drawPolygon(/** @type {ol.geom.Polygon} */ (geometry), null);
      break;
    case ol.geom.GeometryType.MULTI_POINT:
      this.drawMultiPoint(/** @type {ol.geom.MultiPoint} */ (geometry), null);
      break;
    case ol.geom.GeometryType.MULTI_LINE_STRING:
      this.drawMultiLineString(/** @type {ol.geom.MultiLineString} */ (geometry), null);
      break;
    case ol.geom.GeometryType.MULTI_POLYGON:
      this.drawMultiPolygon(/** @type {ol.geom.MultiPolygon} */ (geometry), null);
      break;
    case ol.geom.GeometryType.GEOMETRY_COLLECTION:
      this.drawGeometryCollection(/** @type {ol.geom.GeometryCollection} */ (geometry), null);
      break;
    case ol.geom.GeometryType.CIRCLE:
      this.drawCircle(/** @type {ol.geom.Circle} */ (geometry), null);
      break;
    default:
      // pass
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

  if (this.textStyle_) {
    this.drawText_(replayGroup, geometry);
  }
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

  if (this.textStyle_) {
    this.drawText_(replayGroup, geometry);
  }
};


/**
 * @inheritDoc
 */
ol.render.webgl.Immediate.prototype.drawLineString = function(geometry, data) {
  var context = this.context_;
  var replayGroup = new ol.render.webgl.ReplayGroup(1, this.extent_);
  var replay = /** @type {ol.render.webgl.LineStringReplay} */ (
    replayGroup.getReplay(0, ol.render.ReplayType.LINE_STRING));
  replay.setFillStrokeStyle(null, this.strokeStyle_);
  replay.drawLineString(geometry, data);
  replay.finish(context);
  var opacity = 1;
  var skippedFeatures = {};
  var featureCallback;
  var oneByOne = false;
  replay.replay(this.context_, this.center_, this.resolution_, this.rotation_,
      this.size_, this.pixelRatio_, opacity, skippedFeatures, featureCallback,
      oneByOne);
  replay.getDeleteResourcesFunction(context)();

  if (this.textStyle_) {
    this.drawText_(replayGroup, geometry);
  }
};


/**
 * @inheritDoc
 */
ol.render.webgl.Immediate.prototype.drawMultiLineString = function(geometry, data) {
  var context = this.context_;
  var replayGroup = new ol.render.webgl.ReplayGroup(1, this.extent_);
  var replay = /** @type {ol.render.webgl.LineStringReplay} */ (
    replayGroup.getReplay(0, ol.render.ReplayType.LINE_STRING));
  replay.setFillStrokeStyle(null, this.strokeStyle_);
  replay.drawMultiLineString(geometry, data);
  replay.finish(context);
  var opacity = 1;
  var skippedFeatures = {};
  var featureCallback;
  var oneByOne = false;
  replay.replay(this.context_, this.center_, this.resolution_, this.rotation_,
      this.size_, this.pixelRatio_, opacity, skippedFeatures, featureCallback,
      oneByOne);
  replay.getDeleteResourcesFunction(context)();

  if (this.textStyle_) {
    this.drawText_(replayGroup, geometry);
  }
};


/**
 * @inheritDoc
 */
ol.render.webgl.Immediate.prototype.drawPolygon = function(geometry, data) {
  var context = this.context_;
  var replayGroup = new ol.render.webgl.ReplayGroup(1, this.extent_);
  var replay = /** @type {ol.render.webgl.PolygonReplay} */ (
    replayGroup.getReplay(0, ol.render.ReplayType.POLYGON));
  replay.setFillStrokeStyle(this.fillStyle_, this.strokeStyle_);
  replay.drawPolygon(geometry, data);
  replay.finish(context);
  var opacity = 1;
  var skippedFeatures = {};
  var featureCallback;
  var oneByOne = false;
  replay.replay(this.context_, this.center_, this.resolution_, this.rotation_,
      this.size_, this.pixelRatio_, opacity, skippedFeatures, featureCallback,
      oneByOne);
  replay.getDeleteResourcesFunction(context)();

  if (this.textStyle_) {
    this.drawText_(replayGroup, geometry);
  }
};


/**
 * @inheritDoc
 */
ol.render.webgl.Immediate.prototype.drawMultiPolygon = function(geometry, data) {
  var context = this.context_;
  var replayGroup = new ol.render.webgl.ReplayGroup(1, this.extent_);
  var replay = /** @type {ol.render.webgl.PolygonReplay} */ (
    replayGroup.getReplay(0, ol.render.ReplayType.POLYGON));
  replay.setFillStrokeStyle(this.fillStyle_, this.strokeStyle_);
  replay.drawMultiPolygon(geometry, data);
  replay.finish(context);
  var opacity = 1;
  var skippedFeatures = {};
  var featureCallback;
  var oneByOne = false;
  replay.replay(this.context_, this.center_, this.resolution_, this.rotation_,
      this.size_, this.pixelRatio_, opacity, skippedFeatures, featureCallback,
      oneByOne);
  replay.getDeleteResourcesFunction(context)();

  if (this.textStyle_) {
    this.drawText_(replayGroup, geometry);
  }
};


/**
 * @inheritDoc
 */
ol.render.webgl.Immediate.prototype.drawCircle = function(geometry, data) {
  var context = this.context_;
  var replayGroup = new ol.render.webgl.ReplayGroup(1, this.extent_);
  var replay = /** @type {ol.render.webgl.CircleReplay} */ (
    replayGroup.getReplay(0, ol.render.ReplayType.CIRCLE));
  replay.setFillStrokeStyle(this.fillStyle_, this.strokeStyle_);
  replay.drawCircle(geometry, data);
  replay.finish(context);
  var opacity = 1;
  var skippedFeatures = {};
  var featureCallback;
  var oneByOne = false;
  replay.replay(this.context_, this.center_, this.resolution_, this.rotation_,
      this.size_, this.pixelRatio_, opacity, skippedFeatures, featureCallback,
      oneByOne);
  replay.getDeleteResourcesFunction(context)();

  if (this.textStyle_) {
    this.drawText_(replayGroup, geometry);
  }
};


/**
 * @inheritDoc
 */
ol.render.webgl.Immediate.prototype.setImageStyle = function(imageStyle) {
  this.imageStyle_ = imageStyle;
};


/**
 * @inheritDoc
 */
ol.render.webgl.Immediate.prototype.setFillStrokeStyle = function(fillStyle, strokeStyle) {
  this.fillStyle_ = fillStyle;
  this.strokeStyle_ = strokeStyle;
};


/**
 * @inheritDoc
 */
ol.render.webgl.Immediate.prototype.setTextStyle = function(textStyle) {
  this.textStyle_ = textStyle;
};
