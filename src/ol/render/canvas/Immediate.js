/**
 * @module ol/render/canvas/Immediate
 */
// FIXME test, especially polygons with holes and multipolygons
// FIXME need to handle large thick features (where pixel size matters)
// FIXME add offset and end to ol/geom/flat/transform~transform2D?

import {inherits} from '../../util.js';
import {equals} from '../../array.js';
import {asColorLike} from '../../colorlike.js';
import {intersects} from '../../extent.js';
import GeometryType from '../../geom/GeometryType.js';
import {transformGeom2D} from '../../geom/SimpleGeometry.js';
import {transform2D} from '../../geom/flat/transform.js';
import {CANVAS_LINE_DASH} from '../../has.js';
import VectorContext from '../VectorContext.js';
import {defaultTextAlign, defaultFillStyle, defaultLineCap, defaultLineDash, defaultLineDashOffset, defaultLineJoin, defaultLineWidth, defaultMiterLimit, defaultStrokeStyle, defaultTextBaseline, defaultFont} from '../canvas.js';
import {create as createTransform, compose as composeTransform} from '../../transform.js';

/**
 * @classdesc
 * A concrete subclass of {@link module:ol/render/VectorContext} that implements
 * direct rendering of features and geometries to an HTML5 Canvas context.
 * Instances of this class are created internally by the library and
 * provided to application code as vectorContext member of the
 * {@link module:ol/render/Event~RenderEvent} object associated with postcompose, precompose and
 * render events emitted by layers and maps.
 *
 * @constructor
 * @extends {module:ol/render/VectorContext}
 * @param {CanvasRenderingContext2D} context Context.
 * @param {number} pixelRatio Pixel ratio.
 * @param {module:ol/extent~Extent} extent Extent.
 * @param {module:ol/transform~Transform} transform Transform.
 * @param {number} viewRotation View rotation.
 * @struct
 */
const CanvasImmediateRenderer = function(context, pixelRatio, extent, transform, viewRotation) {
  VectorContext.call(this);

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
   * @type {module:ol/extent~Extent}
   */
  this.extent_ = extent;

  /**
   * @private
   * @type {module:ol/transform~Transform}
   */
  this.transform_ = transform;

  /**
   * @private
   * @type {number}
   */
  this.viewRotation_ = viewRotation;

  /**
   * @private
   * @type {?module:ol/render/canvas~FillState}
   */
  this.contextFillState_ = null;

  /**
   * @private
   * @type {?module:ol/render/canvas~StrokeState}
   */
  this.contextStrokeState_ = null;

  /**
   * @private
   * @type {?module:ol/render/canvas~TextState}
   */
  this.contextTextState_ = null;

  /**
   * @private
   * @type {?module:ol/render/canvas~FillState}
   */
  this.fillState_ = null;

  /**
   * @private
   * @type {?module:ol/render/canvas~StrokeState}
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
   * @type {?module:ol/render/canvas~FillState}
   */
  this.textFillState_ = null;

  /**
   * @private
   * @type {?module:ol/render/canvas~StrokeState}
   */
  this.textStrokeState_ = null;

  /**
   * @private
   * @type {?module:ol/render/canvas~TextState}
   */
  this.textState_ = null;

  /**
   * @private
   * @type {Array.<number>}
   */
  this.pixelCoordinates_ = [];

  /**
   * @private
   * @type {module:ol/transform~Transform}
   */
  this.tmpLocalTransform_ = createTransform();

};

inherits(CanvasImmediateRenderer, VectorContext);


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @private
 */
CanvasImmediateRenderer.prototype.drawImages_ = function(flatCoordinates, offset, end, stride) {
  if (!this.image_) {
    return;
  }
  const pixelCoordinates = transform2D(
    flatCoordinates, offset, end, 2, this.transform_,
    this.pixelCoordinates_);
  const context = this.context_;
  const localTransform = this.tmpLocalTransform_;
  const alpha = context.globalAlpha;
  if (this.imageOpacity_ != 1) {
    context.globalAlpha = alpha * this.imageOpacity_;
  }
  let rotation = this.imageRotation_;
  if (this.imageRotateWithView_) {
    rotation += this.viewRotation_;
  }
  for (let i = 0, ii = pixelCoordinates.length; i < ii; i += 2) {
    let x = pixelCoordinates[i] - this.imageAnchorX_;
    let y = pixelCoordinates[i + 1] - this.imageAnchorY_;
    if (this.imageSnapToPixel_) {
      x = Math.round(x);
      y = Math.round(y);
    }
    if (rotation !== 0 || this.imageScale_ != 1) {
      const centerX = x + this.imageAnchorX_;
      const centerY = y + this.imageAnchorY_;
      composeTransform(localTransform,
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
CanvasImmediateRenderer.prototype.drawText_ = function(flatCoordinates, offset, end, stride) {
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
  const pixelCoordinates = transform2D(
    flatCoordinates, offset, end, stride, this.transform_,
    this.pixelCoordinates_);
  const context = this.context_;
  let rotation = this.textRotation_;
  if (this.textRotateWithView_) {
    rotation += this.viewRotation_;
  }
  for (; offset < end; offset += stride) {
    const x = pixelCoordinates[offset] + this.textOffsetX_;
    const y = pixelCoordinates[offset + 1] + this.textOffsetY_;
    if (rotation !== 0 || this.textScale_ != 1) {
      const localTransform = composeTransform(this.tmpLocalTransform_,
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
CanvasImmediateRenderer.prototype.moveToLineTo_ = function(flatCoordinates, offset, end, stride, close) {
  const context = this.context_;
  const pixelCoordinates = transform2D(
    flatCoordinates, offset, end, stride, this.transform_,
    this.pixelCoordinates_);
  context.moveTo(pixelCoordinates[0], pixelCoordinates[1]);
  let length = pixelCoordinates.length;
  if (close) {
    length -= 2;
  }
  for (let i = 2; i < length; i += 2) {
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
CanvasImmediateRenderer.prototype.drawRings_ = function(flatCoordinates, offset, ends, stride) {
  for (let i = 0, ii = ends.length; i < ii; ++i) {
    offset = this.moveToLineTo_(flatCoordinates, offset, ends[i], stride, true);
  }
  return offset;
};


/**
 * Render a circle geometry into the canvas.  Rendering is immediate and uses
 * the current fill and stroke styles.
 *
 * @param {module:ol/geom/Circle} geometry Circle geometry.
 * @override
 * @api
 */
CanvasImmediateRenderer.prototype.drawCircle = function(geometry) {
  if (!intersects(this.extent_, geometry.getExtent())) {
    return;
  }
  if (this.fillState_ || this.strokeState_) {
    if (this.fillState_) {
      this.setContextFillState_(this.fillState_);
    }
    if (this.strokeState_) {
      this.setContextStrokeState_(this.strokeState_);
    }
    const pixelCoordinates = transformGeom2D(
      geometry, this.transform_, this.pixelCoordinates_);
    const dx = pixelCoordinates[2] - pixelCoordinates[0];
    const dy = pixelCoordinates[3] - pixelCoordinates[1];
    const radius = Math.sqrt(dx * dx + dy * dy);
    const context = this.context_;
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
 * @param {module:ol/style/Style} style The rendering style.
 * @override
 * @api
 */
CanvasImmediateRenderer.prototype.setStyle = function(style) {
  this.setFillStrokeStyle(style.getFill(), style.getStroke());
  this.setImageStyle(style.getImage());
  this.setTextStyle(style.getText());
};


/**
 * Render a geometry into the canvas.  Call
 * {@link module:ol/render/canvas/Immediate#setStyle} first to set the rendering style.
 *
 * @param {module:ol/geom/Geometry|module:ol/render/Feature} geometry The geometry to render.
 * @override
 * @api
 */
CanvasImmediateRenderer.prototype.drawGeometry = function(geometry) {
  const type = geometry.getType();
  switch (type) {
    case GeometryType.POINT:
      this.drawPoint(/** @type {module:ol/geom/Point} */ (geometry));
      break;
    case GeometryType.LINE_STRING:
      this.drawLineString(/** @type {module:ol/geom/LineString} */ (geometry));
      break;
    case GeometryType.POLYGON:
      this.drawPolygon(/** @type {module:ol/geom/Polygon} */ (geometry));
      break;
    case GeometryType.MULTI_POINT:
      this.drawMultiPoint(/** @type {module:ol/geom/MultiPoint} */ (geometry));
      break;
    case GeometryType.MULTI_LINE_STRING:
      this.drawMultiLineString(/** @type {module:ol/geom/MultiLineString} */ (geometry));
      break;
    case GeometryType.MULTI_POLYGON:
      this.drawMultiPolygon(/** @type {module:ol/geom/MultiPolygon} */ (geometry));
      break;
    case GeometryType.GEOMETRY_COLLECTION:
      this.drawGeometryCollection(/** @type {module:ol/geom/GeometryCollection} */ (geometry));
      break;
    case GeometryType.CIRCLE:
      this.drawCircle(/** @type {module:ol/geom/Circle} */ (geometry));
      break;
    default:
  }
};


/**
 * Render a feature into the canvas.  Note that any `zIndex` on the provided
 * style will be ignored - features are rendered immediately in the order that
 * this method is called.  If you need `zIndex` support, you should be using an
 * {@link module:ol/layer/Vector~VectorLayer} instead.
 *
 * @param {module:ol/Feature} feature Feature.
 * @param {module:ol/style/Style} style Style.
 * @override
 * @api
 */
CanvasImmediateRenderer.prototype.drawFeature = function(feature, style) {
  const geometry = style.getGeometryFunction()(feature);
  if (!geometry || !intersects(this.extent_, geometry.getExtent())) {
    return;
  }
  this.setStyle(style);
  this.drawGeometry(geometry);
};


/**
 * Render a GeometryCollection to the canvas.  Rendering is immediate and
 * uses the current styles appropriate for each geometry in the collection.
 *
 * @param {module:ol/geom/GeometryCollection} geometry Geometry collection.
 * @override
 */
CanvasImmediateRenderer.prototype.drawGeometryCollection = function(geometry) {
  const geometries = geometry.getGeometriesArray();
  for (let i = 0, ii = geometries.length; i < ii; ++i) {
    this.drawGeometry(geometries[i]);
  }
};


/**
 * Render a Point geometry into the canvas.  Rendering is immediate and uses
 * the current style.
 *
 * @param {module:ol/geom/Point|module:ol/render/Feature} geometry Point geometry.
 * @override
 */
CanvasImmediateRenderer.prototype.drawPoint = function(geometry) {
  const flatCoordinates = geometry.getFlatCoordinates();
  const stride = geometry.getStride();
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
 * @param {module:ol/geom/MultiPoint|module:ol/render/Feature} geometry MultiPoint geometry.
 * @override
 */
CanvasImmediateRenderer.prototype.drawMultiPoint = function(geometry) {
  const flatCoordinates = geometry.getFlatCoordinates();
  const stride = geometry.getStride();
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
 * @param {module:ol/geom/LineString|module:ol/render/Feature} geometry LineString geometry.
 * @override
 */
CanvasImmediateRenderer.prototype.drawLineString = function(geometry) {
  if (!intersects(this.extent_, geometry.getExtent())) {
    return;
  }
  if (this.strokeState_) {
    this.setContextStrokeState_(this.strokeState_);
    const context = this.context_;
    const flatCoordinates = geometry.getFlatCoordinates();
    context.beginPath();
    this.moveToLineTo_(flatCoordinates, 0, flatCoordinates.length,
      geometry.getStride(), false);
    context.stroke();
  }
  if (this.text_ !== '') {
    const flatMidpoint = geometry.getFlatMidpoint();
    this.drawText_(flatMidpoint, 0, 2, 2);
  }
};


/**
 * Render a MultiLineString geometry into the canvas.  Rendering is immediate
 * and uses the current style.
 *
 * @param {module:ol/geom/MultiLineString|module:ol/render/Feature} geometry MultiLineString geometry.
 * @override
 */
CanvasImmediateRenderer.prototype.drawMultiLineString = function(geometry) {
  const geometryExtent = geometry.getExtent();
  if (!intersects(this.extent_, geometryExtent)) {
    return;
  }
  if (this.strokeState_) {
    this.setContextStrokeState_(this.strokeState_);
    const context = this.context_;
    const flatCoordinates = geometry.getFlatCoordinates();
    let offset = 0;
    const ends = geometry.getEnds();
    const stride = geometry.getStride();
    context.beginPath();
    for (let i = 0, ii = ends.length; i < ii; ++i) {
      offset = this.moveToLineTo_(flatCoordinates, offset, ends[i], stride, false);
    }
    context.stroke();
  }
  if (this.text_ !== '') {
    const flatMidpoints = geometry.getFlatMidpoints();
    this.drawText_(flatMidpoints, 0, flatMidpoints.length, 2);
  }
};


/**
 * Render a Polygon geometry into the canvas.  Rendering is immediate and uses
 * the current style.
 *
 * @param {module:ol/geom/Polygon|module:ol/render/Feature} geometry Polygon geometry.
 * @override
 */
CanvasImmediateRenderer.prototype.drawPolygon = function(geometry) {
  if (!intersects(this.extent_, geometry.getExtent())) {
    return;
  }
  if (this.strokeState_ || this.fillState_) {
    if (this.fillState_) {
      this.setContextFillState_(this.fillState_);
    }
    if (this.strokeState_) {
      this.setContextStrokeState_(this.strokeState_);
    }
    const context = this.context_;
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
    const flatInteriorPoint = geometry.getFlatInteriorPoint();
    this.drawText_(flatInteriorPoint, 0, 2, 2);
  }
};


/**
 * Render MultiPolygon geometry into the canvas.  Rendering is immediate and
 * uses the current style.
 * @param {module:ol/geom/MultiPolygon} geometry MultiPolygon geometry.
 * @override
 */
CanvasImmediateRenderer.prototype.drawMultiPolygon = function(geometry) {
  if (!intersects(this.extent_, geometry.getExtent())) {
    return;
  }
  if (this.strokeState_ || this.fillState_) {
    if (this.fillState_) {
      this.setContextFillState_(this.fillState_);
    }
    if (this.strokeState_) {
      this.setContextStrokeState_(this.strokeState_);
    }
    const context = this.context_;
    const flatCoordinates = geometry.getOrientedFlatCoordinates();
    let offset = 0;
    const endss = geometry.getEndss();
    const stride = geometry.getStride();
    context.beginPath();
    for (let i = 0, ii = endss.length; i < ii; ++i) {
      const ends = endss[i];
      offset = this.drawRings_(flatCoordinates, offset, ends, stride);
    }
    if (this.fillState_) {
      context.fill();
    }
    if (this.strokeState_) {
      context.stroke();
    }
  }
  if (this.text_ !== '') {
    const flatInteriorPoints = geometry.getFlatInteriorPoints();
    this.drawText_(flatInteriorPoints, 0, flatInteriorPoints.length, 2);
  }
};


/**
 * @param {module:ol/render/canvas~FillState} fillState Fill state.
 * @private
 */
CanvasImmediateRenderer.prototype.setContextFillState_ = function(fillState) {
  const context = this.context_;
  const contextFillState = this.contextFillState_;
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
 * @param {module:ol/render/canvas~StrokeState} strokeState Stroke state.
 * @private
 */
CanvasImmediateRenderer.prototype.setContextStrokeState_ = function(strokeState) {
  const context = this.context_;
  const contextStrokeState = this.contextStrokeState_;
  if (!contextStrokeState) {
    context.lineCap = strokeState.lineCap;
    if (CANVAS_LINE_DASH) {
      context.setLineDash(strokeState.lineDash);
      context.lineDashOffset = strokeState.lineDashOffset;
    }
    context.lineJoin = strokeState.lineJoin;
    context.lineWidth = strokeState.lineWidth;
    context.miterLimit = strokeState.miterLimit;
    context.strokeStyle = strokeState.strokeStyle;
    this.contextStrokeState_ = {
      lineCap: strokeState.lineCap,
      lineDash: strokeState.lineDash,
      lineDashOffset: strokeState.lineDashOffset,
      lineJoin: strokeState.lineJoin,
      lineWidth: strokeState.lineWidth,
      miterLimit: strokeState.miterLimit,
      strokeStyle: strokeState.strokeStyle
    };
  } else {
    if (contextStrokeState.lineCap != strokeState.lineCap) {
      contextStrokeState.lineCap = context.lineCap = strokeState.lineCap;
    }
    if (CANVAS_LINE_DASH) {
      if (!equals(contextStrokeState.lineDash, strokeState.lineDash)) {
        context.setLineDash(contextStrokeState.lineDash = strokeState.lineDash);
      }
      if (contextStrokeState.lineDashOffset != strokeState.lineDashOffset) {
        contextStrokeState.lineDashOffset = context.lineDashOffset =
            strokeState.lineDashOffset;
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
 * @param {module:ol/render/canvas~TextState} textState Text state.
 * @private
 */
CanvasImmediateRenderer.prototype.setContextTextState_ = function(textState) {
  const context = this.context_;
  const contextTextState = this.contextTextState_;
  const textAlign = textState.textAlign ?
    textState.textAlign : defaultTextAlign;
  if (!contextTextState) {
    context.font = textState.font;
    context.textAlign = textAlign;
    context.textBaseline = textState.textBaseline;
    this.contextTextState_ = {
      font: textState.font,
      textAlign: textAlign,
      textBaseline: textState.textBaseline
    };
  } else {
    if (contextTextState.font != textState.font) {
      contextTextState.font = context.font = textState.font;
    }
    if (contextTextState.textAlign != textAlign) {
      contextTextState.textAlign = context.textAlign = textAlign;
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
 * @param {module:ol/style/Fill} fillStyle Fill style.
 * @param {module:ol/style/Stroke} strokeStyle Stroke style.
 * @override
 */
CanvasImmediateRenderer.prototype.setFillStrokeStyle = function(fillStyle, strokeStyle) {
  if (!fillStyle) {
    this.fillState_ = null;
  } else {
    const fillStyleColor = fillStyle.getColor();
    this.fillState_ = {
      fillStyle: asColorLike(fillStyleColor ?
        fillStyleColor : defaultFillStyle)
    };
  }
  if (!strokeStyle) {
    this.strokeState_ = null;
  } else {
    const strokeStyleColor = strokeStyle.getColor();
    const strokeStyleLineCap = strokeStyle.getLineCap();
    const strokeStyleLineDash = strokeStyle.getLineDash();
    const strokeStyleLineDashOffset = strokeStyle.getLineDashOffset();
    const strokeStyleLineJoin = strokeStyle.getLineJoin();
    const strokeStyleWidth = strokeStyle.getWidth();
    const strokeStyleMiterLimit = strokeStyle.getMiterLimit();
    this.strokeState_ = {
      lineCap: strokeStyleLineCap !== undefined ?
        strokeStyleLineCap : defaultLineCap,
      lineDash: strokeStyleLineDash ?
        strokeStyleLineDash : defaultLineDash,
      lineDashOffset: strokeStyleLineDashOffset ?
        strokeStyleLineDashOffset : defaultLineDashOffset,
      lineJoin: strokeStyleLineJoin !== undefined ?
        strokeStyleLineJoin : defaultLineJoin,
      lineWidth: this.pixelRatio_ * (strokeStyleWidth !== undefined ?
        strokeStyleWidth : defaultLineWidth),
      miterLimit: strokeStyleMiterLimit !== undefined ?
        strokeStyleMiterLimit : defaultMiterLimit,
      strokeStyle: asColorLike(strokeStyleColor ?
        strokeStyleColor : defaultStrokeStyle)
    };
  }
};


/**
 * Set the image style for subsequent draw operations.  Pass null to remove
 * the image style.
 *
 * @param {module:ol/style/Image} imageStyle Image style.
 * @override
 */
CanvasImmediateRenderer.prototype.setImageStyle = function(imageStyle) {
  if (!imageStyle) {
    this.image_ = null;
  } else {
    const imageAnchor = imageStyle.getAnchor();
    // FIXME pixel ratio
    const imageImage = imageStyle.getImage(1);
    const imageOrigin = imageStyle.getOrigin();
    const imageSize = imageStyle.getSize();
    this.imageAnchorX_ = imageAnchor[0];
    this.imageAnchorY_ = imageAnchor[1];
    this.imageHeight_ = imageSize[1];
    this.image_ = imageImage;
    this.imageOpacity_ = imageStyle.getOpacity();
    this.imageOriginX_ = imageOrigin[0];
    this.imageOriginY_ = imageOrigin[1];
    this.imageRotateWithView_ = imageStyle.getRotateWithView();
    this.imageRotation_ = imageStyle.getRotation();
    this.imageScale_ = imageStyle.getScale() * this.pixelRatio_;
    this.imageSnapToPixel_ = imageStyle.getSnapToPixel();
    this.imageWidth_ = imageSize[0];
  }
};


/**
 * Set the text style for subsequent draw operations.  Pass null to
 * remove the text style.
 *
 * @param {module:ol/style/Text} textStyle Text style.
 * @override
 */
CanvasImmediateRenderer.prototype.setTextStyle = function(textStyle) {
  if (!textStyle) {
    this.text_ = '';
  } else {
    const textFillStyle = textStyle.getFill();
    if (!textFillStyle) {
      this.textFillState_ = null;
    } else {
      const textFillStyleColor = textFillStyle.getColor();
      this.textFillState_ = {
        fillStyle: asColorLike(textFillStyleColor ?
          textFillStyleColor : defaultFillStyle)
      };
    }
    const textStrokeStyle = textStyle.getStroke();
    if (!textStrokeStyle) {
      this.textStrokeState_ = null;
    } else {
      const textStrokeStyleColor = textStrokeStyle.getColor();
      const textStrokeStyleLineCap = textStrokeStyle.getLineCap();
      const textStrokeStyleLineDash = textStrokeStyle.getLineDash();
      const textStrokeStyleLineDashOffset = textStrokeStyle.getLineDashOffset();
      const textStrokeStyleLineJoin = textStrokeStyle.getLineJoin();
      const textStrokeStyleWidth = textStrokeStyle.getWidth();
      const textStrokeStyleMiterLimit = textStrokeStyle.getMiterLimit();
      this.textStrokeState_ = {
        lineCap: textStrokeStyleLineCap !== undefined ?
          textStrokeStyleLineCap : defaultLineCap,
        lineDash: textStrokeStyleLineDash ?
          textStrokeStyleLineDash : defaultLineDash,
        lineDashOffset: textStrokeStyleLineDashOffset ?
          textStrokeStyleLineDashOffset : defaultLineDashOffset,
        lineJoin: textStrokeStyleLineJoin !== undefined ?
          textStrokeStyleLineJoin : defaultLineJoin,
        lineWidth: textStrokeStyleWidth !== undefined ?
          textStrokeStyleWidth : defaultLineWidth,
        miterLimit: textStrokeStyleMiterLimit !== undefined ?
          textStrokeStyleMiterLimit : defaultMiterLimit,
        strokeStyle: asColorLike(textStrokeStyleColor ?
          textStrokeStyleColor : defaultStrokeStyle)
      };
    }
    const textFont = textStyle.getFont();
    const textOffsetX = textStyle.getOffsetX();
    const textOffsetY = textStyle.getOffsetY();
    const textRotateWithView = textStyle.getRotateWithView();
    const textRotation = textStyle.getRotation();
    const textScale = textStyle.getScale();
    const textText = textStyle.getText();
    const textTextAlign = textStyle.getTextAlign();
    const textTextBaseline = textStyle.getTextBaseline();
    this.textState_ = {
      font: textFont !== undefined ?
        textFont : defaultFont,
      textAlign: textTextAlign !== undefined ?
        textTextAlign : defaultTextAlign,
      textBaseline: textTextBaseline !== undefined ?
        textTextBaseline : defaultTextBaseline
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
export default CanvasImmediateRenderer;
