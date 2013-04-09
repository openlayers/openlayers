goog.provide('ol.style.Icon');
goog.provide('ol.style.IconLiteral');
goog.provide('ol.style.IconType');

goog.require('goog.asserts');
goog.require('ol.Expression');
goog.require('ol.ExpressionLiteral');
goog.require('ol.style.Point');
goog.require('ol.style.PointLiteral');


/**
 * @typedef {{url: (string),
 *            width: (number|undefined),
 *            height: (number|undefined),
 *            opacity: (number),
 *            rotation: (number)}}
 */
ol.style.IconLiteralOptions;



/**
 * @constructor
 * @extends {ol.style.PointLiteral}
 * @param {ol.style.IconLiteralOptions} options Icon literal options.
 */
ol.style.IconLiteral = function(options) {

  /** @type {string} */
  this.url = options.url;

  /** @type {number|undefined} */
  this.width = options.width;

  /** @type {number|undefined} */
  this.height = options.height;

  /** @type {number} */
  this.opacity = options.opacity;

  /** @type {number} */
  this.rotation = options.rotation;

};
goog.inherits(ol.style.IconLiteral, ol.style.PointLiteral);


/**
 * @inheritDoc
 */
ol.style.IconLiteral.prototype.equals = function(iconLiteral) {
  return this.url == iconLiteral.type &&
      this.width == iconLiteral.width &&
      this.height == iconLiteral.height &&
      this.opacity == iconLiteral.opacity &&
      this.rotation == iconLiteral.rotation;
};



/**
 * @constructor
 * @extends {ol.style.Point}
 * @param {ol.style.IconOptions} options Icon options.
 */
ol.style.Icon = function(options) {

  goog.asserts.assert(options.url, 'url must be set');

  /**
   * @type {ol.Expression}
   * @private
   */
  this.url_ = (options.url instanceof ol.Expression) ?
          options.url : new ol.ExpressionLiteral(options.url);

  /**
   * @type {ol.Expression}
   * @private
   */
  this.width_ = !goog.isDef(options.width) ?
      null :
      (options.width instanceof ol.Expression) ?
          options.width : new ol.ExpressionLiteral(options.width);

  /**
   * @type {ol.Expression}
   * @private
   */
  this.height_ = !goog.isDef(options.height) ?
      null :
      (options.height instanceof ol.Expression) ?
          options.height : new ol.ExpressionLiteral(options.height);

  /**
   * @type {ol.Expression}
   * @private
   */
  this.opacity_ = !goog.isDef(options.opacity) ?
      new ol.ExpressionLiteral(ol.style.IconDefaults.opacity) :
      (options.opacity instanceof ol.Expression) ?
          options.opacity : new ol.ExpressionLiteral(options.opacity);

  /**
   * @type {ol.Expression}
   * @private
   */
  this.rotation_ = !goog.isDef(options.rotation) ?
      new ol.ExpressionLiteral(ol.style.IconDefaults.rotation) :
      (options.rotation instanceof ol.Expression) ?
          options.rotation : new ol.ExpressionLiteral(options.rotation);

};


/**
 * @inheritDoc
 * @return {ol.style.IconLiteral} Literal shape symbolizer.
 */
ol.style.Icon.prototype.createLiteral = function(feature) {
  var attrs = feature && feature.getAttributes();

  var url = /** @type {string} */ (this.url_.evaluate(feature, attrs));
  goog.asserts.assert(goog.isString(url) && url != '#', 'url must be a string');

  var width = /** @type {number|undefined} */ (goog.isNull(this.width_) ?
      undefined : this.width_.evaluate(feature, attrs));
  goog.asserts.assert(!goog.isDef(width) || goog.isNumber(width),
      'width must be undefined or a number');

  var height = /** @type {number|undefined} */ (goog.isNull(this.height_) ?
      undefined : this.height_.evaluate(feature, attrs));
  goog.asserts.assert(!goog.isDef(height) || goog.isNumber(height),
      'height must be undefined or a number');

  var opacity = /** {@type {number} */ (this.opacity_.evaluate(feature, attrs));
  goog.asserts.assertNumber(opacity, 'opacity must be a number');

  var rotation =
      /** {@type {number} */ (this.opacity_.evaluate(feature, attrs));
  goog.asserts.assertNumber(rotation, 'rotation must be a number');

  return new ol.style.IconLiteral({
    url: url,
    width: width,
    height: height,
    opacity: opacity,
    rotation: rotation
  });
};


/**
 * @type {ol.style.IconLiteral}
 */
ol.style.IconDefaults = new ol.style.IconLiteral({
  url: '#',
  opacity: 1,
  rotation: 0
});
