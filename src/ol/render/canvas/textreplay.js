goog.provide('ol.render.canvas.TextReplay');

goog.require('ol');
goog.require('ol.colorlike');
goog.require('ol.dom');
goog.require('ol.geom.flat.straightchunk');
goog.require('ol.geom.GeometryType');
goog.require('ol.has');
goog.require('ol.render.canvas');
goog.require('ol.render.canvas.Instruction');
goog.require('ol.render.canvas.Replay');
goog.require('ol.render.replay');
goog.require('ol.structs.LRUCache');
goog.require('ol.style.TextPlacement');


/**
 * @constructor
 * @extends {ol.render.canvas.Replay}
 * @param {number} tolerance Tolerance.
 * @param {ol.Extent} maxExtent Maximum extent.
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @param {boolean} overlaps The replay can have overlapping geometries.
 * @struct
 */
ol.render.canvas.TextReplay = function(tolerance, maxExtent, resolution, pixelRatio, overlaps) {

  ol.render.canvas.Replay.call(this, tolerance, maxExtent, resolution, pixelRatio, overlaps);

  /**
   * @private
   * @type {Array.<HTMLCanvasElement>}
   */
  this.labels_ = null;

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
   * @type {boolean|undefined}
   */
  this.textRotateWithView_ = undefined;

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
   * @type {string}
   */
  this.textKey_ = '';

  /**
   * @private
   * @type {string}
   */
  this.fillKey_ = '';

  /**
   * @private
   * @type {string}
   */
  this.strokeKey_ = '';

  while (ol.render.canvas.TextReplay.labelCache_.canExpireCache()) {
    ol.render.canvas.TextReplay.labelCache_.pop();
  }

};
ol.inherits(ol.render.canvas.TextReplay, ol.render.canvas.Replay);


/**
 * @private
 * @type {ol.structs.LRUCache.<HTMLCanvasElement>}
 */
ol.render.canvas.TextReplay.labelCache_ = new ol.structs.LRUCache();


/**
 * @param {string} font Font to use for measuring.
 * @return {ol.Size} Measurement.
 */
ol.render.canvas.TextReplay.measureTextHeight = (function() {
  var textContainer;
  return function(font, lines, widths) {
    if (!textContainer) {
      textContainer = document.createElement('span');
      textContainer.textContent = 'M';
      textContainer.style.visibility = 'hidden';
      textContainer.style.whiteSpace = 'nowrap';
    }
    textContainer.style.font = font;
    document.body.appendChild(textContainer);
    var height = textContainer.offsetHeight;
    document.body.removeChild(textContainer);
    return height;
  };
})();


/**
 * @this {Object}
 * @param {CanvasRenderingContext2D} context Context.
 * @param {number} pixelRatio Pixel ratio.
 * @param {string} text Text.
 * @return {number} Width.
 */
ol.render.canvas.TextReplay.getTextWidth = function(context, pixelRatio, text) {
  var width = this[text];
  if (!width) {
    this[text] = width = context.measureText(text).width;
  }
  return width * pixelRatio;
};


/**
 * @param {string} font Font to use for measuring.
 * @param {Array.<string>} lines Lines to measure.
 * @param {Array.<number>} widths Array will be populated with the widths of
 * each line.
 * @return {number} Width of the whole text.
 */
ol.render.canvas.TextReplay.measureTextWidths = (function() {
  var context;
  return function(font, lines, widths) {
    if (!context) {
      context = ol.dom.createCanvasContext2D(1, 1);
    }
    context.font = font;
    var numLines = lines.length;
    var width = 0;
    var currentWidth, i;
    for (i = 0; i < numLines; ++i) {
      currentWidth = context.measureText(lines[i]).width;
      width = Math.max(width, currentWidth);
      widths.push(currentWidth);
    }
    return width;
  };
})();


/**
 * @inheritDoc
 */
ol.render.canvas.TextReplay.prototype.drawText = function(geometry, feature) {
  var fillState = this.textFillState_;
  var strokeState = this.textStrokeState_;
  var textState = this.textState_;
  if (this.text_ === '' || !textState || (!fillState && !strokeState)) {
    return;
  }

  var begin = this.coordinates.length;

  var geometryType = geometry.getType();
  var flatCoordinates = null;
  var end = 2;
  var stride = 2;
  var i, ii;

  if (this.textState_.placement === ol.style.TextPlacement.LINE) {
    var ends;
    flatCoordinates = geometry.getFlatCoordinates();
    stride = geometry.getStride();
    if (geometryType == ol.geom.GeometryType.LINE_STRING) {
      ends = [flatCoordinates.length];
    } else if (geometryType == ol.geom.GeometryType.MULTI_LINE_STRING) {
      ends = geometry.getEnds();
    } else if (geometryType == ol.geom.GeometryType.POLYGON) {
      ends = geometry.getEnds().slice(0, 1);
    } else if (geometryType == ol.geom.GeometryType.MULTI_POLYGON) {
      var endss = geometry.getEndss();
      ends = [];
      for (i = 0, ii = endss.length; i < ii; ++i) {
        ends.push(endss[i][0]);
      }
    }
    this.beginGeometry(geometry, feature);
    var textAlign = textState.textAlign;
    var flatOffset = 0;
    var flatEnd;
    for (var o = 0, oo = ends.length; o < oo; ++o) {
      if (textAlign == undefined) {
        var range = ol.geom.flat.straightchunk.lineString(
            textState.maxAngle, flatCoordinates, flatOffset, ends[o], stride);
        flatOffset = range[0];
        flatEnd = range[1];
      } else {
        flatEnd = ends[o];
      }
      end = this.appendFlatCoordinates(flatCoordinates, flatOffset, flatEnd, stride, false, false);
      flatOffset = ends[o];
      this.drawChars_(begin, end);
      begin = end;
    }
    this.endGeometry(geometry, feature);

  } else {
    var label = this.getImage_(this.text_, !!this.textFillState_, !!this.textStrokeState_);
    var width = label.width / this.pixelRatio;
    switch (geometryType) {
      case ol.geom.GeometryType.POINT:
      case ol.geom.GeometryType.MULTI_POINT:
        flatCoordinates = geometry.getFlatCoordinates();
        end = flatCoordinates.length;
        break;
      case ol.geom.GeometryType.LINE_STRING:
        flatCoordinates = /** @type {ol.geom.LineString} */ (geometry).getFlatMidpoint();
        break;
      case ol.geom.GeometryType.CIRCLE:
        flatCoordinates = /** @type {ol.geom.Circle} */ (geometry).getCenter();
        break;
      case ol.geom.GeometryType.MULTI_LINE_STRING:
        flatCoordinates = /** @type {ol.geom.MultiLineString} */ (geometry).getFlatMidpoints();
        end = flatCoordinates.length;
        break;
      case ol.geom.GeometryType.POLYGON:
        flatCoordinates = /** @type {ol.geom.Polygon} */ (geometry).getFlatInteriorPoint();
        if (!textState.exceedLength && flatCoordinates[2] / this.resolution < width) {
          return;
        }
        stride = 3;
        break;
      case ol.geom.GeometryType.MULTI_POLYGON:
        var interiorPoints = /** @type {ol.geom.MultiPolygon} */ (geometry).getFlatInteriorPoints();
        flatCoordinates = [];
        for (i = 0, ii = interiorPoints.length; i < ii; i += 3) {
          if (textState.exceedLength || interiorPoints[i + 2] / this.resolution >= width) {
            flatCoordinates.push(interiorPoints[i], interiorPoints[i + 1]);
          }
        }
        end = flatCoordinates.length;
        if (end == 0) {
          return;
        }
        break;
      default:
    }
    end = this.appendFlatCoordinates(flatCoordinates, 0, end, stride, false, false);
    this.beginGeometry(geometry, feature);
    this.drawTextImage_(label, begin, end);
    this.endGeometry(geometry, feature);
  }
};


/**
 * @private
 * @param {string} text Text.
 * @param {boolean} fill Fill.
 * @param {boolean} stroke Stroke.
 * @return {HTMLCanvasElement} Image.
 */
ol.render.canvas.TextReplay.prototype.getImage_ = function(text, fill, stroke) {
  var label;
  var key = (stroke ? this.strokeKey_ : '') + this.textKey_ + text + (fill ? this.fillKey_ : '');

  var lines = text.split('\n');
  var numLines = lines.length;
  if (!ol.render.canvas.TextReplay.labelCache_.containsKey(key)) {
    var strokeState = this.textStrokeState_;
    var fillState = this.textFillState_;
    var textState = this.textState_;
    var pixelRatio = this.pixelRatio;
    var scale = this.textScale_ * pixelRatio;
    var align =  ol.render.replay.TEXT_ALIGN[textState.textAlign || ol.render.canvas.defaultTextAlign];
    var strokeWidth = stroke && strokeState.lineWidth ? strokeState.lineWidth : 0;

    var widths = [];
    var width = ol.render.canvas.TextReplay.measureTextWidths(textState.font, lines, widths);
    var lineHeight = ol.render.canvas.TextReplay.measureTextHeight(textState.font);
    var height = lineHeight * numLines;
    var renderWidth = (width + strokeWidth);
    var context = ol.dom.createCanvasContext2D(
        Math.ceil(renderWidth * scale),
        Math.ceil((height + strokeWidth) * scale));
    label = context.canvas;
    ol.render.canvas.TextReplay.labelCache_.set(key, label);
    context.scale(scale, scale);
    context.font = textState.font;
    if (stroke) {
      context.strokeStyle = strokeState.strokeStyle;
      context.lineWidth = strokeWidth * (ol.has.SAFARI ? scale : 1);
      context.lineCap = strokeState.lineCap;
      context.lineJoin = strokeState.lineJoin;
      context.miterLimit = strokeState.miterLimit;
      if (ol.has.CANVAS_LINE_DASH) {
        context.setLineDash(strokeState.lineDash);
        context.lineDashOffset = strokeState.lineDashOffset;
      }
    }
    if (fill) {
      context.fillStyle = fillState.fillStyle;
    }
    context.textBaseline = 'top';
    context.textAlign = 'center';
    var leftRight = (0.5 - align);
    var x = align * label.width / scale + leftRight * strokeWidth;
    var i;
    if (stroke) {
      for (i = 0; i < numLines; ++i) {
        context.strokeText(lines[i], x + leftRight * widths[i], 0.5 * strokeWidth + i * lineHeight);
      }
    }
    if (fill) {
      for (i = 0; i < numLines; ++i) {
        context.fillText(lines[i], x + leftRight * widths[i], 0.5 * strokeWidth + i * lineHeight);
      }
    }
  }
  return ol.render.canvas.TextReplay.labelCache_.get(key);
};


/**
 * @private
 * @param {HTMLCanvasElement} label Label.
 * @param {number} begin Begin.
 * @param {number} end End.
 */
ol.render.canvas.TextReplay.prototype.drawTextImage_ = function(label, begin, end) {
  var textState = this.textState_;
  var strokeState = this.textStrokeState_;
  var pixelRatio = this.pixelRatio;
  var align = ol.render.replay.TEXT_ALIGN[textState.textAlign || ol.render.canvas.defaultTextAlign];
  var baseline = ol.render.replay.TEXT_ALIGN[textState.textBaseline];
  var strokeWidth = strokeState && strokeState.lineWidth ? strokeState.lineWidth : 0;

  var anchorX = align * label.width / pixelRatio + 2 * (0.5 - align) * strokeWidth;
  var anchorY = baseline * label.height / pixelRatio + 2 * (0.5 - baseline) * strokeWidth;
  this.instructions.push([ol.render.canvas.Instruction.DRAW_IMAGE, begin, end,
    label, (anchorX - this.textOffsetX_) * pixelRatio, (anchorY - this.textOffsetY_) * pixelRatio,
    label.height, 1, 0, 0, this.textRotateWithView_, this.textRotation_,
    1, true, label.width
  ]);
  this.hitDetectionInstructions.push([ol.render.canvas.Instruction.DRAW_IMAGE, begin, end,
    label, (anchorX - this.textOffsetX_) * pixelRatio, (anchorY - this.textOffsetY_) * pixelRatio,
    label.height, 1, 0, 0, this.textRotateWithView_, this.textRotation_,
    1 / pixelRatio, true, label.width
  ]);
};


/**
 * @private
 * @param {number} begin Begin.
 * @param {number} end End.
 */
ol.render.canvas.TextReplay.prototype.drawChars_ = function(begin, end) {
  var pixelRatio = this.pixelRatio;
  var strokeState = this.textStrokeState_;
  var fill = !!this.textFillState_;
  var stroke = !!strokeState;
  var textState = this.textState_;
  var baseline = ol.render.replay.TEXT_ALIGN[textState.textBaseline];

  var labels = [];
  var text = this.text_;
  var numChars = this.text_.length;
  var i;

  if (stroke) {
    for (i = 0; i < numChars; ++i) {
      labels.push(this.getImage_(text.charAt(i), false, stroke));
    }
  }
  if (fill) {
    for (i = 0; i < numChars; ++i) {
      labels.push(this.getImage_(text.charAt(i), fill, false));
    }
  }

  var context = labels[0].getContext('2d');
  var offsetY = this.textOffsetY_ * pixelRatio;
  var align = ol.render.replay.TEXT_ALIGN[textState.textAlign || ol.render.canvas.defaultTextAlign];
  var widths = {};
  this.instructions.push([ol.render.canvas.Instruction.DRAW_CHARS,
    begin, end, labels, baseline,
    textState.exceedLength, textState.maxAngle,
    ol.render.canvas.TextReplay.getTextWidth.bind(widths, context, pixelRatio * this.textScale_),
    offsetY, this.text_, align, 1
  ]);
  this.hitDetectionInstructions.push([ol.render.canvas.Instruction.DRAW_CHARS,
    begin, end, labels, baseline,
    textState.exceedLength, textState.maxAngle,
    ol.render.canvas.TextReplay.getTextWidth.bind(widths, context, this.textScale_),
    offsetY, this.text_, align, 1 / pixelRatio
  ]);
};


/**
 * @inheritDoc
 */
ol.render.canvas.TextReplay.prototype.setTextStyle = function(textStyle) {
  var textState, fillState, strokeState;
  if (!textStyle) {
    this.text_ = '';
  } else {
    var textFillStyle = textStyle.getFill();
    if (!textFillStyle) {
      fillState = this.textFillState_ = null;
    } else {
      var textFillStyleColor = textFillStyle.getColor();
      var fillStyle = ol.colorlike.asColorLike(textFillStyleColor ?
        textFillStyleColor : ol.render.canvas.defaultFillStyle);
      fillState = this.textFillState_;
      if (!fillState) {
        fillState = this.textFillState_ = /** @type {ol.CanvasFillState} */ ({});
      }
      fillState.fillStyle = fillStyle;
    }
    var textStrokeStyle = textStyle.getStroke();
    if (!textStrokeStyle) {
      strokeState = this.textStrokeState_ = null;
    } else {
      var textStrokeStyleColor = textStrokeStyle.getColor();
      var textStrokeStyleLineCap = textStrokeStyle.getLineCap();
      var textStrokeStyleLineDash = textStrokeStyle.getLineDash();
      var textStrokeStyleLineDashOffset = textStrokeStyle.getLineDashOffset();
      var textStrokeStyleLineJoin = textStrokeStyle.getLineJoin();
      var textStrokeStyleWidth = textStrokeStyle.getWidth();
      var textStrokeStyleMiterLimit = textStrokeStyle.getMiterLimit();
      var lineCap = textStrokeStyleLineCap !== undefined ?
        textStrokeStyleLineCap : ol.render.canvas.defaultLineCap;
      var lineDash = textStrokeStyleLineDash ?
        textStrokeStyleLineDash.slice() : ol.render.canvas.defaultLineDash;
      var lineDashOffset = textStrokeStyleLineDashOffset !== undefined ?
        textStrokeStyleLineDashOffset : ol.render.canvas.defaultLineDashOffset;
      var lineJoin = textStrokeStyleLineJoin !== undefined ?
        textStrokeStyleLineJoin : ol.render.canvas.defaultLineJoin;
      var lineWidth = textStrokeStyleWidth !== undefined ?
        textStrokeStyleWidth : ol.render.canvas.defaultLineWidth;
      var miterLimit = textStrokeStyleMiterLimit !== undefined ?
        textStrokeStyleMiterLimit : ol.render.canvas.defaultMiterLimit;
      var strokeStyle = ol.colorlike.asColorLike(textStrokeStyleColor ?
        textStrokeStyleColor : ol.render.canvas.defaultStrokeStyle);
      strokeState = this.textStrokeState_;
      if (!strokeState) {
        strokeState = this.textStrokeState_ = /** @type {ol.CanvasStrokeState} */ ({});
      }
      strokeState.lineCap = lineCap;
      strokeState.lineDash = lineDash;
      strokeState.lineDashOffset = lineDashOffset;
      strokeState.lineJoin = lineJoin;
      strokeState.lineWidth = lineWidth;
      strokeState.miterLimit = miterLimit;
      strokeState.strokeStyle = strokeStyle;
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
    var font = textFont !== undefined ?
      textFont : ol.render.canvas.defaultFont;
    var textAlign = textTextAlign;
    var textBaseline = textTextBaseline !== undefined ?
      textTextBaseline : ol.render.canvas.defaultTextBaseline;
    textState = this.textState_;
    if (!textState) {
      textState = this.textState_ = /** @type {ol.CanvasTextState} */ ({});
    }
    textState.exceedLength = textStyle.getExceedLength();
    textState.font = font;
    textState.maxAngle = textStyle.getMaxAngle();
    textState.placement = textStyle.getPlacement();
    textState.textAlign = textAlign;
    textState.textBaseline = textBaseline;

    this.text_ = textText !== undefined ? textText : '';
    this.textOffsetX_ = textOffsetX !== undefined ? textOffsetX : 0;
    this.textOffsetY_ = textOffsetY !== undefined ? textOffsetY : 0;
    this.textRotateWithView_ = textRotateWithView !== undefined ? textRotateWithView : false;
    this.textRotation_ = textRotation !== undefined ? textRotation : 0;
    this.textScale_ = textScale !== undefined ? textScale : 1;

    this.strokeKey_ = strokeState ?
      (typeof strokeState.strokeStyle == 'string' ? strokeState.strokeStyle : ol.getUid(strokeState.strokeStyle)) +
      strokeState.lineCap + strokeState.lineDashOffset + '|' + strokeState.lineWidth +
      strokeState.lineJoin + strokeState.miterLimit + '[' + strokeState.lineDash.join() + ']' :
      '';
    this.textKey_ = textState.font + (textState.textAlign || '?') + this.textScale_;
    this.fillKey_ = fillState ?
      (typeof fillState.fillStyle == 'string' ? fillState.fillStyle : ('|' + ol.getUid(fillState.fillStyle))) :
      '';
  }
};
