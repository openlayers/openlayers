goog.provide('ol.render.canvas.TextReplay');

goog.require('ol');
goog.require('ol.colorlike');
goog.require('ol.has');
goog.require('ol.render.canvas');
goog.require('ol.render.canvas.Instruction');
goog.require('ol.render.canvas.Replay');
goog.require('ol.render.replay');
goog.require('ol.structs.LRUCache');


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
 * @param {Array.<string>} lines Lines to measure.
 * @param {Array.<number>} widths Array will be populated with the widths of
 * each line.
 * @return {ol.Size} Measuremnt.
 */
ol.render.canvas.TextReplay.measureText = (function() {
  var textContainer;
  return function(font, lines, widths) {
    if (!textContainer) {
      textContainer = document.createElement('span');
      textContainer.style.visibility = 'hidden';
      textContainer.style.whiteSpace = 'nowrap';
    }
    textContainer.style.font = font;
    document.body.appendChild(textContainer);
    var numLines = lines.length;
    var width = 0;
    var currentWidth, i;
    for (i = 0; i < numLines; ++i) {
      textContainer.textContent = lines[i];
      currentWidth = textContainer.offsetWidth;
      width = Math.max(width, currentWidth);
      widths.push(currentWidth);
    }
    var measurement = [width, textContainer.offsetHeight * numLines];
    document.body.removeChild(textContainer);
    return measurement;
  };
})();


/**
 * @inheritDoc
 */
ol.render.canvas.TextReplay.prototype.drawText = function(flatCoordinates, offset, end, stride, geometry, feature) {
  var fillState = this.textFillState_;
  var strokeState = this.textStrokeState_;
  var textState = this.textState_;
  if (this.text_ === '' || !textState || (!fillState && !strokeState)) {
    return;
  }
  this.beginGeometry(geometry, feature);

  var myBegin = this.coordinates.length;
  var myEnd =
      this.appendFlatCoordinates(flatCoordinates, offset, end, stride, false, false);
  var fill = !!fillState;
  var stroke = !!strokeState;
  var pixelRatio = this.pixelRatio;
  var textAlign = textState.textAlign;
  var align = ol.render.replay.TEXT_ALIGN[textAlign];
  var textBaseline = textState.textBaseline;
  var baseline = ol.render.replay.TEXT_ALIGN[textBaseline];
  var strokeWidth = stroke && strokeState.lineWidth ? strokeState.lineWidth : 0;

  var label;
  var text = this.text_;
  var key =
    (stroke ?
      (typeof strokeState.strokeStyle == 'string' ? strokeState.strokeStyle : ol.getUid(strokeState.strokeStyle)) +
      strokeState.lineCap + strokeState.lineDashOffset + '|' + strokeWidth +
      strokeState.lineJoin + strokeState.miterLimit +
      '[' + strokeState.lineDash.join() + ']' : '') +
    textState.font + textAlign + text +
    (fill ?
      (typeof fillState.fillStyle == 'string' ? fillState.fillStyle : ('|' + ol.getUid(fillState.fillStyle))) : '');

  var lines = text.split('\n');
  var numLines = lines.length;

  if (!ol.render.canvas.TextReplay.labelCache_.containsKey(key)) {
    label = /** @type {HTMLCanvasElement} */ (document.createElement('canvas'));
    ol.render.canvas.TextReplay.labelCache_.set(key, label);
    var context = label.getContext('2d');
    var widths = [];
    var metrics = ol.render.canvas.TextReplay.measureText(textState.font, lines, widths);
    var lineHeight = metrics[1] / numLines;
    label.width = Math.ceil(metrics[0] + 2 * strokeWidth) * pixelRatio;
    label.height = Math.ceil(metrics[1] + 2 * strokeWidth) * pixelRatio;
    context.scale(pixelRatio, pixelRatio);
    context.font = textState.font;
    if (stroke) {
      context.strokeStyle = strokeState.strokeStyle;
      context.lineWidth = strokeState.lineWidth;
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
    context.textAlign = 'left';
    var x = align * label.width / pixelRatio + 2 * (0.5 - align) * strokeWidth;
    var i;
    if (stroke) {
      for (i = 0; i < numLines; ++i) {
        context.strokeText(lines[i], x - align * widths[i], strokeWidth + i * lineHeight);
      }
    }
    if (fill) {
      for (i = 0; i < numLines; ++i) {
        context.fillText(lines[i], x - align * widths[i], strokeWidth + i * lineHeight);
      }
    }
  }
  label = ol.render.canvas.TextReplay.labelCache_.get(key);

  var anchorX = align * label.width / pixelRatio + 2 * (0.5 - align) * strokeWidth;
  var anchorY = baseline * label.height / pixelRatio + 2 * (0.5 - baseline) * strokeWidth;

  var drawTextInstruction = [
    ol.render.canvas.Instruction.DRAW_IMAGE, myBegin, myEnd, label,
    anchorX - this.textOffsetX_ * pixelRatio, anchorY - this.textOffsetY_ * pixelRatio,
    label.height, 1, 0, 0, this.textRotateWithView_, this.textRotation_,
    this.textScale_ / pixelRatio, //FIXME missing HiDPI support in DRAW_IMAGE
    true, label.width
  ];

  this.instructions.push(drawTextInstruction);
  this.hitDetectionInstructions.push(drawTextInstruction);

  this.endGeometry(geometry, feature);
};


/**
 * @inheritDoc
 */
ol.render.canvas.TextReplay.prototype.setTextStyle = function(textStyle) {
  if (!textStyle) {
    this.text_ = '';
  } else {
    var textFillStyle = textStyle.getFill();
    if (!textFillStyle) {
      this.textFillState_ = null;
    } else {
      var textFillStyleColor = textFillStyle.getColor();
      var fillStyle = ol.colorlike.asColorLike(textFillStyleColor ?
        textFillStyleColor : ol.render.canvas.defaultFillStyle);
      if (!this.textFillState_) {
        this.textFillState_ = {
          fillStyle: fillStyle
        };
      } else {
        var textFillState = this.textFillState_;
        textFillState.fillStyle = fillStyle;
      }
    }
    var textStrokeStyle = textStyle.getStroke();
    if (!textStrokeStyle) {
      this.textStrokeState_ = null;
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
      if (!this.textStrokeState_) {
        this.textStrokeState_ = {
          lineCap: lineCap,
          lineDash: lineDash,
          lineDashOffset: lineDashOffset,
          lineJoin: lineJoin,
          lineWidth: lineWidth,
          miterLimit: miterLimit,
          strokeStyle: strokeStyle
        };
      } else {
        var textStrokeState = this.textStrokeState_;
        textStrokeState.lineCap = lineCap;
        textStrokeState.lineDash = lineDash;
        textStrokeState.lineDashOffset = lineDashOffset;
        textStrokeState.lineJoin = lineJoin;
        textStrokeState.lineWidth = lineWidth;
        textStrokeState.miterLimit = miterLimit;
        textStrokeState.strokeStyle = strokeStyle;
      }
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
    var textAlign = textTextAlign !== undefined ?
      textTextAlign : ol.render.canvas.defaultTextAlign;
    var textBaseline = textTextBaseline !== undefined ?
      textTextBaseline : ol.render.canvas.defaultTextBaseline;
    if (!this.textState_) {
      this.textState_ = {
        font: font,
        textAlign: textAlign,
        textBaseline: textBaseline
      };
    } else {
      var textState = this.textState_;
      textState.font = font;
      textState.textAlign = textAlign;
      textState.textBaseline = textBaseline;
    }
    this.text_ = textText !== undefined ? textText : '';
    this.textOffsetX_ = textOffsetX !== undefined ? textOffsetX : 0;
    this.textOffsetY_ = textOffsetY !== undefined ? textOffsetY : 0;
    this.textRotateWithView_ = textRotateWithView !== undefined ? textRotateWithView : false;
    this.textRotation_ = textRotation !== undefined ? textRotation : 0;
    this.textScale_ = textScale !== undefined ? textScale : 1;
  }
};
