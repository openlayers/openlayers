goog.provide('ol.color.Matrix');

goog.require('goog.vec.Mat4');



/**
 * @constructor
 */
ol.color.Matrix = function() {

  /**
   * @private
   * @type {!goog.vec.Mat4.Number}
   */
  this.colorMatrix_ = goog.vec.Mat4.createNumber();

  /**
   * @private
   * @type {number|undefined}
   */
  this.brightness_ = undefined;

  /**
   * @private
   * @type {!goog.vec.Mat4.Number}
   */
  this.brightnessMatrix_ = goog.vec.Mat4.createNumber();

  /**
   * @private
   * @type {number|undefined}
   */
  this.contrast_ = undefined;

  /**
   * @private
   * @type {!goog.vec.Mat4.Number}
   */
  this.contrastMatrix_ = goog.vec.Mat4.createNumber();

  /**
   * @private
   * @type {number|undefined}
   */
  this.hue_ = undefined;

  /**
   * @private
   * @type {!goog.vec.Mat4.Number}
   */
  this.hueMatrix_ = goog.vec.Mat4.createNumber();

  /**
   * @private
   * @type {number|undefined}
   */
  this.saturation_ = undefined;

  /**
   * @private
   * @type {!goog.vec.Mat4.Number}
   */
  this.saturationMatrix_ = goog.vec.Mat4.createNumber();

};


/**
 * @param {!goog.vec.Mat4.Number} matrix Matrix.
 * @param {number} value Brightness value.
 * @return {!goog.vec.Mat4.Number} Matrix.
 */
ol.color.Matrix.makeBrightness = function(matrix, value) {
  goog.vec.Mat4.makeTranslate(matrix, value, value, value);
  return matrix;
};


/**
 * @param {!goog.vec.Mat4.Number} matrix Matrix.
 * @param {number} value Contrast value.
 * @return {!goog.vec.Mat4.Number} Matrix.
 */
ol.color.Matrix.makeContrast = function(matrix, value) {
  goog.vec.Mat4.makeScale(matrix, value, value, value);
  var translateValue = (-0.5 * value + 0.5);
  goog.vec.Mat4.setColumnValues(matrix, 3,
      translateValue, translateValue, translateValue, 1);
  return matrix;
};


/**
 * @param {!goog.vec.Mat4.Number} matrix Matrix.
 * @param {number} value Hue value.
 * @return {!goog.vec.Mat4.Number} Matrix.
 */
ol.color.Matrix.makeHue = function(matrix, value) {
  var cosHue = Math.cos(value);
  var sinHue = Math.sin(value);
  var v00 = 0.213 + cosHue * 0.787 - sinHue * 0.213;
  var v01 = 0.715 - cosHue * 0.715 - sinHue * 0.715;
  var v02 = 0.072 - cosHue * 0.072 + sinHue * 0.928;
  var v03 = 0;
  var v10 = 0.213 - cosHue * 0.213 + sinHue * 0.143;
  var v11 = 0.715 + cosHue * 0.285 + sinHue * 0.140;
  var v12 = 0.072 - cosHue * 0.072 - sinHue * 0.283;
  var v13 = 0;
  var v20 = 0.213 - cosHue * 0.213 - sinHue * 0.787;
  var v21 = 0.715 - cosHue * 0.715 + sinHue * 0.715;
  var v22 = 0.072 + cosHue * 0.928 + sinHue * 0.072;
  var v23 = 0;
  var v30 = 0;
  var v31 = 0;
  var v32 = 0;
  var v33 = 1;
  goog.vec.Mat4.setFromValues(matrix,
      v00, v10, v20, v30,
      v01, v11, v21, v31,
      v02, v12, v22, v32,
      v03, v13, v23, v33);
  return matrix;
};


/**
 * @param {!goog.vec.Mat4.Number} matrix Matrix.
 * @param {number} value Saturation value.
 * @return {!goog.vec.Mat4.Number} Matrix.
 */
ol.color.Matrix.makeSaturation = function(matrix, value) {
  var v00 = 0.213 + 0.787 * value;
  var v01 = 0.715 - 0.715 * value;
  var v02 = 0.072 - 0.072 * value;
  var v03 = 0;
  var v10 = 0.213 - 0.213 * value;
  var v11 = 0.715 + 0.285 * value;
  var v12 = 0.072 - 0.072 * value;
  var v13 = 0;
  var v20 = 0.213 - 0.213 * value;
  var v21 = 0.715 - 0.715 * value;
  var v22 = 0.072 + 0.928 * value;
  var v23 = 0;
  var v30 = 0;
  var v31 = 0;
  var v32 = 0;
  var v33 = 1;
  goog.vec.Mat4.setFromValues(matrix,
      v00, v10, v20, v30,
      v01, v11, v21, v31,
      v02, v12, v22, v32,
      v03, v13, v23, v33);
  return matrix;
};


/**
 * @param {number|undefined} brightness Brightness.
 * @param {number|undefined} contrast Contrast.
 * @param {number|undefined} hue Hue.
 * @param {number|undefined} saturation Saturation.
 * @return {!goog.vec.Mat4.Number} Matrix.
 */
ol.color.Matrix.prototype.getMatrix = function(
    brightness, contrast, hue, saturation) {
  var colorMatrixDirty = false;
  if (goog.isDef(brightness) && brightness !== this.brightness_) {
    ol.color.Matrix.makeBrightness(this.brightnessMatrix_, brightness);
    this.brightness_ = brightness;
    colorMatrixDirty = true;
  }
  if (goog.isDef(contrast) && contrast !== this.contrast_) {
    ol.color.Matrix.makeContrast(this.contrastMatrix_, contrast);
    this.contrast_ = contrast;
    colorMatrixDirty = true;
  }
  if (goog.isDef(hue) && hue !== this.hue_) {
    ol.color.Matrix.makeHue(this.hueMatrix_, hue);
    this.hue_ = hue;
    colorMatrixDirty = true;
  }
  if (goog.isDef(saturation) && saturation !== this.saturation_) {
    ol.color.Matrix.makeSaturation(this.saturationMatrix_, saturation);
    this.saturation_ = saturation;
    colorMatrixDirty = true;
  }
  if (colorMatrixDirty) {
    var colorMatrix = this.colorMatrix_;
    goog.vec.Mat4.makeIdentity(colorMatrix);
    if (goog.isDef(contrast)) {
      goog.vec.Mat4.multMat(colorMatrix, this.contrastMatrix_, colorMatrix);
    }
    if (goog.isDef(brightness)) {
      goog.vec.Mat4.multMat(colorMatrix, this.brightnessMatrix_, colorMatrix);
    }
    if (goog.isDef(saturation)) {
      goog.vec.Mat4.multMat(colorMatrix, this.saturationMatrix_, colorMatrix);
    }
    if (goog.isDef(hue)) {
      goog.vec.Mat4.multMat(colorMatrix, this.hueMatrix_, colorMatrix);
    }
  }
  return this.colorMatrix_;
};
