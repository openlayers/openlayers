/**
 * @module ol/render/webgl/Immediate
 */
import {inherits} from '../../index.js';
import {intersects} from '../../extent.js';
import GeometryType from '../../geom/GeometryType.js';
import ReplayType from '../ReplayType.js';
import VectorContext from '../VectorContext.js';
import WebGLReplayGroup from '../webgl/ReplayGroup.js';

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
const _ol_render_webgl_Immediate_ = function(context, center, resolution, rotation, size, extent, pixelRatio) {
  VectorContext.call(this);

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

inherits(_ol_render_webgl_Immediate_, VectorContext);


/**
 * @param {ol.render.webgl.ReplayGroup} replayGroup Replay group.
 * @param {ol.geom.Geometry|ol.render.Feature} geometry Geometry.
 * @private
 */
_ol_render_webgl_Immediate_.prototype.drawText_ = function(replayGroup, geometry) {
  const context = this.context_;
  const replay = /** @type {ol.render.webgl.TextReplay} */ (
    replayGroup.getReplay(0, ReplayType.TEXT));
  replay.setTextStyle(this.textStyle_);
  replay.drawText(geometry, null);
  replay.finish(context);
  // default colors
  const opacity = 1;
  const skippedFeatures = {};
  let featureCallback;
  const oneByOne = false;
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
_ol_render_webgl_Immediate_.prototype.setStyle = function(style) {
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
_ol_render_webgl_Immediate_.prototype.drawGeometry = function(geometry) {
  const type = geometry.getType();
  switch (type) {
    case GeometryType.POINT:
      this.drawPoint(/** @type {ol.geom.Point} */ (geometry), null);
      break;
    case GeometryType.LINE_STRING:
      this.drawLineString(/** @type {ol.geom.LineString} */ (geometry), null);
      break;
    case GeometryType.POLYGON:
      this.drawPolygon(/** @type {ol.geom.Polygon} */ (geometry), null);
      break;
    case GeometryType.MULTI_POINT:
      this.drawMultiPoint(/** @type {ol.geom.MultiPoint} */ (geometry), null);
      break;
    case GeometryType.MULTI_LINE_STRING:
      this.drawMultiLineString(/** @type {ol.geom.MultiLineString} */ (geometry), null);
      break;
    case GeometryType.MULTI_POLYGON:
      this.drawMultiPolygon(/** @type {ol.geom.MultiPolygon} */ (geometry), null);
      break;
    case GeometryType.GEOMETRY_COLLECTION:
      this.drawGeometryCollection(/** @type {ol.geom.GeometryCollection} */ (geometry), null);
      break;
    case GeometryType.CIRCLE:
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
_ol_render_webgl_Immediate_.prototype.drawFeature = function(feature, style) {
  const geometry = style.getGeometryFunction()(feature);
  if (!geometry || !intersects(this.extent_, geometry.getExtent())) {
    return;
  }
  this.setStyle(style);
  this.drawGeometry(geometry);
};


/**
 * @inheritDoc
 */
_ol_render_webgl_Immediate_.prototype.drawGeometryCollection = function(geometry, data) {
  const geometries = geometry.getGeometriesArray();
  let i, ii;
  for (i = 0, ii = geometries.length; i < ii; ++i) {
    this.drawGeometry(geometries[i]);
  }
};


/**
 * @inheritDoc
 */
_ol_render_webgl_Immediate_.prototype.drawPoint = function(geometry, data) {
  const context = this.context_;
  const replayGroup = new WebGLReplayGroup(1, this.extent_);
  const replay = /** @type {ol.render.webgl.ImageReplay} */ (
    replayGroup.getReplay(0, ReplayType.IMAGE));
  replay.setImageStyle(this.imageStyle_);
  replay.drawPoint(geometry, data);
  replay.finish(context);
  // default colors
  const opacity = 1;
  const skippedFeatures = {};
  let featureCallback;
  const oneByOne = false;
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
_ol_render_webgl_Immediate_.prototype.drawMultiPoint = function(geometry, data) {
  const context = this.context_;
  const replayGroup = new WebGLReplayGroup(1, this.extent_);
  const replay = /** @type {ol.render.webgl.ImageReplay} */ (
    replayGroup.getReplay(0, ReplayType.IMAGE));
  replay.setImageStyle(this.imageStyle_);
  replay.drawMultiPoint(geometry, data);
  replay.finish(context);
  const opacity = 1;
  const skippedFeatures = {};
  let featureCallback;
  const oneByOne = false;
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
_ol_render_webgl_Immediate_.prototype.drawLineString = function(geometry, data) {
  const context = this.context_;
  const replayGroup = new WebGLReplayGroup(1, this.extent_);
  const replay = /** @type {ol.render.webgl.LineStringReplay} */ (
    replayGroup.getReplay(0, ReplayType.LINE_STRING));
  replay.setFillStrokeStyle(null, this.strokeStyle_);
  replay.drawLineString(geometry, data);
  replay.finish(context);
  const opacity = 1;
  const skippedFeatures = {};
  let featureCallback;
  const oneByOne = false;
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
_ol_render_webgl_Immediate_.prototype.drawMultiLineString = function(geometry, data) {
  const context = this.context_;
  const replayGroup = new WebGLReplayGroup(1, this.extent_);
  const replay = /** @type {ol.render.webgl.LineStringReplay} */ (
    replayGroup.getReplay(0, ReplayType.LINE_STRING));
  replay.setFillStrokeStyle(null, this.strokeStyle_);
  replay.drawMultiLineString(geometry, data);
  replay.finish(context);
  const opacity = 1;
  const skippedFeatures = {};
  let featureCallback;
  const oneByOne = false;
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
_ol_render_webgl_Immediate_.prototype.drawPolygon = function(geometry, data) {
  const context = this.context_;
  const replayGroup = new WebGLReplayGroup(1, this.extent_);
  const replay = /** @type {ol.render.webgl.PolygonReplay} */ (
    replayGroup.getReplay(0, ReplayType.POLYGON));
  replay.setFillStrokeStyle(this.fillStyle_, this.strokeStyle_);
  replay.drawPolygon(geometry, data);
  replay.finish(context);
  const opacity = 1;
  const skippedFeatures = {};
  let featureCallback;
  const oneByOne = false;
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
_ol_render_webgl_Immediate_.prototype.drawMultiPolygon = function(geometry, data) {
  const context = this.context_;
  const replayGroup = new WebGLReplayGroup(1, this.extent_);
  const replay = /** @type {ol.render.webgl.PolygonReplay} */ (
    replayGroup.getReplay(0, ReplayType.POLYGON));
  replay.setFillStrokeStyle(this.fillStyle_, this.strokeStyle_);
  replay.drawMultiPolygon(geometry, data);
  replay.finish(context);
  const opacity = 1;
  const skippedFeatures = {};
  let featureCallback;
  const oneByOne = false;
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
_ol_render_webgl_Immediate_.prototype.drawCircle = function(geometry, data) {
  const context = this.context_;
  const replayGroup = new WebGLReplayGroup(1, this.extent_);
  const replay = /** @type {ol.render.webgl.CircleReplay} */ (
    replayGroup.getReplay(0, ReplayType.CIRCLE));
  replay.setFillStrokeStyle(this.fillStyle_, this.strokeStyle_);
  replay.drawCircle(geometry, data);
  replay.finish(context);
  const opacity = 1;
  const skippedFeatures = {};
  let featureCallback;
  const oneByOne = false;
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
_ol_render_webgl_Immediate_.prototype.setImageStyle = function(imageStyle) {
  this.imageStyle_ = imageStyle;
};


/**
 * @inheritDoc
 */
_ol_render_webgl_Immediate_.prototype.setFillStrokeStyle = function(fillStyle, strokeStyle) {
  this.fillStyle_ = fillStyle;
  this.strokeStyle_ = strokeStyle;
};


/**
 * @inheritDoc
 */
_ol_render_webgl_Immediate_.prototype.setTextStyle = function(textStyle) {
  this.textStyle_ = textStyle;
};
export default _ol_render_webgl_Immediate_;
