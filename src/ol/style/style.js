goog.provide('ol.style.Style');

goog.require('goog.asserts');
goog.require('goog.functions');
goog.require('ol.style.Fill');
goog.require('ol.style.Image');



/**
 * @classdesc
 * Base class for vector feature rendering styles.
 *
 * @constructor
 * @param {olx.style.StyleOptions=} opt_options Style options.
 * @api
 */
ol.style.Style = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @private
   * @type {ol.style.Fill}
   */
  this.fill_ = goog.isDef(options.fill) ? options.fill : null;

  /**
   * @private
   * @type {ol.style.Image}
   */
  this.image_ = goog.isDef(options.image) ? options.image : null;

  /**
   * @private
   * @type {ol.style.Stroke}
   */
  this.stroke_ = goog.isDef(options.stroke) ? options.stroke : null;

  /**
   * @private
   * @type {ol.style.Text}
   */
  this.text_ = goog.isDef(options.text) ? options.text : null;

  /**
   * @private
   * @type {number|undefined}
   */
  this.zIndex_ = options.zIndex;

};


/**
 * @return {ol.style.Fill} Fill style.
 * @api
 */
ol.style.Style.prototype.getFill = function() {
  return this.fill_;
};


/**
 * @return {ol.style.Image} Image style.
 * @api
 */
ol.style.Style.prototype.getImage = function() {
  return this.image_;
};


/**
 * @return {ol.style.Stroke} Stroke style.
 * @api
 */
ol.style.Style.prototype.getStroke = function() {
  return this.stroke_;
};


/**
 * @return {ol.style.Text} Text style.
 * @api
 */
ol.style.Style.prototype.getText = function() {
  return this.text_;
};


/**
 * @return {number|undefined} ZIndex.
 * @api
 */
ol.style.Style.prototype.getZIndex = function() {
  return this.zIndex_;
};


/**
 * A function that takes an {@link ol.Feature} and a `{number}` representing
 * the view's resolution. The function should return an array of
 * {@link ol.style.Style}. This way e.g. a vector layer can be styled.
 *
 * @typedef {function(ol.Feature, number): Array.<ol.style.Style>}
 * @api
 */
ol.style.StyleFunction;


/**
 * Convert the provided object into a style function.  Functions passed through
 * unchanged.  Arrays of ol.style.Style or single style objects wrapped in a
 * new style function.
 * @param {ol.style.StyleFunction|Array.<ol.style.Style>|ol.style.Style} obj
 *     A style function, a single style, or an array of styles.
 * @return {ol.style.StyleFunction} A style function.
 */
ol.style.createStyleFunction = function(obj) {
  /**
   * @type {ol.style.StyleFunction}
   */
  var styleFunction;

  if (goog.isFunction(obj)) {
    styleFunction = /** @type {ol.style.StyleFunction} */ (obj);
  } else {
    /**
     * @type {Array.<ol.style.Style>}
     */
    var styles;
    if (goog.isArray(obj)) {
      styles = obj;
    } else {
      goog.asserts.assertInstanceof(obj, ol.style.Style);
      styles = [obj];
    }
    styleFunction = goog.functions.constant(styles);
  }
  return styleFunction;
};
