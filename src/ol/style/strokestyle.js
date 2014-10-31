goog.provide('ol.style.Stroke');

goog.require('goog.string');
goog.require('ol.color');
goog.require('ol.structs.IHashable');



/**
 * @classdesc
 * Set stroke style for vector features.
 * Note that the defaults given are the Canvas defaults, which will be used if
 * option is not defined. The `get` functions return whatever was entered in
 * the options; they will not return the default.
 *
 * @constructor
 * @param {olx.style.StrokeOptions=} opt_options Options.
 * @implements {ol.structs.IHashable}
 * @api
 */
ol.style.Stroke = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @private
   * @type {ol.Color|string}
   */
  this.color_ = goog.isDef(options.color) ? options.color : null;

  /**
   * @private
   * @type {string|undefined}
   */
  this.lineCap_ = options.lineCap;

  /**
   * @private
   * @type {Array.<number>}
   */
  this.lineDash_ = goog.isDef(options.lineDash) ? options.lineDash : null;

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
};


/**
 * @return {ol.Color|string} Color.
 * @api
 */
ol.style.Stroke.prototype.getColor = function() {
  return this.color_;
};


/**
 * @return {string|undefined} Line cap.
 * @api
 */
ol.style.Stroke.prototype.getLineCap = function() {
  return this.lineCap_;
};


/**
 * @return {Array.<number>} Line dash.
 * @api
 */
ol.style.Stroke.prototype.getLineDash = function() {
  return this.lineDash_;
};


/**
 * @return {string|undefined} Line join.
 * @api
 */
ol.style.Stroke.prototype.getLineJoin = function() {
  return this.lineJoin_;
};


/**
 * @return {number|undefined} Miter limit.
 * @api
 */
ol.style.Stroke.prototype.getMiterLimit = function() {
  return this.miterLimit_;
};


/**
 * @return {number|undefined} Width.
 * @api
 */
ol.style.Stroke.prototype.getWidth = function() {
  return this.width_;
};


/**
 * Set the color.
 *
 * @param {ol.Color|string} color Color.
 * @api
 */
ol.style.Stroke.prototype.setColor = function(color) {
  this.color_ = color;
};


/**
 * Set the line cap.
 *
 * @param {string|undefined} lineCap Line cap.
 * @api
 */
ol.style.Stroke.prototype.setLineCap = function(lineCap) {
  this.lineCap_ = lineCap;
};


/**
 * Set the line dash.
 *
 * @param {Array.<number>} lineDash Line dash.
 * @api
 */
ol.style.Stroke.prototype.setLineDash = function(lineDash) {
  this.lineDash_ = lineDash;
};


/**
 * Set the line join.
 *
 * @param {string|undefined} lineJoin Line join.
 * @api
 */
ol.style.Stroke.prototype.setLineJoin = function(lineJoin) {
  this.lineJoin_ = lineJoin;
};


/**
 * Set the miter limit.
 *
 * @param {number|undefined} miterLimit Miter limit.
 * @api
 */
ol.style.Stroke.prototype.setMiterLimit = function(miterLimit) {
  this.miterLimit_ = miterLimit;
};


/**
 * Set the width.
 *
 * @param {number|undefined} width Width.
 * @api
 */
ol.style.Stroke.prototype.setWidth = function(width) {
  this.width_ = width;
};


/**
 * @inheritDoc
 */
ol.style.Stroke.prototype.hashCode = function() {
  var hash = 17;

  hash = hash * 23 + (!goog.isNull(this.color_) ?
      goog.string.hashCode(ol.color.asString(this.color_)) : 0);
  hash = hash * 23 + (goog.isDef(this.lineCap_) ?
      goog.string.hashCode(this.lineCap_.toString()) : 0);
  hash = hash * 23 + (!goog.isNull(this.lineDash_) ?
      goog.string.hashCode(this.lineDash_.toString()) : 0);
  hash = hash * 23 + (goog.isDef(this.lineJoin_) ?
      goog.string.hashCode(this.lineJoin_) : 0);
  hash = hash * 23 + (goog.isDef(this.miterLimit_) ?
      goog.string.hashCode(this.miterLimit_.toString()) : 0);
  hash = hash * 23 + (goog.isDef(this.width_) ?
      goog.string.hashCode(this.width_.toString()) : 0);

  return hash;
};
