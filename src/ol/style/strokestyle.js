goog.provide('ol.style.Stroke');

goog.require('goog.asserts');



/**
 * @classdesc
 * Set stroke style for vector features.
 * Note that the defaults given are the Canvas defaults, which will be used if
 * option is not defined. The `get` functions return whatever was entered in
 * the options; they will not return the default.
 *
 * @constructor
 * @param {olx.style.StrokeOptions=} opt_options Options.
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

  /**
   * @private
   * @type {boolean}
   */
  this.mutable_ = true;

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
 * @param {ol.Color|string} color Color.
 * @api
 */
ol.style.Stroke.prototype.setColor = function(color) {
  goog.asserts.assert(this.mutable_);
  this.color_ = color;
};


/**
 * @param {string|undefined} lineCap Line cap.
 * @api
 */
ol.style.Stroke.prototype.setLineCap = function(lineCap) {
  goog.asserts.assert(this.mutable_);
  this.lineCap_ = lineCap;
};


/**
 * @param {Array.<number>} lineDash Line dash.
 * @api
 */
ol.style.Stroke.prototype.setLineDash = function(lineDash) {
  goog.asserts.assert(this.mutable_);
  this.lineDash_ = lineDash;
};


/**
 * @param {string|undefined} lineJoin Line join.
 * @api
 */
ol.style.Stroke.prototype.setLineJoin = function(lineJoin) {
  goog.asserts.assert(this.mutable_);
  this.lineJoin_ = lineJoin;
};


/**
 * @param {number|undefined} miterLimit Miter limit.
 * @api
 */
ol.style.Stroke.prototype.setMiterLimit = function(miterLimit) {
  goog.asserts.assert(this.mutable_);
  this.miterLimit_ = miterLimit;
};


/**
 * @param {number|undefined} width Width.
 * @api
 */
ol.style.Stroke.prototype.setWidth = function(width) {
  goog.asserts.assert(this.mutable_);
  this.width_ = width;
};


/**
 * @param {boolean} mutable Mutable.
 */
ol.style.Stroke.prototype.setMutable = function(mutable) {
  this.mutable_ = mutable;
};
