// FIXME test, especially polygons with holes and multipolygons
// FIXME need to handle large thick features (where pixel size matters)
// FIXME store raw style values for text

goog.provide('ol.render.canvas.Immediate');

goog.require('goog.asserts');
goog.require('goog.vec.Mat4');
goog.require('ol.color');
goog.require('ol.extent');
goog.require('ol.render.IRender');
goog.require('ol.render.canvas');
goog.require('ol.style.Text');
goog.require('ol.vec.Mat4');



/**
 * @constructor
 * @implements {ol.render.IRender}
 * @param {CanvasRenderingContext2D} context Context.
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.Extent} extent Extent.
 * @param {goog.vec.Mat4.AnyType} transform Transform.
 * @struct
 */
ol.render.canvas.Immediate = function(context, pixelRatio, extent, transform) {

  /**
   * @private
   * @type {CanvasRenderingContext2D}
   */
  this.context_ = context;

  /**
   * @private
   * @type {number}
   */
  this.pixelRatio_ = pixelRatio;

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
   * @type {{currentFillStyle: (string|undefined),
   *         currentStrokeStyle: (string|undefined),
   *         currentLineCap: (string|undefined),
   *         currentLineDash: Array.<number>,
   *         currentLineJoin: (string|undefined),
   *         currentLineWidth: (number|undefined),
   *         currentMiterLimit: (number|undefined),
   *         fillStyle: (string|undefined),
   *         strokeStyle: (string|undefined),
   *         lineWidth: (number|undefined),
   *         image: (HTMLCanvasElement|HTMLVideoElement|Image),
   *         anchorX: (number|undefined),
   *         anchorY: (number|undefined),
   *         height: (number|undefined),
   *         width: (number|undefined),
   *         scale: number,
   *         rotation: number,
   *         lineCap: (string|undefined),
   *         lineDash: Array.<number>,
   *         lineJoin: (string|undefined),
   *         miterLimit: (number|undefined),
   *         snapToPixel: (boolean|undefined),
   *         textStyle: ol.style.Text}}
   */
  this.state_ = {
    currentFillStyle: undefined,
    currentStrokeStyle: undefined,
    currentLineCap: undefined,
    currentLineDash: null,
    currentLineJoin: undefined,
    currentLineWidth: undefined,
    currentMiterLimit: undefined,
    fillStyle: undefined,
    strokeStyle: undefined,
    lineWidth: undefined,
    image: null,
    anchorX: undefined,
    anchorY: undefined,
    height: undefined,
    rotation: 0,
    scale: 1,
    width: undefined,
    lineCap: undefined,
    lineDash: null,
    lineJoin: undefined,
    miterLimit: undefined,
    snapToPixel: undefined,
    textStyle: null
  };

  /**
   * @private
   * @type {Array.<number>}
   */
  this.pixelCoordinates_ = [];

  /**
   * @private
   * @type {!goog.vec.Mat4.Number}
   */
  this.tmpLocalTransform_ = goog.vec.Mat4.createNumber();

};


/**
 * @param {ol.geom.Point|ol.geom.MultiPoint} geometry Geometry.
 * @private
 */
ol.render.canvas.Immediate.prototype.drawImages_ = function(geometry) {
  var state = this.state_;
  var context = this.context_;
  if (!ol.extent.intersects(this.extent_, geometry.getExtent()) ||
      goog.isNull(state.image)) {
    return;
  }
  goog.asserts.assert(goog.isDef(state.anchorX));
  goog.asserts.assert(goog.isDef(state.anchorY));
  goog.asserts.assert(goog.isDef(state.height));
  goog.asserts.assert(goog.isDef(state.width));
  var pixelCoordinates = ol.geom.transformSimpleGeometry2D(
      geometry, this.transform_, this.pixelCoordinates_);
  var localTransform = this.tmpLocalTransform_;
  var i, ii;
  for (i = 0, ii = pixelCoordinates.length; i < ii; i += 2) {
    var x = pixelCoordinates[i] - state.anchorX;
    var y = pixelCoordinates[i + 1] - state.anchorY;
    if (state.snapToPixel) {
      x = (x + 0.5) | 0;
      y = (y + 0.5) | 0;
    }
    if (state.scale != 1 || state.rotation !== 0) {
      var centerX = x + state.anchorX;
      var centerY = y + state.anchorY;
      ol.vec.Mat4.makeTransform2D(localTransform,
          centerX, centerY, state.scale, state.scale,
          state.rotation, -centerX, -centerY);
      context.setTransform(
          goog.vec.Mat4.getElement(localTransform, 0, 0),
          goog.vec.Mat4.getElement(localTransform, 1, 0),
          goog.vec.Mat4.getElement(localTransform, 0, 1),
          goog.vec.Mat4.getElement(localTransform, 1, 1),
          goog.vec.Mat4.getElement(localTransform, 0, 3),
          goog.vec.Mat4.getElement(localTransform, 1, 3));
    }
    context.drawImage(state.image, x, y, state.width, state.height);
  }
  if (state.scale != 1 || state.rotation !== 0) {
    context.setTransform(1, 0, 0, 1, 0, 0);
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
      (!goog.isDef(fillStyle) && !goog.isDef(strokeStyle))) {
    return;
  }
  this.setFillStrokeStyles_();
  var pixelCoordinates = ol.geom.transformSimpleGeometry2D(
      geometry, this.transform_, this.pixelCoordinates_);
  var i, ii;
  for (i = 0, ii = pixelCoordinates.length; i < ii; i += 2) {
    var x = pixelCoordinates[i];
    var y = pixelCoordinates[i + 1];
    // FIXME stroke before fill or fill before stroke?
    if (goog.isDef(strokeStyle)) {
      context.strokeText(textStyle.text, x, y);
    }
    if (goog.isDef(fillStyle)) {
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
  if (goog.isNull(geometry) ||
      !ol.extent.intersects(this.extent_, geometry.getExtent())) {
    return;
  }
  this.setFillStrokeStyle(style.getFill(), style.getStroke());
  this.setImageStyle(style.getImage());
  var renderGeometry =
      ol.render.canvas.Immediate.GEOMETRY_RENDERES_[geometry.getType()];
  goog.asserts.assert(goog.isDef(renderGeometry));
  renderGeometry.call(this, geometry, null);
};


/**
 * @inheritDoc
 */
ol.render.canvas.Immediate.prototype.drawGeometryCollectionGeometry =
    function(geometryCollectionGeometry, data) {
  var geometries = geometryCollectionGeometry.getGeometriesArray();
  var i, ii;
  for (i = 0, ii = geometries.length; i < ii; ++i) {
    var geometry = geometries[i];
    var geometryRenderer =
        ol.render.canvas.Immediate.GEOMETRY_RENDERES_[geometry.getType()];
    goog.asserts.assert(goog.isDef(geometryRenderer));
    geometryRenderer.call(this, geometry, data);
  }
};


/**
 * @inheritDoc
 */
ol.render.canvas.Immediate.prototype.drawPointGeometry =
    function(pointGeometry, data) {
  this.drawImages_(pointGeometry);
  this.drawText_(pointGeometry);
};


/**
 * @inheritDoc
 */
ol.render.canvas.Immediate.prototype.drawMultiPointGeometry =
    function(multiPointGeometry, data) {
  this.drawImages_(multiPointGeometry);
  this.drawText_(multiPointGeometry);
};


/**
 * @inheritDoc
 */
ol.render.canvas.Immediate.prototype.drawLineStringGeometry =
    function(lineStringGeometry, data) {
  if (!ol.extent.intersects(this.extent_, lineStringGeometry.getExtent()) ||
      !goog.isDef(this.state_.strokeStyle)) {
    return;
  }
  this.setFillStrokeStyles_();
  var context = this.context_;
  var pixelCoordinates = ol.geom.transformSimpleGeometry2D(
      lineStringGeometry, this.transform_, this.pixelCoordinates_);
  context.beginPath();
  this.moveToLineTo_(pixelCoordinates, 0, pixelCoordinates.length, false);
  context.stroke();
};


/**
 * @inheritDoc
 */
ol.render.canvas.Immediate.prototype.drawMultiLineStringGeometry =
    function(multiLineStringGeometry, data) {
  var geometryExtent = multiLineStringGeometry.getExtent();
  if (!ol.extent.intersects(this.extent_, geometryExtent) ||
      !goog.isDef(this.state_.strokeStyle)) {
    return;
  }
  this.setFillStrokeStyles_();
  var context = this.context_;
  var pixelCoordinates = ol.geom.transformSimpleGeometry2D(
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
    function(polygonGeometry, data) {
  if (!ol.extent.intersects(this.extent_, polygonGeometry.getExtent())) {
    return;
  }
  var state = this.state_;
  if (!goog.isDef(state.fillStyle) && !goog.isDef(state.strokeStyle)) {
    return;
  }
  this.setFillStrokeStyles_();
  var context = this.context_;
  var pixelCoordinates = ol.geom.transformSimpleGeometry2D(
      polygonGeometry, this.transform_, this.pixelCoordinates_);
  var ends = polygonGeometry.getEnds();
  context.beginPath();
  this.drawRings_(pixelCoordinates, 0, ends);
  if (goog.isDef(state.fillStyle)) {
    context.fill();
  }
  if (goog.isDef(state.strokeStyle)) {
    goog.asserts.assert(goog.isDef(state.lineWidth));
    context.stroke();
  }
};


/**
 * @inheritDoc
 */
ol.render.canvas.Immediate.prototype.drawMultiPolygonGeometry =
    function(multiPolygonGeometry, data) {
  if (!ol.extent.intersects(this.extent_, multiPolygonGeometry.getExtent())) {
    return;
  }
  var state = this.state_;
  if (!goog.isDef(state.fillStyle) && !goog.isDef(state.strokeStyle)) {
    return;
  }
  this.setFillStrokeStyles_();
  var context = this.context_;
  var pixelCoordinates = ol.geom.transformSimpleGeometry2D(
      multiPolygonGeometry, this.transform_, this.pixelCoordinates_);
  var endss = multiPolygonGeometry.getEndss();
  var offset = 0;
  var i, ii;
  for (i = 0, ii = endss.length; i < ii; ++i) {
    var ends = endss[i];
    context.beginPath();
    offset = this.drawRings_(pixelCoordinates, offset, ends);
    if (goog.isDef(state.fillStyle)) {
      context.fill();
    }
    if (goog.isDef(state.strokeStyle)) {
      goog.asserts.assert(goog.isDef(state.lineWidth));
      context.stroke();
    }
  }
};


/**
 * @inheritDoc
 */
ol.render.canvas.Immediate.prototype.setFillStrokeStyle =
    function(fillStyle, strokeStyle) {
  var state = this.state_;
  if (!goog.isNull(fillStyle)) {
    var fillStyleColor = fillStyle.getColor();
    state.fillStyle = ol.color.asString(!goog.isNull(fillStyleColor) ?
        fillStyleColor : ol.render.canvas.defaultFillStyle);
  } else {
    state.fillStyle = undefined;
  }
  if (!goog.isNull(strokeStyle)) {
    var strokeStyleColor = strokeStyle.getColor();
    state.strokeStyle = ol.color.asString(!goog.isNull(strokeStyleColor) ?
        strokeStyleColor : ol.render.canvas.defaultStrokeStyle);
    var strokeStyleLineCap = strokeStyle.getLineCap();
    state.lineCap = goog.isDef(strokeStyleLineCap) ?
        strokeStyleLineCap : ol.render.canvas.defaultLineCap;
    var strokeStyleLineDash = strokeStyle.getLineDash();
    state.lineDash = !goog.isNull(strokeStyleLineDash) ?
        strokeStyleLineDash : ol.render.canvas.defaultLineDash;
    var strokeStyleLineJoin = strokeStyle.getLineJoin();
    state.lineJoin = goog.isDef(strokeStyleLineJoin) ?
        strokeStyleLineJoin : ol.render.canvas.defaultLineJoin;
    var strokeStyleWidth = strokeStyle.getWidth();
    state.lineWidth = this.pixelRatio_ * (goog.isDef(strokeStyleWidth) ?
        strokeStyleWidth : ol.render.canvas.defaultLineWidth);
    var strokeStyleMiterLimit = strokeStyle.getMiterLimit();
    state.miterLimit = goog.isDef(strokeStyleMiterLimit) ?
        strokeStyleMiterLimit : ol.render.canvas.defaultMiterLimit;
  } else {
    state.strokeStyle = undefined;
    state.lineCap = undefined;
    state.lineDash = null;
    state.lineJoin = undefined;
    state.lineWidth = undefined;
    state.miterLimit = undefined;
  }
};


/**
 * @private
 */
ol.render.canvas.Immediate.prototype.setFillStrokeStyles_ = function() {
  var state = this.state_;
  var context = this.context_;
  var fillStyle = state.fillStyle;
  var strokeStyle = state.strokeStyle;
  var lineCap = state.lineCap;
  var lineDash = state.lineDash;
  var lineJoin = state.lineJoin;
  var lineWidth = state.lineWidth;
  var miterLimit = state.miterLimit;
  if (goog.isDef(fillStyle) && state.currentFillStyle != fillStyle) {
    context.fillStyle = fillStyle;
    state.currentFillStyle = fillStyle;
  }
  if (goog.isDef(strokeStyle)) {
    goog.asserts.assert(goog.isDef(lineWidth));
    goog.asserts.assert(goog.isDef(lineCap));
    goog.asserts.assert(!goog.isNull(lineDash));
    goog.asserts.assert(goog.isDef(lineJoin));
    goog.asserts.assert(goog.isDef(miterLimit));
    if (state.currentStrokeStyle != strokeStyle ||
        state.currentLineCap != lineCap ||
        state.currentLineDash != lineDash ||
        state.currentLineJoin != lineJoin ||
        state.currentMiterLimit != miterLimit ||
        state.currentLineWidth != lineWidth) {
      context.strokeStyle = strokeStyle;
      context.lineCap = lineCap;
      if (goog.isDef(context.setLineDash)) {
        context.setLineDash(lineDash);
      }
      context.lineJoin = lineJoin;
      context.miterLimit = miterLimit;
      context.lineWidth = lineWidth;
    }
  }
};


/**
 * @inheritDoc
 */
ol.render.canvas.Immediate.prototype.setImageStyle = function(imageStyle) {
  if (!goog.isNull(imageStyle)) {
    var anchor = imageStyle.getAnchor();
    goog.asserts.assert(!goog.isNull(anchor));
    var size = imageStyle.getSize();
    goog.asserts.assert(!goog.isNull(size));
    // FIXME pixel ratio
    var image = imageStyle.getImage(1);
    goog.asserts.assert(!goog.isNull(image));
    var state = this.state_;
    state.image = image;
    state.anchorX = anchor[0];
    state.anchorY = anchor[1];
    state.height = size[1];
    state.rotation = imageStyle.getRotation();
    state.scale = imageStyle.getScale();
    state.snapToPixel = imageStyle.getSnapToPixel();
    state.width = size[0];
  }
};


/**
 * @inheritDoc
 */
ol.render.canvas.Immediate.prototype.setTextStyle = function(textStyle) {
  var context = this.context_;
  var state = this.state_;
  if (!ol.style.Text.equals(state.textStyle, textStyle)) {
    if (goog.isDefAndNotNull(textStyle)) {
      var textStyleFont = textStyle.getFont();
      context.font = goog.isDef(textStyleFont) ?
          textStyleFont : ol.render.canvas.defaultFont;
      var textStyleTextAlign = textStyle.getTextAlign();
      context.textAlign = goog.isDef(textStyleTextAlign) ?
          textStyleTextAlign : ol.render.canvas.defaultTextAlign;
      var textStyleTextBaseline = textStyle.getTextBaseline();
      context.textBaseline = goog.isDef(textStyleTextBaseline) ?
          textStyleTextBaseline : ol.render.canvas.defaultTextBaseline;
    }
    state.textStyle = textStyle;
  }
};


/**
 * @const
 * @private
 * @type {Object.<ol.geom.GeometryType,
 *                function(this: ol.render.canvas.Immediate, ol.geom.Geometry,
 *                         Object)>}
 */
ol.render.canvas.Immediate.GEOMETRY_RENDERES_ = {
  'Point': ol.render.canvas.Immediate.prototype.drawPointGeometry,
  'LineString': ol.render.canvas.Immediate.prototype.drawLineStringGeometry,
  'Polygon': ol.render.canvas.Immediate.prototype.drawPolygonGeometry,
  'MultiPoint': ol.render.canvas.Immediate.prototype.drawMultiPointGeometry,
  'MultiLineString':
      ol.render.canvas.Immediate.prototype.drawMultiLineStringGeometry,
  'MultiPolygon': ol.render.canvas.Immediate.prototype.drawMultiPolygonGeometry,
  'GeometryCollection':
      ol.render.canvas.Immediate.prototype.drawGeometryCollectionGeometry
};
