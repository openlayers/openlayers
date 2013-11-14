// FIXME decide default value for snapToPixel

goog.provide('ol.style');
goog.provide('ol.style.DefaultStyleFunction');
goog.provide('ol.style.Style');
goog.provide('ol.style.StyleFunction');
goog.provide('ol.style.fill');
goog.provide('ol.style.stroke');
goog.provide('ol.style.text');

goog.require('goog.functions');
goog.require('ol.color');


/**
 * @typedef {{color: (ol.Color|string)}|null|undefined}
 */
ol.style.Fill;


/**
 * @param {ol.style.Fill} fillStyle1 Fill style 1.
 * @param {ol.style.Fill} fillStyle2 Fill style 2.
 * @return {boolean} Equals.
 */
ol.style.fill.equals = function(fillStyle1, fillStyle2) {
  if (goog.isDefAndNotNull(fillStyle1)) {
    if (goog.isDefAndNotNull(fillStyle2)) {
      return fillStyle1 === fillStyle2 ||
          ol.color.stringOrColorEquals(fillStyle1.color, fillStyle2.color);
    } else {
      return false;
    }
  } else {
    if (goog.isDefAndNotNull(fillStyle2)) {
      return false;
    } else {
      return true;
    }
  }
};


/**
 * @typedef {{anchor: Array.<number>,
 *            image: (HTMLCanvasElement|HTMLVideoElement|Image),
 *            rotation: number,
 *            snapToPixel: (boolean|undefined),
 *            subtractViewRotation: boolean}|null|undefined}
 */
ol.style.Image;


/**
 * @typedef {{color: (ol.Color|string),
 *            width: number}|null|undefined}
 */
ol.style.Stroke;


/**
 * @param {ol.style.Stroke} strokeStyle1 Stroke style 1.
 * @param {ol.style.Stroke} strokeStyle2 Stroke style 2.
 * @return {boolean} Equals.
 */
ol.style.stroke.equals = function(strokeStyle1, strokeStyle2) {
  if (goog.isDefAndNotNull(strokeStyle1)) {
    if (goog.isDefAndNotNull(strokeStyle2)) {
      return strokeStyle1 === strokeStyle2 ||
          (ol.color.stringOrColorEquals(strokeStyle1.color,
                                        strokeStyle2.color) &&
           strokeStyle1.width == strokeStyle2.width);
    } else {
      return false;
    }
  } else {
    if (goog.isDefAndNotNull(strokeStyle2)) {
      return false;
    } else {
      return true;
    }
  }
};


/**
 * @typedef {{font: (string|undefined),
 *            text: (string|undefined),
 *            textAlign: (string|undefined),
 *            textBaseline: (string|undefined)}|null|undefined}
 */
ol.style.Text;


/**
 * @param {ol.style.Text} textStyle1 Text style 1.
 * @param {ol.style.Text} textStyle2 Text style 2.
 * @return {boolean} Equals.
 */
ol.style.text.equals = function(textStyle1, textStyle2) {
  if (goog.isDefAndNotNull(textStyle1)) {
    if (goog.isDefAndNotNull(textStyle2)) {
      return textStyle1 === textStyle2 || (
          textStyle1.font == textStyle2.font &&
          textStyle1.text == textStyle2.text &&
          textStyle1.textAlign == textStyle2.textAlign &&
          textStyle1.textBaseline == textStyle2.textBaseline);
    } else {
      return false;
    }
  } else {
    if (goog.isDefAndNotNull(textStyle2)) {
      return false;
    } else {
      return true;
    }
  }
};


/**
 * @typedef {{fill: ol.style.Fill,
 *            image: ol.style.Image,
 *            stroke: ol.style.Stroke,
 *            text: ol.style.Text,
 *            zIndex: (number|undefined)}}
 */
ol.style.Style;


/**
 * @typedef {function(ol.Feature): ol.style.Style}
 */
ol.style.StyleFunction;


/**
 * @const
 * @type {ol.style.Fill}
 */
ol.style.DEFAULT_FILL_STYLE = {
  color: 'rgba(255,0,0,0.1)'
};


/**
 * @const
 * @type {ol.style.Image}
 */
ol.style.DEFAULT_IMAGE_STYLE = {
  anchor: [0, 0],
  image: null, // FIXME
  rotation: 0.0,
  snapToPixel: undefined,
  subtractViewRotation: false
};


/**
 * @const
 * @type {ol.style.Stroke}
 */
ol.style.DEFAULT_STROKE_STYLE = {
  color: '#ff0000',
  width: 3
};


/**
 * @const
 * @type {ol.style.Text}
 */
ol.style.DEFAULT_TEXT_STYLE = {
  font: '10px sans-serif',
  text: undefined,
  textAlign: 'start',
  textBaseline: 'alphabetic'
};


/**
 * @const
 * @type {number}
 */
ol.style.DEFAULT_Z_INDEX = 0;


/**
 * @const
 * @type {ol.style.Style}
 */
ol.style.DEFAULT_STYLE = {
  fill: ol.style.DEFAULT_FILL_STYLE,
  image: ol.style.DEFAULT_IMAGE_STYLE,
  stroke: ol.style.DEFAULT_STROKE_STYLE,
  text: ol.style.DEFAULT_TEXT_STYLE,
  zIndex: ol.style.DEFAULT_Z_INDEX
};


/**
 * @param {ol.Feature} feature Feature.
 * @return {ol.style.Style} Style.
 */
ol.style.DefaultStyleFunction = goog.functions.constant(ol.style.DEFAULT_STYLE);
