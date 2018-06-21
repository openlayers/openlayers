/**
 * @module ol/style/Stroke
 */
import {getUid} from '../util.js';


/**
 * @typedef {Object} Options
 * @property {module:ol/color~Color|module:ol/colorlike~ColorLike} [color] A color, gradient or pattern.
 * See {@link module:ol/color~Color} and {@link module:ol/colorlike~ColorLike} for possible formats.
 * Default null; if null, the Canvas/renderer default black will be used.
 * @property {string} [lineCap='round'] Line cap style: `butt`, `round`, or `square`.
 * @property {string} [lineJoin='round'] Line join style: `bevel`, `round`, or `miter`.
 * @property {Array.<number>} [lineDash] Line dash pattern. Default is `undefined` (no dash).
 * Please note that Internet Explorer 10 and lower do not support the `setLineDash` method on
 * the `CanvasRenderingContext2D` and therefore this option will have no visual effect in these browsers.
 * @property {number} [lineDashOffset=0] Line dash offset.
 * @property {number} [miterLimit=10] Miter limit.
 * @property {number} [width] Width.
 */


/**
 * @classdesc
 * Set stroke style for vector features.
 * Note that the defaults given are the Canvas defaults, which will be used if
 * option is not defined. The `get` functions return whatever was entered in
 * the options; they will not return the default.
 *
 * @constructor
 * @param {module:ol/style/Stroke~Options=} opt_options Options.
 * @api
 */
const Stroke = function(opt_options) {

  const options = opt_options || {};

  /**
   * @private
   * @type {module:ol/color~Color|module:ol/colorlike~ColorLike}
   */
  this.color_ = options.color !== undefined ? options.color : null;

  /**
   * @private
   * @type {string|undefined}
   */
  this.lineCap_ = options.lineCap;

  /**
   * @private
   * @type {Array.<number>}
   */
  this.lineDash_ = options.lineDash !== undefined ? options.lineDash : null;

  /**
   * @private
   * @type {number|undefined}
   */
  this.lineDashOffset_ = options.lineDashOffset;

  /**
   * @private
   * @type {string|undefined}
   */
  this.lineJoin_ = options.lineJoin;

  /**
   * @private
   * @type {number|undefined}
   */
  this.miterLimit_ = options.miterLimit;

  /**
   * @private
   * @type {number|undefined}
   */
  this.width_ = options.width;

  /**
   * @private
   * @type {string|undefined}
   */
  this.checksum_ = undefined;
};


/**
 * Clones the style.
 * @return {module:ol/style/Stroke} The cloned style.
 * @api
 */
Stroke.prototype.clone = function() {
  const color = this.getColor();
  return new Stroke({
    color: (color && color.slice) ? color.slice() : color || undefined,
    lineCap: this.getLineCap(),
    lineDash: this.getLineDash() ? this.getLineDash().slice() : undefined,
    lineDashOffset: this.getLineDashOffset(),
    lineJoin: this.getLineJoin(),
    miterLimit: this.getMiterLimit(),
    width: this.getWidth()
  });
};


/**
 * Get the stroke color.
 * @return {module:ol/color~Color|module:ol/colorlike~ColorLike} Color.
 * @api
 */
Stroke.prototype.getColor = function() {
  return this.color_;
};


/**
 * Get the line cap type for the stroke.
 * @return {string|undefined} Line cap.
 * @api
 */
Stroke.prototype.getLineCap = function() {
  return this.lineCap_;
};


/**
 * Get the line dash style for the stroke.
 * @return {Array.<number>} Line dash.
 * @api
 */
Stroke.prototype.getLineDash = function() {
  return this.lineDash_;
};


/**
 * Get the line dash offset for the stroke.
 * @return {number|undefined} Line dash offset.
 * @api
 */
Stroke.prototype.getLineDashOffset = function() {
  return this.lineDashOffset_;
};


/**
 * Get the line join type for the stroke.
 * @return {string|undefined} Line join.
 * @api
 */
Stroke.prototype.getLineJoin = function() {
  return this.lineJoin_;
};


/**
 * Get the miter limit for the stroke.
 * @return {number|undefined} Miter limit.
 * @api
 */
Stroke.prototype.getMiterLimit = function() {
  return this.miterLimit_;
};


/**
 * Get the stroke width.
 * @return {number|undefined} Width.
 * @api
 */
Stroke.prototype.getWidth = function() {
  return this.width_;
};


/**
 * Set the color.
 *
 * @param {module:ol/color~Color|module:ol/colorlike~ColorLike} color Color.
 * @api
 */
Stroke.prototype.setColor = function(color) {
  this.color_ = color;
  this.checksum_ = undefined;
};


/**
 * Set the line cap.
 *
 * @param {string|undefined} lineCap Line cap.
 * @api
 */
Stroke.prototype.setLineCap = function(lineCap) {
  this.lineCap_ = lineCap;
  this.checksum_ = undefined;
};


/**
 * Set the line dash.
 *
 * Please note that Internet Explorer 10 and lower [do not support][mdn] the
 * `setLineDash` method on the `CanvasRenderingContext2D` and therefore this
 * property will have no visual effect in these browsers.
 *
 * [mdn]: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setLineDash#Browser_compatibility
 *
 * @param {Array.<number>} lineDash Line dash.
 * @api
 */
Stroke.prototype.setLineDash = function(lineDash) {
  this.lineDash_ = lineDash;
  this.checksum_ = undefined;
};


/**
 * Set the line dash offset.
 *
 * @param {number|undefined} lineDashOffset Line dash offset.
 * @api
 */
Stroke.prototype.setLineDashOffset = function(lineDashOffset) {
  this.lineDashOffset_ = lineDashOffset;
  this.checksum_ = undefined;
};


/**
 * Set the line join.
 *
 * @param {string|undefined} lineJoin Line join.
 * @api
 */
Stroke.prototype.setLineJoin = function(lineJoin) {
  this.lineJoin_ = lineJoin;
  this.checksum_ = undefined;
};


/**
 * Set the miter limit.
 *
 * @param {number|undefined} miterLimit Miter limit.
 * @api
 */
Stroke.prototype.setMiterLimit = function(miterLimit) {
  this.miterLimit_ = miterLimit;
  this.checksum_ = undefined;
};


/**
 * Set the width.
 *
 * @param {number|undefined} width Width.
 * @api
 */
Stroke.prototype.setWidth = function(width) {
  this.width_ = width;
  this.checksum_ = undefined;
};


/**
 * @return {string} The checksum.
 */
Stroke.prototype.getChecksum = function() {
  if (this.checksum_ === undefined) {
    this.checksum_ = 's';
    if (this.color_) {
      if (typeof this.color_ === 'string') {
        this.checksum_ += this.color_;
      } else {
        this.checksum_ += getUid(this.color_).toString();
      }
    } else {
      this.checksum_ += '-';
    }
    this.checksum_ += ',' +
        (this.lineCap_ !== undefined ?
          this.lineCap_.toString() : '-') + ',' +
        (this.lineDash_ ?
          this.lineDash_.toString() : '-') + ',' +
        (this.lineDashOffset_ !== undefined ?
          this.lineDashOffset_ : '-') + ',' +
        (this.lineJoin_ !== undefined ?
          this.lineJoin_ : '-') + ',' +
        (this.miterLimit_ !== undefined ?
          this.miterLimit_.toString() : '-') + ',' +
        (this.width_ !== undefined ?
          this.width_.toString() : '-');
  }

  return this.checksum_;
};
export default Stroke;
