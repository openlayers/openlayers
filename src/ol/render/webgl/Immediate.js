/**
 * @module ol/render/webgl/Immediate
 */
import {inherits} from '../../util.js';
import {intersects} from '../../extent.js';
import GeometryType from '../../geom/GeometryType.js';
import ReplayType from '../ReplayType.js';
import VectorContext from '../VectorContext.js';
import WebGLReplayGroup from '../webgl/ReplayGroup.js';

/**
 * @constructor
 * @extends {module:ol/render/VectorContext}
 * @param {module:ol/webgl/Context} context Context.
 * @param {module:ol/coordinate~Coordinate} center Center.
 * @param {number} resolution Resolution.
 * @param {number} rotation Rotation.
 * @param {module:ol/size~Size} size Size.
 * @param {module:ol/extent~Extent} extent Extent.
 * @param {number} pixelRatio Pixel ratio.
 * @struct
 */
const WebGLImmediateRenderer = function(context, center, resolution, rotation, size, extent, pixelRatio) {
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
   * @type {module:ol/style/Image}
   */
  this.imageStyle_ = null;

  /**
   * @private
   * @type {module:ol/style/Fill}
   */
  this.fillStyle_ = null;

  /**
   * @private
   * @type {module:ol/style/Stroke}
   */
  this.strokeStyle_ = null;

  /**
   * @private
   * @type {module:ol/style/Text}
   */
  this.textStyle_ = null;

};

inherits(WebGLImmediateRenderer, VectorContext);


/**
 * @param {module:ol/render/webgl/ReplayGroup} replayGroup Replay group.
 * @param {module:ol/geom/Geometry|module:ol/render/Feature} geometry Geometry.
 * @private
 */
WebGLImmediateRenderer.prototype.drawText_ = function(replayGroup, geometry) {
  const context = this.context_;
  const replay = /** @type {module:ol/render/webgl/TextReplay} */ (
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
 * @param {module:ol/style/Style} style The rendering style.
 * @override
 * @api
 */
WebGLImmediateRenderer.prototype.setStyle = function(style) {
  this.setFillStrokeStyle(style.getFill(), style.getStroke());
  this.setImageStyle(style.getImage());
  this.setTextStyle(style.getText());
};


/**
 * Render a geometry into the canvas.  Call
 * {@link ol/render/webgl/Immediate#setStyle} first to set the rendering style.
 *
 * @param {module:ol/geom/Geometry|module:ol/render/Feature} geometry The geometry to render.
 * @override
 * @api
 */
WebGLImmediateRenderer.prototype.drawGeometry = function(geometry) {
  const type = geometry.getType();
  switch (type) {
    case GeometryType.POINT:
      this.drawPoint(/** @type {module:ol/geom/Point} */ (geometry), null);
      break;
    case GeometryType.LINE_STRING:
      this.drawLineString(/** @type {module:ol/geom/LineString} */ (geometry), null);
      break;
    case GeometryType.POLYGON:
      this.drawPolygon(/** @type {module:ol/geom/Polygon} */ (geometry), null);
      break;
    case GeometryType.MULTI_POINT:
      this.drawMultiPoint(/** @type {module:ol/geom/MultiPoint} */ (geometry), null);
      break;
    case GeometryType.MULTI_LINE_STRING:
      this.drawMultiLineString(/** @type {module:ol/geom/MultiLineString} */ (geometry), null);
      break;
    case GeometryType.MULTI_POLYGON:
      this.drawMultiPolygon(/** @type {module:ol/geom/MultiPolygon} */ (geometry), null);
      break;
    case GeometryType.GEOMETRY_COLLECTION:
      this.drawGeometryCollection(/** @type {module:ol/geom/GeometryCollection} */ (geometry), null);
      break;
    case GeometryType.CIRCLE:
      this.drawCircle(/** @type {module:ol/geom/Circle} */ (geometry), null);
      break;
    default:
      // pass
  }
};


/**
 * @inheritDoc
 * @api
 */
WebGLImmediateRenderer.prototype.drawFeature = function(feature, style) {
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
WebGLImmediateRenderer.prototype.drawGeometryCollection = function(geometry, data) {
  const geometries = geometry.getGeometriesArray();
  let i, ii;
  for (i = 0, ii = geometries.length; i < ii; ++i) {
    this.drawGeometry(geometries[i]);
  }
};


/**
 * @inheritDoc
 */
WebGLImmediateRenderer.prototype.drawPoint = function(geometry, data) {
  const context = this.context_;
  const replayGroup = new WebGLReplayGroup(1, this.extent_);
  const replay = /** @type {module:ol/render/webgl/ImageReplay} */ (
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
WebGLImmediateRenderer.prototype.drawMultiPoint = function(geometry, data) {
  const context = this.context_;
  const replayGroup = new WebGLReplayGroup(1, this.extent_);
  const replay = /** @type {module:ol/render/webgl/ImageReplay} */ (
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
WebGLImmediateRenderer.prototype.drawLineString = function(geometry, data) {
  const context = this.context_;
  const replayGroup = new WebGLReplayGroup(1, this.extent_);
  const replay = /** @type {module:ol/render/webgl/LineStringReplay} */ (
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
WebGLImmediateRenderer.prototype.drawMultiLineString = function(geometry, data) {
  const context = this.context_;
  const replayGroup = new WebGLReplayGroup(1, this.extent_);
  const replay = /** @type {module:ol/render/webgl/LineStringReplay} */ (
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
WebGLImmediateRenderer.prototype.drawPolygon = function(geometry, data) {
  const context = this.context_;
  const replayGroup = new WebGLReplayGroup(1, this.extent_);
  const replay = /** @type {module:ol/render/webgl/PolygonReplay} */ (
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
WebGLImmediateRenderer.prototype.drawMultiPolygon = function(geometry, data) {
  const context = this.context_;
  const replayGroup = new WebGLReplayGroup(1, this.extent_);
  const replay = /** @type {module:ol/render/webgl/PolygonReplay} */ (
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
WebGLImmediateRenderer.prototype.drawCircle = function(geometry, data) {
  const context = this.context_;
  const replayGroup = new WebGLReplayGroup(1, this.extent_);
  const replay = /** @type {module:ol/render/webgl/CircleReplay} */ (
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
WebGLImmediateRenderer.prototype.setImageStyle = function(imageStyle) {
  this.imageStyle_ = imageStyle;
};


/**
 * @inheritDoc
 */
WebGLImmediateRenderer.prototype.setFillStrokeStyle = function(fillStyle, strokeStyle) {
  this.fillStyle_ = fillStyle;
  this.strokeStyle_ = strokeStyle;
};


/**
 * @inheritDoc
 */
WebGLImmediateRenderer.prototype.setTextStyle = function(textStyle) {
  this.textStyle_ = textStyle;
};
export default WebGLImmediateRenderer;
