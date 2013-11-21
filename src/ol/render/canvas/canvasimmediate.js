// FIXME test, especially polygons with holes and multipolygons
// FIXME need to handle large thick features (where pixel size matters)

goog.provide('ol.render.canvas.Immediate');

goog.require('goog.asserts');
goog.require('ol.color');
goog.require('ol.extent');
goog.require('ol.render.IRender');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Text');



/**
 * @constructor
 * @implements {ol.render.IRender}
 * @param {CanvasRenderingContext2D} context Context.
 * @param {ol.Extent} extent Extent.
 * @param {goog.vec.Mat4.AnyType} transform Transform.
 */
ol.render.canvas.Immediate = function(context, extent, transform) {

  /**
   * @private
   * @type {CanvasRenderingContext2D}
   */
  this.context_ = context;

  /**
   * @private
   * @type {ol.Extent}
   */
  this.extent_ = extent;

  /**
   * @private
   * @type {goog.vec.Mat4.AnyType}
   */
  this.transform_ = transform;

  /**
   * @private
   * @type {{fillStyle: ol.style.Fill,
   *         imageStyle: ol.style.Image,
   *         strokeStyle: ol.style.Stroke,
   *         textStyle: ol.style.Text}}
   */
  this.state_ = {
    fillStyle: null,
    imageStyle: null,
    strokeStyle: null,
    textStyle: null
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
ol.render.canvas.Immediate.prototype.drawImages_ = function(geometry) {
  var context = this.context_;
  var imageStyle = this.state_.imageStyle;
  if (!ol.extent.intersects(this.extent_, geometry.getExtent()) ||
      !goog.isDefAndNotNull(imageStyle)) {
    return;
  }
  var pixelCoordinates = ol.geom.transformGeometry2D(
      geometry, this.transform_, this.pixelCoordinates_);
  var i, ii;
  for (i = 0, ii = pixelCoordinates.length; i < ii; i += 2) {
    var x = pixelCoordinates[i] - imageStyle.anchor[0];
    var y = pixelCoordinates[i + 1] - imageStyle.anchor[1];
    if (imageStyle.snapToPixel) {
      x = (x + 0.5) | 0;
      y = (y + 0.5) | 0;
    }
    context.drawImage(imageStyle.image, x, y,
        imageStyle.size[0], imageStyle.size[1]);
  }
};


/**
 * @param {ol.geom.Point|ol.geom.MultiPoint} geometry Geometry.
 * @private
 */
ol.render.canvas.Immediate.prototype.drawText_ = function(geometry) {
  var context = this.context_;
  var state = this.state_;
  var fillStyle = state.fillStyle;
  var strokeStyle = state.strokeStyle;
  var textStyle = state.textStyle;
  if (!ol.extent.intersects(this.extent_, geometry.getExtent()) ||
      !goog.isDefAndNotNull(textStyle) || !goog.isDef(textStyle.text) ||
      (!goog.isDefAndNotNull(fillStyle) &&
       !goog.isDefAndNotNull(strokeStyle))) {
    return;
  }
  var pixelCoordinates = ol.geom.transformGeometry2D(
      geometry, this.transform_, this.pixelCoordinates_);
  var i, ii;
  for (i = 0, ii = pixelCoordinates.length; i < ii; i += 2) {
    var x = pixelCoordinates[i];
    var y = pixelCoordinates[i + 1];
    // FIXME stroke before fill or fill before stroke?
    if (goog.isDefAndNotNull(strokeStyle)) {
      context.strokeText(textStyle.text, x, y);
    }
    if (goog.isDefAndNotNull(fillStyle)) {
      context.fillText(textStyle.text, x, y);
    }
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
ol.render.canvas.Immediate.prototype.moveToLineTo_ =
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
ol.render.canvas.Immediate.prototype.drawRings_ =
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
ol.render.canvas.Immediate.prototype.drawFeature = function(feature, style) {
  var geometry = feature.getGeometry();
  if (!ol.extent.intersects(this.extent_, geometry.getExtent())) {
    return;
  }
  this.setFillStrokeStyle(style.fill, style.stroke);
  this.setImageStyle(style.image);
  var renderGeometry =
      ol.render.canvas.Immediate.GEOMETRY_RENDERES_[geometry.getType()];
  goog.asserts.assert(goog.isDef(renderGeometry));
  renderGeometry.call(this, geometry);
};


/**
 * @inheritDoc
 */
ol.render.canvas.Immediate.prototype.drawPointGeometry =
    function(pointGeometry) {
  this.drawImages_(pointGeometry);
  this.drawText_(pointGeometry);
};


/**
 * @inheritDoc
 */
ol.render.canvas.Immediate.prototype.drawMultiPointGeometry =
    function(multiPointGeometry) {
  this.drawImages_(multiPointGeometry);
  this.drawText_(multiPointGeometry);
};


/**
 * @inheritDoc
 */
ol.render.canvas.Immediate.prototype.drawLineStringGeometry =
    function(lineStringGeometry) {
  if (!ol.extent.intersects(this.extent_, lineStringGeometry.getExtent()) ||
      !goog.isDefAndNotNull(this.state_.strokeStyle)) {
    return;
  }
  var context = this.context_;
  var pixelCoordinates = ol.geom.transformGeometry2D(
      lineStringGeometry, this.transform_, this.pixelCoordinates_);
  context.beginPath();
  this.moveToLineTo_(pixelCoordinates, 0, pixelCoordinates.length, false);
  context.stroke();
};


/**
 * @inheritDoc
 */
ol.render.canvas.Immediate.prototype.drawMultiLineStringGeometry =
    function(multiLineStringGeometry) {
  var geometryExtent = multiLineStringGeometry.getExtent();
  if (!ol.extent.intersects(this.extent_, geometryExtent) ||
      !goog.isDefAndNotNull(this.state_.strokeStyle)) {
    return;
  }
  var context = this.context_;
  var pixelCoordinates = ol.geom.transformGeometry2D(
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
ol.render.canvas.Immediate.prototype.drawPolygonGeometry =
    function(polygonGeometry) {
  if (!ol.extent.intersects(this.extent_, polygonGeometry.getExtent())) {
    return;
  }
  var state = this.state_;
  if (!goog.isDefAndNotNull(state.fillStyle) &&
      !goog.isDefAndNotNull(state.strokeStyle)) {
    return;
  }
  var context = this.context_;
  var pixelCoordinates = ol.geom.transformGeometry2D(
      polygonGeometry, this.transform_, this.pixelCoordinates_);
  var ends = polygonGeometry.getEnds();
  context.beginPath();
  this.drawRings_(pixelCoordinates, 0, ends);
  if (goog.isDefAndNotNull(state.fillStyle)) {
    context.fill();
  }
  if (goog.isDefAndNotNull(state.strokeStyle)) {
    context.stroke();
  }
};


/**
 * @inheritDoc
 */
ol.render.canvas.Immediate.prototype.drawMultiPolygonGeometry =
    function(multiPolygonGeometry) {
  if (!ol.extent.intersects(this.extent_, multiPolygonGeometry.getExtent())) {
    return;
  }
  var state = this.state_;
  if (!goog.isDefAndNotNull(state.fillStyle) &&
      !goog.isDefAndNotNull(state.strokeStyle)) {
    return;
  }
  var context = this.context_;
  var pixelCoordinates = ol.geom.transformGeometry2D(
      multiPolygonGeometry, this.transform_, this.pixelCoordinates_);
  var endss = multiPolygonGeometry.getEndss();
  var offset = 0;
  var i, ii;
  for (i = 0, ii = endss.length; i < ii; ++i) {
    var ends = endss[i];
    context.beginPath();
    offset = this.drawRings_(pixelCoordinates, offset, ends);
    if (goog.isDefAndNotNull(state.fillStyle)) {
      context.fill();
    }
    if (goog.isDefAndNotNull(state.strokeStyle)) {
      context.stroke();
    }
  }
};


/**
 * @inheritDoc
 */
ol.render.canvas.Immediate.prototype.setFillStrokeStyle =
    function(fillStyle, strokeStyle) {
  var context = this.context_;
  var state = this.state_;
  if (!ol.style.Fill.equals(state.fillStyle, fillStyle)) {
    if (goog.isDefAndNotNull(fillStyle)) {
      context.fillStyle = ol.color.asString(fillStyle.color);
    }
    state.fillStyle = fillStyle;
  }
  if (!ol.style.Stroke.equals(state.strokeStyle, strokeStyle)) {
    if (goog.isDefAndNotNull(strokeStyle)) {
      context.strokeStyle = ol.color.asString(strokeStyle.color);
      context.lineWidth = goog.isDef(strokeStyle.width) ? strokeStyle.width : 1;
    }
    state.strokeStyle = strokeStyle;
  }
};


/**
 * @inheritDoc
 */
ol.render.canvas.Immediate.prototype.setImageStyle = function(imageStyle) {
  this.state_.imageStyle = imageStyle;
};


/**
 * @inheritDoc
 */
ol.render.canvas.Immediate.prototype.setTextStyle = function(textStyle) {
  var context = this.context_;
  var state = this.state_;
  if (!ol.style.Text.equals(state.textStyle, textStyle)) {
    if (goog.isDefAndNotNull(textStyle)) {
      context.font = goog.isDef(textStyle.font) ?
          textStyle.font : '10px sans-serif';
      context.textAlign = goog.isDef(textStyle.textAlign) ?
          textStyle.textAlign : 'start';
      context.textBaseline = goog.isDef(textStyle.textBaseline) ?
          textStyle.textBaseline : 'alphabetic';
    }
    state.textStyle = textStyle;
  }
};


/**
 * @const
 * @private
 * @type {Object.<ol.geom.Type,
 *                function(this: ol.render.canvas.Immediate, ol.geom.Geometry)>}
 */
ol.render.canvas.Immediate.GEOMETRY_RENDERES_ = {
  'Point': ol.render.canvas.Immediate.prototype.drawPointGeometry,
  'LineString': ol.render.canvas.Immediate.prototype.drawLineStringGeometry,
  'Polygon': ol.render.canvas.Immediate.prototype.drawPolygonGeometry,
  'MultiPoint': ol.render.canvas.Immediate.prototype.drawMultiPointGeometry,
  'MultiLineString':
      ol.render.canvas.Immediate.prototype.drawMultiLineStringGeometry,
  'MultiPolygon': ol.render.canvas.Immediate.prototype.drawMultiPolygonGeometry
};
