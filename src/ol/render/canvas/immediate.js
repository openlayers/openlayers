// FIXME test, especially polygons with holes and multipolygons
// FIXME need to handle large thick features (where pixel size matters)
// FIXME add offset and end to ol.geom.flat.transform.transform2D?

goog.provide('ol.render.canvas.Immediate');

goog.require('ol');
goog.require('ol.array');
goog.require('ol.color');
goog.require('ol.colorlike');
goog.require('ol.extent');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.SimpleGeometry');
goog.require('ol.geom.flat.transform');
goog.require('ol.has');
goog.require('ol.render.VectorContext');
goog.require('ol.render.canvas');
goog.require('ol.transform');


/**
 * @classdesc
 * A concrete subclass of {@link ol.render.VectorContext} that implements
 * direct rendering of features and geometries to an HTML5 Canvas context.
 * Instances of this class are created internally by the library and
 * provided to application code as vectorContext member of the
 * {@link ol.render.Event} object associated with postcompose, precompose and
 * render events emitted by layers and maps.
 *
 * @constructor
 * @extends {ol.render.VectorContext}
 * @param {CanvasRenderingContext2D} context Context.
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.Extent} extent Extent.
 * @param {ol.Transform} transform Transform.
 * @param {number} viewRotation View rotation.
 * @struct
 */
ol.render.canvas.Immediate = function(context, pixelRatio, extent, transform, viewRotation) {
  ol.render.VectorContext.call(this);

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
   * @type {ol.Transform}
   */
  this.transform_ = transform;

  /**
   * @private
   * @type {number}
   */
  this.viewRotation_ = viewRotation;

  /**
   * @private
   * @type {?ol.CanvasFillState}
   */
  this.contextFillState_ = null;

  /**
   * @private
   * @type {?ol.CanvasStrokeState}
   */
  this.contextStrokeState_ = null;

  /**
   * @private
   * @type {?ol.CanvasTextState}
   */
  this.contextTextState_ = null;

  /**
   * @private
   * @type {?ol.CanvasFillState}
   */
  this.fillState_ = null;

  /**
   * @private
   * @type {?ol.CanvasStrokeState}
   */
  this.strokeState_ = null;

  /**
   * @private
   * @type {HTMLCanvasElement|HTMLVideoElement|Image}
   */
  this.image_ = null;

  /**
   * @private
   * @type {number}
   */
  this.imageAnchorX_ = 0;

  /**
   * @private
   * @type {number}
   */
  this.imageAnchorY_ = 0;

  /**
   * @private
   * @type {number}
   */
  this.imageHeight_ = 0;

  /**
   * @private
   * @type {number}
   */
  this.imageOpacity_ = 0;

  /**
   * @private
   * @type {number}
   */
  this.imageOriginX_ = 0;

  /**
   * @private
   * @type {number}
   */
  this.imageOriginY_ = 0;

  /**
   * @private
   * @type {boolean}
   */
  this.imageRotateWithView_ = false;

  /**
   * @private
   * @type {number}
   */
  this.imageRotation_ = 0;

  /**
   * @private
   * @type {number}
   */
  this.imageScale_ = 0;

  /**
   * @private
   * @type {boolean}
   */
  this.imageSnapToPixel_ = false;

  /**
   * @private
   * @type {number}
   */
  this.imageWidth_ = 0;

  /**
   * @private
   * @type {string}
   */
  this.text_ = '';

  /**
   * @private
   * @type {number}
   */
  this.textOffsetX_ = 0;

  /**
   * @private
   * @type {number}
   */
  this.textOffsetY_ = 0;

  /**
   * @private
   * @type {boolean}
   */
  this.textRotateWithView_ = false;

  /**
   * @private
   * @type {number}
   */
  this.textRotation_ = 0;

  /**
   * @private
   * @type {number}
   */
  this.textScale_ = 0;

  /**
   * @private
   * @type {?ol.CanvasFillState}
   */
  this.textFillState_ = null;

  /**
   * @private
   * @type {?ol.CanvasStrokeState}
   */
  this.textStrokeState_ = null;

  /**
   * @private
   * @type {?ol.CanvasTextState}
   */
  this.textState_ = null;

  /**
   * @private
   * @type {Array.<number>}
   */
  this.pixelCoordinates_ = [];

  /**
   * @private
   * @type {ol.Transform}
   */
  this.tmpLocalTransform_ = ol.transform.create();

};
ol.inherits(ol.render.canvas.Immediate, ol.render.VectorContext);


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @private
 */
ol.render.canvas.Immediate.prototype.drawImages_ = function(flatCoordinates, offset, end, stride) {
  if (!this.image_) {
    return;
  }
  goog.DEBUG && console.assert(offset === 0, 'offset should be 0');
  goog.DEBUG && console.assert(end == flatCoordinates.length,
      'end should be equal to the length of flatCoordinates');
  var pixelCoordinates = ol.geom.flat.transform.transform2D(
      flatCoordinates, offset, end, 2, this.transform_,
      this.pixelCoordinates_);
  var context = this.context_;
  var localTransform = this.tmpLocalTransform_;
  var alpha = context.globalAlpha;
  if (this.imageOpacity_ != 1) {
    context.globalAlpha = alpha * this.imageOpacity_;
  }
  var rotation = this.imageRotation_;
  if (this.imageRotateWithView_) {
    rotation += this.viewRotation_;
  }
  var i, ii;
  for (i = 0, ii = pixelCoordinates.length; i < ii; i += 2) {
    var x = pixelCoordinates[i] - this.imageAnchorX_;
    var y = pixelCoordinates[i + 1] - this.imageAnchorY_;
    if (this.imageSnapToPixel_) {
      x = Math.round(x);
      y = Math.round(y);
    }
    if (rotation !== 0 || this.imageScale_ != 1) {
      var centerX = x + this.imageAnchorX_;
      var centerY = y + this.imageAnchorY_;
      ol.transform.compose(localTransform,
          centerX, centerY,
          this.imageScale_, this.imageScale_,
          rotation,
          -centerX, -centerY);
      context.setTransform.apply(context, localTransform);
    }
    context.drawImage(this.image_, this.imageOriginX_, this.imageOriginY_,
        this.imageWidth_, this.imageHeight_, x, y,
        this.imageWidth_, this.imageHeight_);
  }
  if (rotation !== 0 || this.imageScale_ != 1) {
    context.setTransform(1, 0, 0, 1, 0, 0);
  }
  if (this.imageOpacity_ != 1) {
    context.globalAlpha = alpha;
  }
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @private
 */
ol.render.canvas.Immediate.prototype.drawText_ = function(flatCoordinates, offset, end, stride) {
  if (!this.textState_ || this.text_ === '') {
    return;
  }
  if (this.textFillState_) {
    this.setContextFillState_(this.textFillState_);
  }
  if (this.textStrokeState_) {
    this.setContextStrokeState_(this.textStrokeState_);
  }
  this.setContextTextState_(this.textState_);
  goog.DEBUG && console.assert(offset === 0, 'offset should be 0');
  goog.DEBUG && console.assert(end == flatCoordinates.length,
      'end should be equal to the length of flatCoordinates');
  var pixelCoordinates = ol.geom.flat.transform.transform2D(
      flatCoordinates, offset, end, stride, this.transform_,
      this.pixelCoordinates_);
  var context = this.context_;
  var rotation = this.textRotation_;
  if (this.textRotateWithView_) {
    rotation += this.viewRotation_;
  }
  for (; offset < end; offset += stride) {
    var x = pixelCoordinates[offset] + this.textOffsetX_;
    var y = pixelCoordinates[offset + 1] + this.textOffsetY_;
    if (rotation !== 0 || this.textScale_ != 1) {
      var localTransform = ol.transform.compose(this.tmpLocalTransform_,
          x, y,
          this.textScale_, this.textScale_,
          rotation,
          -x, -y);
      context.setTransform.apply(context, localTransform);
    }
    if (this.textStrokeState_) {
      context.strokeText(this.text_, x, y);
    }
    if (this.textFillState_) {
      context.fillText(this.text_, x, y);
    }
  }
  if (rotation !== 0 || this.textScale_ != 1) {
    context.setTransform(1, 0, 0, 1, 0, 0);
  }
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {boolean} close Close.
 * @private
 * @return {number} end End.
 */
ol.render.canvas.Immediate.prototype.moveToLineTo_ = function(flatCoordinates, offset, end, stride, close) {
  var context = this.context_;
  var pixelCoordinates = ol.geom.flat.transform.transform2D(
      flatCoordinates, offset, end, stride, this.transform_,
      this.pixelCoordinates_);
  context.moveTo(pixelCoordinates[0], pixelCoordinates[1]);
  var length = pixelCoordinates.length;
  if (close) {
    length -= 2;
  }
  for (var i = 2; i < length; i += 2) {
    context.lineTo(pixelCoordinates[i], pixelCoordinates[i + 1]);
  }
  if (close) {
    context.closePath();
  }
  return end;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<number>} ends Ends.
 * @param {number} stride Stride.
 * @private
 * @return {number} End.
 */
ol.render.canvas.Immediate.prototype.drawRings_ = function(flatCoordinates, offset, ends, stride) {
  var i, ii;
  for (i = 0, ii = ends.length; i < ii; ++i) {
    offset = this.moveToLineTo_(
        flatCoordinates, offset, ends[i], stride, true);
  }
  return offset;
};


/**
 * Render a circle geometry into the canvas.  Rendering is immediate and uses
 * the current fill and stroke styles.
 *
 * @param {ol.geom.Circle} geometry Circle geometry.
 * @api
 */
ol.render.canvas.Immediate.prototype.drawCircle = function(geometry) {
  if (!ol.extent.intersects(this.extent_, geometry.getExtent())) {
    return;
  }
  if (this.fillState_ || this.strokeState_) {
    if (this.fillState_) {
      this.setContextFillState_(this.fillState_);
    }
    if (this.strokeState_) {
      this.setContextStrokeState_(this.strokeState_);
    }
    var pixelCoordinates = ol.geom.SimpleGeometry.transform2D(
        geometry, this.transform_, this.pixelCoordinates_);
    var dx = pixelCoordinates[2] - pixelCoordinates[0];
    var dy = pixelCoordinates[3] - pixelCoordinates[1];
    var radius = Math.sqrt(dx * dx + dy * dy);
    var context = this.context_;
    context.beginPath();
    context.arc(
        pixelCoordinates[0], pixelCoordinates[1], radius, 0, 2 * Math.PI);
    if (this.fillState_) {
      context.fill();
    }
    if (this.strokeState_) {
      context.stroke();
    }
  }
  if (this.text_ !== '') {
    this.drawText_(geometry.getCenter(), 0, 2, 2);
  }
};


/**
 * Set the rendering style.  Note that since this is an immediate rendering API,
 * any `zIndex` on the provided style will be ignored.
 *
 * @param {ol.style.Style} style The rendering style.
 * @api
 */
ol.render.canvas.Immediate.prototype.setStyle = function(style) {
  this.setFillStrokeStyle(style.getFill(), style.getStroke());
  this.setImageStyle(style.getImage());
  this.setTextStyle(style.getText());
};


/**
 * Render a geometry into the canvas.  Call
 * {@link ol.render.canvas.Immediate#setStyle} first to set the rendering style.
 *
 * @param {ol.geom.Geometry|ol.render.Feature} geometry The geometry to render.
 * @api
 */
ol.render.canvas.Immediate.prototype.drawGeometry = function(geometry) {
  var type = geometry.getType();
  switch (type) {
    case ol.geom.GeometryType.POINT:
      this.drawPoint(/** @type {ol.geom.Point} */ (geometry));
      break;
    case ol.geom.GeometryType.LINE_STRING:
      this.drawLineString(/** @type {ol.geom.LineString} */ (geometry));
      break;
    case ol.geom.GeometryType.POLYGON:
      this.drawPolygon(/** @type {ol.geom.Polygon} */ (geometry));
      break;
    case ol.geom.GeometryType.MULTI_POINT:
      this.drawMultiPoint(/** @type {ol.geom.MultiPoint} */ (geometry));
      break;
    case ol.geom.GeometryType.MULTI_LINE_STRING:
      this.drawMultiLineString(/** @type {ol.geom.MultiLineString} */ (geometry));
      break;
    case ol.geom.GeometryType.MULTI_POLYGON:
      this.drawMultiPolygon(/** @type {ol.geom.MultiPolygon} */ (geometry));
      break;
    case ol.geom.GeometryType.GEOMETRY_COLLECTION:
      this.drawGeometryCollection(/** @type {ol.geom.GeometryCollection} */ (geometry));
      break;
    case ol.geom.GeometryType.CIRCLE:
      this.drawCircle(/** @type {ol.geom.Circle} */ (geometry));
      break;
    default:
      goog.DEBUG && console.assert(false, 'Unsupported geometry type: ' + type);
  }
};


/**
 * Render a feature into the canvas.  Note that any `zIndex` on the provided
 * style will be ignored - features are rendered immediately in the order that
 * this method is called.  If you need `zIndex` support, you should be using an
 * {@link ol.layer.Vector} instead.
 *
 * @param {ol.Feature} feature Feature.
 * @param {ol.style.Style} style Style.
 * @api
 */
ol.render.canvas.Immediate.prototype.drawFeature = function(feature, style) {
  var geometry = style.getGeometryFunction()(feature);
  if (!geometry ||
      !ol.extent.intersects(this.extent_, geometry.getExtent())) {
    return;
  }
  this.setStyle(style);
  this.drawGeometry(geometry);
};


/**
 * Render a GeometryCollection to the canvas.  Rendering is immediate and
 * uses the current styles appropriate for each geometry in the collection.
 *
 * @param {ol.geom.GeometryCollection} geometry Geometry collection.
 */
ol.render.canvas.Immediate.prototype.drawGeometryCollection = function(geometry) {
  var geometries = geometry.getGeometriesArray();
  var i, ii;
  for (i = 0, ii = geometries.length; i < ii; ++i) {
    this.drawGeometry(geometries[i]);
  }
};


/**
 * Render a Point geometry into the canvas.  Rendering is immediate and uses
 * the current style.
 *
 * @param {ol.geom.Point|ol.render.Feature} geometry Point geometry.
 */
ol.render.canvas.Immediate.prototype.drawPoint = function(geometry) {
  var flatCoordinates = geometry.getFlatCoordinates();
  var stride = geometry.getStride();
  if (this.image_) {
    this.drawImages_(flatCoordinates, 0, flatCoordinates.length, stride);
  }
  if (this.text_ !== '') {
    this.drawText_(flatCoordinates, 0, flatCoordinates.length, stride);
  }
};


/**
 * Render a MultiPoint geometry  into the canvas.  Rendering is immediate and
 * uses the current style.
 *
 * @param {ol.geom.MultiPoint|ol.render.Feature} geometry MultiPoint geometry.
 */
ol.render.canvas.Immediate.prototype.drawMultiPoint = function(geometry) {
  var flatCoordinates = geometry.getFlatCoordinates();
  var stride = geometry.getStride();
  if (this.image_) {
    this.drawImages_(flatCoordinates, 0, flatCoordinates.length, stride);
  }
  if (this.text_ !== '') {
    this.drawText_(flatCoordinates, 0, flatCoordinates.length, stride);
  }
};


/**
 * Render a LineString into the canvas.  Rendering is immediate and uses
 * the current style.
 *
 * @param {ol.geom.LineString|ol.render.Feature} geometry LineString geometry.
 */
ol.render.canvas.Immediate.prototype.drawLineString = function(geometry) {
  if (!ol.extent.intersects(this.extent_, geometry.getExtent())) {
    return;
  }
  if (this.strokeState_) {
    this.setContextStrokeState_(this.strokeState_);
    var context = this.context_;
    var flatCoordinates = geometry.getFlatCoordinates();
    context.beginPath();
    this.moveToLineTo_(flatCoordinates, 0, flatCoordinates.length,
        geometry.getStride(), false);
    context.stroke();
  }
  if (this.text_ !== '') {
    var flatMidpoint = geometry.getFlatMidpoint();
    this.drawText_(flatMidpoint, 0, 2, 2);
  }
};


/**
 * Render a MultiLineString geometry into the canvas.  Rendering is immediate
 * and uses the current style.
 *
 * @param {ol.geom.MultiLineString|ol.render.Feature} geometry MultiLineString
 *     geometry.
 */
ol.render.canvas.Immediate.prototype.drawMultiLineString = function(geometry) {
  var geometryExtent = geometry.getExtent();
  if (!ol.extent.intersects(this.extent_, geometryExtent)) {
    return;
  }
  if (this.strokeState_) {
    this.setContextStrokeState_(this.strokeState_);
    var context = this.context_;
    var flatCoordinates = geometry.getFlatCoordinates();
    var offset = 0;
    var ends = geometry.getEnds();
    var stride = geometry.getStride();
    context.beginPath();
    var i, ii;
    for (i = 0, ii = ends.length; i < ii; ++i) {
      offset = this.moveToLineTo_(
          flatCoordinates, offset, ends[i], stride, false);
    }
    context.stroke();
  }
  if (this.text_ !== '') {
    var flatMidpoints = geometry.getFlatMidpoints();
    this.drawText_(flatMidpoints, 0, flatMidpoints.length, 2);
  }
};


/**
 * Render a Polygon geometry into the canvas.  Rendering is immediate and uses
 * the current style.
 *
 * @param {ol.geom.Polygon|ol.render.Feature} geometry Polygon geometry.
 */
ol.render.canvas.Immediate.prototype.drawPolygon = function(geometry) {
  if (!ol.extent.intersects(this.extent_, geometry.getExtent())) {
    return;
  }
  if (this.strokeState_ || this.fillState_) {
    if (this.fillState_) {
      this.setContextFillState_(this.fillState_);
    }
    if (this.strokeState_) {
      this.setContextStrokeState_(this.strokeState_);
    }
    var context = this.context_;
    context.beginPath();
    this.drawRings_(geometry.getOrientedFlatCoordinates(),
        0, geometry.getEnds(), geometry.getStride());
    if (this.fillState_) {
      context.fill();
    }
    if (this.strokeState_) {
      context.stroke();
    }
  }
  if (this.text_ !== '') {
    var flatInteriorPoint = geometry.getFlatInteriorPoint();
    this.drawText_(flatInteriorPoint, 0, 2, 2);
  }
};


/**
 * Render MultiPolygon geometry into the canvas.  Rendering is immediate and
 * uses the current style.
 * @param {ol.geom.MultiPolygon} geometry MultiPolygon geometry.
 */
ol.render.canvas.Immediate.prototype.drawMultiPolygon = function(geometry) {
  if (!ol.extent.intersects(this.extent_, geometry.getExtent())) {
    return;
  }
  if (this.strokeState_ || this.fillState_) {
    if (this.fillState_) {
      this.setContextFillState_(this.fillState_);
    }
    if (this.strokeState_) {
      this.setContextStrokeState_(this.strokeState_);
    }
    var context = this.context_;
    var flatCoordinates = geometry.getOrientedFlatCoordinates();
    var offset = 0;
    var endss = geometry.getEndss();
    var stride = geometry.getStride();
    var i, ii;
    for (i = 0, ii = endss.length; i < ii; ++i) {
      var ends = endss[i];
      context.beginPath();
      offset = this.drawRings_(flatCoordinates, offset, ends, stride);
      if (this.fillState_) {
        context.fill();
      }
      if (this.strokeState_) {
        context.stroke();
      }
    }
  }
  if (this.text_ !== '') {
    var flatInteriorPoints = geometry.getFlatInteriorPoints();
    this.drawText_(flatInteriorPoints, 0, flatInteriorPoints.length, 2);
  }
};


/**
 * @param {ol.CanvasFillState} fillState Fill state.
 * @private
 */
ol.render.canvas.Immediate.prototype.setContextFillState_ = function(fillState) {
  var context = this.context_;
  var contextFillState = this.contextFillState_;
  if (!contextFillState) {
    context.fillStyle = fillState.fillStyle;
    this.contextFillState_ = {
      fillStyle: fillState.fillStyle
    };
  } else {
    if (contextFillState.fillStyle != fillState.fillStyle) {
      contextFillState.fillStyle = context.fillStyle = fillState.fillStyle;
    }
  }
};


/**
 * @param {ol.CanvasStrokeState} strokeState Stroke state.
 * @private
 */
ol.render.canvas.Immediate.prototype.setContextStrokeState_ = function(strokeState) {
  var context = this.context_;
  var contextStrokeState = this.contextStrokeState_;
  if (!contextStrokeState) {
    context.lineCap = strokeState.lineCap;
    if (ol.has.CANVAS_LINE_DASH) {
      context.setLineDash(strokeState.lineDash);
    }
    context.lineJoin = strokeState.lineJoin;
    context.lineWidth = strokeState.lineWidth;
    context.miterLimit = strokeState.miterLimit;
    context.strokeStyle = strokeState.strokeStyle;
    this.contextStrokeState_ = {
      lineCap: strokeState.lineCap,
      lineDash: strokeState.lineDash,
      lineJoin: strokeState.lineJoin,
      lineWidth: strokeState.lineWidth,
      miterLimit: strokeState.miterLimit,
      strokeStyle: strokeState.strokeStyle
    };
  } else {
    if (contextStrokeState.lineCap != strokeState.lineCap) {
      contextStrokeState.lineCap = context.lineCap = strokeState.lineCap;
    }
    if (ol.has.CANVAS_LINE_DASH) {
      if (!ol.array.equals(
          contextStrokeState.lineDash, strokeState.lineDash)) {
        context.setLineDash(contextStrokeState.lineDash = strokeState.lineDash);
      }
    }
    if (contextStrokeState.lineJoin != strokeState.lineJoin) {
      contextStrokeState.lineJoin = context.lineJoin = strokeState.lineJoin;
    }
    if (contextStrokeState.lineWidth != strokeState.lineWidth) {
      contextStrokeState.lineWidth = context.lineWidth = strokeState.lineWidth;
    }
    if (contextStrokeState.miterLimit != strokeState.miterLimit) {
      contextStrokeState.miterLimit = context.miterLimit =
          strokeState.miterLimit;
    }
    if (contextStrokeState.strokeStyle != strokeState.strokeStyle) {
      contextStrokeState.strokeStyle = context.strokeStyle =
          strokeState.strokeStyle;
    }
  }
};


/**
 * @param {ol.CanvasTextState} textState Text state.
 * @private
 */
ol.render.canvas.Immediate.prototype.setContextTextState_ = function(textState) {
  var context = this.context_;
  var contextTextState = this.contextTextState_;
  if (!contextTextState) {
    context.font = textState.font;
    context.textAlign = textState.textAlign;
    context.textBaseline = textState.textBaseline;
    this.contextTextState_ = {
      font: textState.font,
      textAlign: textState.textAlign,
      textBaseline: textState.textBaseline
    };
  } else {
    if (contextTextState.font != textState.font) {
      contextTextState.font = context.font = textState.font;
    }
    if (contextTextState.textAlign != textState.textAlign) {
      contextTextState.textAlign = context.textAlign = textState.textAlign;
    }
    if (contextTextState.textBaseline != textState.textBaseline) {
      contextTextState.textBaseline = context.textBaseline =
          textState.textBaseline;
    }
  }
};


/**
 * Set the fill and stroke style for subsequent draw operations.  To clear
 * either fill or stroke styles, pass null for the appropriate parameter.
 *
 * @param {ol.style.Fill} fillStyle Fill style.
 * @param {ol.style.Stroke} strokeStyle Stroke style.
 */
ol.render.canvas.Immediate.prototype.setFillStrokeStyle = function(fillStyle, strokeStyle) {
  if (!fillStyle) {
    this.fillState_ = null;
  } else {
    var fillStyleColor = fillStyle.getColor();
    this.fillState_ = {
      fillStyle: ol.colorlike.asColorLike(fillStyleColor ?
          fillStyleColor : ol.render.canvas.defaultFillStyle)
    };
  }
  if (!strokeStyle) {
    this.strokeState_ = null;
  } else {
    var strokeStyleColor = strokeStyle.getColor();
    var strokeStyleLineCap = strokeStyle.getLineCap();
    var strokeStyleLineDash = strokeStyle.getLineDash();
    var strokeStyleLineJoin = strokeStyle.getLineJoin();
    var strokeStyleWidth = strokeStyle.getWidth();
    var strokeStyleMiterLimit = strokeStyle.getMiterLimit();
    this.strokeState_ = {
      lineCap: strokeStyleLineCap !== undefined ?
          strokeStyleLineCap : ol.render.canvas.defaultLineCap,
      lineDash: strokeStyleLineDash ?
          strokeStyleLineDash : ol.render.canvas.defaultLineDash,
      lineJoin: strokeStyleLineJoin !== undefined ?
          strokeStyleLineJoin : ol.render.canvas.defaultLineJoin,
      lineWidth: this.pixelRatio_ * (strokeStyleWidth !== undefined ?
          strokeStyleWidth : ol.render.canvas.defaultLineWidth),
      miterLimit: strokeStyleMiterLimit !== undefined ?
          strokeStyleMiterLimit : ol.render.canvas.defaultMiterLimit,
      strokeStyle: ol.color.asString(strokeStyleColor ?
          strokeStyleColor : ol.render.canvas.defaultStrokeStyle)
    };
  }
};


/**
 * Set the image style for subsequent draw operations.  Pass null to remove
 * the image style.
 *
 * @param {ol.style.Image} imageStyle Image style.
 */
ol.render.canvas.Immediate.prototype.setImageStyle = function(imageStyle) {
  if (!imageStyle) {
    this.image_ = null;
  } else {
    var imageAnchor = imageStyle.getAnchor();
    // FIXME pixel ratio
    var imageImage = imageStyle.getImage(1);
    var imageOrigin = imageStyle.getOrigin();
    var imageSize = imageStyle.getSize();
    goog.DEBUG && console.assert(imageImage, 'imageImage must be truthy');
    this.imageAnchorX_ = imageAnchor[0];
    this.imageAnchorY_ = imageAnchor[1];
    this.imageHeight_ = imageSize[1];
    this.image_ = imageImage;
    this.imageOpacity_ = imageStyle.getOpacity();
    this.imageOriginX_ = imageOrigin[0];
    this.imageOriginY_ = imageOrigin[1];
    this.imageRotateWithView_ = imageStyle.getRotateWithView();
    this.imageRotation_ = imageStyle.getRotation();
    this.imageScale_ = imageStyle.getScale();
    this.imageSnapToPixel_ = imageStyle.getSnapToPixel();
    this.imageWidth_ = imageSize[0];
  }
};


/**
 * Set the text style for subsequent draw operations.  Pass null to
 * remove the text style.
 *
 * @param {ol.style.Text} textStyle Text style.
 */
ol.render.canvas.Immediate.prototype.setTextStyle = function(textStyle) {
  if (!textStyle) {
    this.text_ = '';
  } else {
    var textFillStyle = textStyle.getFill();
    if (!textFillStyle) {
      this.textFillState_ = null;
    } else {
      var textFillStyleColor = textFillStyle.getColor();
      this.textFillState_ = {
        fillStyle: ol.colorlike.asColorLike(textFillStyleColor ?
            textFillStyleColor : ol.render.canvas.defaultFillStyle)
      };
    }
    var textStrokeStyle = textStyle.getStroke();
    if (!textStrokeStyle) {
      this.textStrokeState_ = null;
    } else {
      var textStrokeStyleColor = textStrokeStyle.getColor();
      var textStrokeStyleLineCap = textStrokeStyle.getLineCap();
      var textStrokeStyleLineDash = textStrokeStyle.getLineDash();
      var textStrokeStyleLineJoin = textStrokeStyle.getLineJoin();
      var textStrokeStyleWidth = textStrokeStyle.getWidth();
      var textStrokeStyleMiterLimit = textStrokeStyle.getMiterLimit();
      this.textStrokeState_ = {
        lineCap: textStrokeStyleLineCap !== undefined ?
            textStrokeStyleLineCap : ol.render.canvas.defaultLineCap,
        lineDash: textStrokeStyleLineDash ?
            textStrokeStyleLineDash : ol.render.canvas.defaultLineDash,
        lineJoin: textStrokeStyleLineJoin !== undefined ?
            textStrokeStyleLineJoin : ol.render.canvas.defaultLineJoin,
        lineWidth: textStrokeStyleWidth !== undefined ?
            textStrokeStyleWidth : ol.render.canvas.defaultLineWidth,
        miterLimit: textStrokeStyleMiterLimit !== undefined ?
            textStrokeStyleMiterLimit : ol.render.canvas.defaultMiterLimit,
        strokeStyle: ol.color.asString(textStrokeStyleColor ?
            textStrokeStyleColor : ol.render.canvas.defaultStrokeStyle)
      };
    }
    var textFont = textStyle.getFont();
    var textOffsetX = textStyle.getOffsetX();
    var textOffsetY = textStyle.getOffsetY();
    var textRotateWithView = textStyle.getRotateWithView();
    var textRotation = textStyle.getRotation();
    var textScale = textStyle.getScale();
    var textText = textStyle.getText();
    var textTextAlign = textStyle.getTextAlign();
    var textTextBaseline = textStyle.getTextBaseline();
    this.textState_ = {
      font: textFont !== undefined ?
          textFont : ol.render.canvas.defaultFont,
      textAlign: textTextAlign !== undefined ?
          textTextAlign : ol.render.canvas.defaultTextAlign,
      textBaseline: textTextBaseline !== undefined ?
          textTextBaseline : ol.render.canvas.defaultTextBaseline
    };
    this.text_ = textText !== undefined ? textText : '';
    this.textOffsetX_ =
        textOffsetX !== undefined ? (this.pixelRatio_ * textOffsetX) : 0;
    this.textOffsetY_ =
        textOffsetY !== undefined ? (this.pixelRatio_ * textOffsetY) : 0;
    this.textRotateWithView_ = textRotateWithView !== undefined ? textRotateWithView : false;
    this.textRotation_ = textRotation !== undefined ? textRotation : 0;
    this.textScale_ = this.pixelRatio_ * (textScale !== undefined ?
        textScale : 1);
  }
};
