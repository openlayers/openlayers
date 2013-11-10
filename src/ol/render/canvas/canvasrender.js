// FIXME test, especially polygons with holes and multipolygons

goog.provide('ol.render.canvas.Render');

goog.require('goog.asserts');
goog.require('ol.render');
goog.require('ol.render.IRender');
goog.require('ol.style.fill');
goog.require('ol.style.stroke');



/**
 * @constructor
 * @implements {ol.render.IRender}
 * @param {CanvasRenderingContext2D} context Context.
 * @param {goog.vec.Mat4.AnyType} transform Transform.
 */
ol.render.canvas.Render = function(context, transform) {

  /**
   * @private
   * @type {CanvasRenderingContext2D}
   */
  this.context_ = context;

  /**
   * @private
   * @type {goog.vec.Mat4.AnyType}
   */
  this.transform_ = transform;

  /**
   * @private
   * @type {{fillStyle: ?ol.style.Fill,
   *         imageStyle: ?ol.style.Image,
   *         strokeStyle: ?ol.style.Stroke}}
   */
  this.state_ = {
    fillStyle: null,
    imageStyle: null,
    strokeStyle: null
  };

  /**
   * @private
   * @type {Array.<number>}
   */
  this.pixelCoordinates_ = [];

};


/**
 * @param {ol.geom.Point|ol.geom.MultiPoint} geometry Geometry.
 * @private
 */
ol.render.canvas.Render.prototype.drawImages_ = function(geometry) {
  var context = this.context_;
  var imageStyle = this.state_.imageStyle;
  if (goog.isNull(imageStyle)) {
    return;
  }
  var pixelCoordinates = ol.render.transformGeometry(
      geometry, this.transform_, this.pixelCoordinates_);
  var i, ii;
  for (i = 0, ii = pixelCoordinates.length; i < ii; i += 2) {
    var x = pixelCoordinates[i] - imageStyle.anchor[0];
    var y = pixelCoordinates[i + 1] - imageStyle.anchor[1];
    if (imageStyle.snapToPixel) {
      x = (x + 0.5) | 0;
      y = (y + 0.5) | 0;
    }
    context.drawImage(imageStyle.image, x, y);
  }
};


/**
 * @param {Array.<number>} pixelCoordinates Pixel coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {boolean} close Close.
 * @private
 * @return {number} end End.
 */
ol.render.canvas.Render.prototype.moveToLineTo_ =
    function(pixelCoordinates, offset, end, close) {
  var context = this.context_;
  context.moveTo(pixelCoordinates[offset], pixelCoordinates[offset + 1]);
  var i;
  for (i = offset + 2; i < end; i += 2) {
    context.lineTo(pixelCoordinates[i], pixelCoordinates[i + 1]);
  }
  if (close) {
    context.lineTo(pixelCoordinates[offset], pixelCoordinates[offset + 1]);
  }
  return end;
};


/**
 * @param {Array.<number>} pixelCoordinates Pixel coordinates.
 * @param {number} offset Offset.
 * @param {Array.<number>} ends Ends.
 * @private
 * @return {number} End.
 */
ol.render.canvas.Render.prototype.drawRings_ =
    function(pixelCoordinates, offset, ends) {
  var context = this.context_;
  var i, ii;
  for (i = 0, ii = ends.length; i < ii; ++i) {
    offset = this.moveToLineTo_(pixelCoordinates, offset, ends[i], true);
    context.closePath(); // FIXME is this needed here?
  }
  return offset;
};


/**
 * @inheritDoc
 */
ol.render.canvas.Render.prototype.drawFeature = function(feature, style) {
  this.setFillStrokeStyle(style.fill, style.stroke);
  this.setImageStyle(style.image);
  var geometry = feature.getGeometry();
  var renderGeometry =
      ol.render.canvas.Render.GEOMETRY_RENDERES_[geometry.getType()];
  goog.asserts.assert(goog.isDef(renderGeometry));
  renderGeometry.call(this, geometry);
};


/**
 * @inheritDoc
 */
ol.render.canvas.Render.prototype.drawPointGeometry =
    ol.render.canvas.Render.prototype.drawImages_;


/**
 * @inheritDoc
 */
ol.render.canvas.Render.prototype.drawMultiPointGeometry =
    ol.render.canvas.Render.prototype.drawImages_;


/**
 * @inheritDoc
 */
ol.render.canvas.Render.prototype.drawLineStringGeometry =
    function(lineStringGeometry) {
  if (goog.isNull(this.state_.strokeStyle)) {
    return;
  }
  var context = this.context_;
  var pixelCoordinates = ol.render.transformGeometry(
      lineStringGeometry, this.transform_, this.pixelCoordinates_);
  context.beginPath();
  this.moveToLineTo_(pixelCoordinates, 0, pixelCoordinates.length, false);
  context.stroke();
};


/**
 * @inheritDoc
 */
ol.render.canvas.Render.prototype.drawMultiLineStringGeometry =
    function(multiLineStringGeometry) {
  if (goog.isNull(this.state_.strokeStyle)) {
    return;
  }
  var context = this.context_;
  var pixelCoordinates = ol.render.transformGeometry(
      multiLineStringGeometry, this.transform_, this.pixelCoordinates_);
  context.beginPath();
  var ends = multiLineStringGeometry.getEnds();
  var offset = 0;
  var i, ii;
  for (i = 0, ii = ends.length; i < ii; ++i) {
    offset = this.moveToLineTo_(pixelCoordinates, offset, ends[i], false);
  }
  context.stroke();
};


/**
 * @inheritDoc
 */
ol.render.canvas.Render.prototype.drawPolygonGeometry =
    function(polygonGeometry) {
  var state = this.state_;
  if (goog.isNull(this.fillStyle) && goog.isNull(this.strokeStyle)) {
    return;
  }
  var context = this.context_;
  var pixelCoordinates = ol.render.transformGeometry(
      polygonGeometry, this.transform_, this.pixelCoordinates_);
  var ends = polygonGeometry.getEnds();
  context.beginPath();
  this.drawRings_(pixelCoordinates, 0, ends);
  if (!goog.isNull(state.fillStyle)) {
    context.fill();
  }
  if (!goog.isNull(state.strokeStyle)) {
    context.stroke();
  }
};


/**
 * @inheritDoc
 */
ol.render.canvas.Render.prototype.drawMultiPolygonGeometry =
    function(multiPolygonGeometry) {
  var state = this.state_;
  if (goog.isNull(this.fillStyle) && goog.isNull(this.strokeStyle)) {
    return;
  }
  var context = this.context_;
  var pixelCoordinates = ol.render.transformGeometry(
      multiPolygonGeometry, this.transform_, this.pixelCoordinates_);
  var endss = multiPolygonGeometry.getEndss();
  var offset = 0;
  var i, ii;
  for (i = 0, ii = endss.length; i < ii; ++i) {
    var ends = endss[i];
    context.beginPath();
    offset = this.drawRings_(pixelCoordinates, offset, ends);
    if (!goog.isNull(state.fillStyle)) {
      context.fill();
    }
    if (!goog.isNull(state.strokeStyle)) {
      context.stroke();
    }
  }
};


/**
 * @inheritDoc
 */
ol.render.canvas.Render.prototype.setFillStrokeStyle =
    function(fillStyle, strokeStyle) {
  var context = this.context_;
  var state = this.state_;
  if (!ol.style.fill.equals(state.fillStyle, fillStyle)) {
    context.fillStyle = fillStyle.color;
    state.fillStyle = fillStyle;
  }
  if (!ol.style.stroke.equals(state.strokeStyle, strokeStyle)) {
    context.strokeStyle = strokeStyle.color;
    context.lineWidth = strokeStyle.width;
    state.strokeStyle = strokeStyle;
  }
};


/**
 * @inheritDoc
 */
ol.render.canvas.Render.prototype.setImageStyle = function(imageStyle) {
  this.state_.imageStyle = imageStyle;
};


/**
 * @const
 * @private
 * @type {Object.<ol.geom.GeometryType,
 *                function(this: ol.render.canvas.Render, ol.geom.Geometry)>}
 */
ol.render.canvas.Render.GEOMETRY_RENDERES_ = {
  'Point': ol.render.canvas.Render.prototype.drawPointGeometry,
  'LineString': ol.render.canvas.Render.prototype.drawLineStringGeometry,
  'Polygon': ol.render.canvas.Render.prototype.drawPolygonGeometry,
  'MultiPoint': ol.render.canvas.Render.prototype.drawMultiPointGeometry,
  'MultiLineString':
      ol.render.canvas.Render.prototype.drawMultiLineStringGeometry,
  'MultiPolygon': ol.render.canvas.Render.prototype.drawMultiPolygonGeometry
};
