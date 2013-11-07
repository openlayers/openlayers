goog.provide('ol.style.DefaultStyleFunction');
goog.provide('ol.style.Style');
goog.provide('ol.style.StyleFunction');
goog.provide('ol.style.fill');
goog.provide('ol.style.stroke');

goog.require('goog.functions');


/**
 * @typedef {{color: string,
 *            opacity: number}}
 */
ol.style.Fill;


/**
 * @param {?ol.style.Fill} fillStyle1 Fill style 1.
 * @param {?ol.style.Fill} fillStyle2 Fill style 2.
 * @return {boolean} Equals.
 */
ol.style.fill.equals = function(fillStyle1, fillStyle2) {
  return fillStyle1 === fillStyle2 || (
      !goog.isNull(fillStyle1) && !goog.isNull(fillStyle2) &&
      fillStyle1.color == fillStyle2.color &&
      fillStyle1.opacity == fillStyle2.opacity);
};


/**
 * @typedef {{anchor: Array.<number>,
 *            image: (HTMLCanvasElement|HTMLVideoElement|Image),
 *            rotation: number,
 *            subtractViewRotation: boolean}}
 */
ol.style.Image;


/**
 * @typedef {{color: string,
 *            width: number}}
 */
ol.style.Stroke;


/**
 * @param {?ol.style.Stroke} strokeStyle1 Stroke style 1.
 * @param {?ol.style.Stroke} strokeStyle2 Stroke style 2.
 * @return {boolean} Equals.
 */
ol.style.stroke.equals = function(strokeStyle1, strokeStyle2) {
  return strokeStyle1 === strokeStyle2 || (
      !goog.isNull(strokeStyle1) && !goog.isNull(strokeStyle2) &&
      strokeStyle1.color == strokeStyle2.color &&
      strokeStyle1.width == strokeStyle2.width);
};


/**
 * @typedef {{fill: ol.style.Fill,
 *            image: ol.style.Image,
 *            stroke: ol.style.Stroke,
 *            zIndex: number}}
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
  color: 'red',
  opacity: 0.1
};


/**
 * @const
 * @type {ol.style.Image}
 */
ol.style.DEFAULT_IMAGE_STYLE = {
  anchor: [0, 0],
  image: null, // FIXME
  rotation: 0.0,
  subtractViewRotation: false
};


/**
 * @const
 * @type {ol.style.Stroke}
 */
ol.style.DEFAULT_STROKE_STYLE = {
  color: 'red',
  width: 3
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
  zIndex: ol.style.DEFAULT_Z_INDEX
};


/**
 * @param {ol.Feature} feature Feature.
 * @return {ol.style.Style} Style.
 */
ol.style.DefaultStyleFunction = goog.functions.constant(ol.style.DEFAULT_STYLE);
