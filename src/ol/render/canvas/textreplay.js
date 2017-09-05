import _ol_ from '../../index';
import _ol_colorlike_ from '../../colorlike';
import _ol_has_ from '../../has';
import _ol_render_canvas_ from '../canvas';
import _ol_render_canvas_Instruction_ from '../canvas/instruction';
import _ol_render_canvas_Replay_ from '../canvas/replay';
import _ol_render_replay_ from '../replay';
import _ol_structs_LRUCache_ from '../../structs/lrucache';

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
var _ol_render_canvas_TextReplay_ = function(tolerance, maxExtent, resolution, pixelRatio, overlaps) {

  _ol_render_canvas_Replay_.call(this, tolerance, maxExtent, resolution, pixelRatio, overlaps);

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

  while (_ol_render_canvas_TextReplay_.labelCache_.canExpireCache()) {
    _ol_render_canvas_TextReplay_.labelCache_.pop();
  }

};

_ol_.inherits(_ol_render_canvas_TextReplay_, _ol_render_canvas_Replay_);


/**
 * @private
 * @type {ol.structs.LRUCache.<HTMLCanvasElement>}
 */
_ol_render_canvas_TextReplay_.labelCache_ = new _ol_structs_LRUCache_();


/**
 * @param {string} font Font to use for measuring.
 * @param {Array.<string>} lines Lines to measure.
 * @param {Array.<number>} widths Array will be populated with the widths of
 * each line.
 * @return {ol.Size} Measuremnt.
 */
_ol_render_canvas_TextReplay_.measureText = (function() {
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
_ol_render_canvas_TextReplay_.prototype.drawText = function(flatCoordinates, offset, end, stride, geometry, feature) {
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
  var align = _ol_render_replay_.TEXT_ALIGN[textAlign];
  var textBaseline = textState.textBaseline;
  var baseline = _ol_render_replay_.TEXT_ALIGN[textBaseline];
  var strokeWidth = stroke && strokeState.lineWidth ? strokeState.lineWidth : 0;

  var label;
  var text = this.text_;
  var key =
    (stroke ?
      (typeof strokeState.strokeStyle == 'string' ? strokeState.strokeStyle : _ol_.getUid(strokeState.strokeStyle)) +
      strokeState.lineCap + strokeState.lineDashOffset + '|' + strokeWidth +
      strokeState.lineJoin + strokeState.miterLimit +
      '[' + strokeState.lineDash.join() + ']' : '') +
    textState.font + textAlign + text +
    (fill ?
      (typeof fillState.fillStyle == 'string' ? fillState.fillStyle : ('|' + _ol_.getUid(fillState.fillStyle))) : '');

  var lines = text.split('\n');
  var numLines = lines.length;

  if (!_ol_render_canvas_TextReplay_.labelCache_.containsKey(key)) {
    label = /** @type {HTMLCanvasElement} */ (document.createElement('canvas'));
    _ol_render_canvas_TextReplay_.labelCache_.set(key, label);
    var context = label.getContext('2d');
    var widths = [];
    var metrics = _ol_render_canvas_TextReplay_.measureText(textState.font, lines, widths);
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
      if (_ol_has_.CANVAS_LINE_DASH) {
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
  label = _ol_render_canvas_TextReplay_.labelCache_.get(key);

  var anchorX = align * label.width / pixelRatio + 2 * (0.5 - align) * strokeWidth;
  var anchorY = baseline * label.height / pixelRatio + 2 * (0.5 - baseline) * strokeWidth;

  this.instructions.push([
    _ol_render_canvas_Instruction_.DRAW_IMAGE, myBegin, myEnd, label,
    (anchorX - this.textOffsetX_) * pixelRatio, (anchorY - this.textOffsetY_) * pixelRatio,
    label.height, 1, 0, 0, this.textRotateWithView_, this.textRotation_,
    this.textScale_, true, label.width
  ]);
  this.hitDetectionInstructions.push([
    _ol_render_canvas_Instruction_.DRAW_IMAGE, myBegin, myEnd, label,
    (anchorX - this.textOffsetX_) * pixelRatio, (anchorY - this.textOffsetY_) * pixelRatio,
    label.height, 1, 0, 0, this.textRotateWithView_, this.textRotation_,
    this.textScale_ / pixelRatio, true, label.width
  ]);

  this.endGeometry(geometry, feature);
};


/**
 * @inheritDoc
 */
_ol_render_canvas_TextReplay_.prototype.setTextStyle = function(textStyle) {
  if (!textStyle) {
    this.text_ = '';
  } else {
    var textFillStyle = textStyle.getFill();
    if (!textFillStyle) {
      this.textFillState_ = null;
    } else {
      var textFillStyleColor = textFillStyle.getColor();
      var fillStyle = _ol_colorlike_.asColorLike(textFillStyleColor ?
        textFillStyleColor : _ol_render_canvas_.defaultFillStyle);
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
        textStrokeStyleLineCap : _ol_render_canvas_.defaultLineCap;
      var lineDash = textStrokeStyleLineDash ?
        textStrokeStyleLineDash.slice() : _ol_render_canvas_.defaultLineDash;
      var lineDashOffset = textStrokeStyleLineDashOffset !== undefined ?
        textStrokeStyleLineDashOffset : _ol_render_canvas_.defaultLineDashOffset;
      var lineJoin = textStrokeStyleLineJoin !== undefined ?
        textStrokeStyleLineJoin : _ol_render_canvas_.defaultLineJoin;
      var lineWidth = textStrokeStyleWidth !== undefined ?
        textStrokeStyleWidth : _ol_render_canvas_.defaultLineWidth;
      var miterLimit = textStrokeStyleMiterLimit !== undefined ?
        textStrokeStyleMiterLimit : _ol_render_canvas_.defaultMiterLimit;
      var strokeStyle = _ol_colorlike_.asColorLike(textStrokeStyleColor ?
        textStrokeStyleColor : _ol_render_canvas_.defaultStrokeStyle);
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
      textFont : _ol_render_canvas_.defaultFont;
    var textAlign = textTextAlign !== undefined ?
      textTextAlign : _ol_render_canvas_.defaultTextAlign;
    var textBaseline = textTextBaseline !== undefined ?
      textTextBaseline : _ol_render_canvas_.defaultTextBaseline;
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
export default _ol_render_canvas_TextReplay_;
