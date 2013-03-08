goog.provide('ol.style.Polygon');
goog.provide('ol.style.PolygonLiteral');

goog.require('ol.Expression');
goog.require('ol.ExpressionLiteral');
goog.require('ol.style.Symbolizer');
goog.require('ol.style.SymbolizerLiteral');


/**
 * @typedef {{fillStyle: (string|undefined),
 *            strokeStyle: (string|undefined),
 *            strokeWidth: (number|undefined),
 *            opacity: (number)}}
 */
ol.style.PolygonLiteralOptions;



/**
 * @constructor
 * @extends {ol.style.SymbolizerLiteral}
 * @param {ol.style.PolygonLiteralOptions} config Symbolizer properties.
 */
ol.style.PolygonLiteral = function(config) {
  goog.base(this);

  /** @type {string|undefined} */
  this.fillStyle = config.fillStyle;
  if (goog.isDef(config.fillStyle)) {
    goog.asserts.assertString(config.fillStyle, 'fillStyle must be a string');
  }

  /** @type {string|undefined} */
  this.strokeStyle = config.strokeStyle;
  if (goog.isDef(this.strokeStyle)) {
    goog.asserts.assertString(
        this.strokeStyle, 'strokeStyle must be a string');
  }

  /** @type {number|undefined} */
  this.strokeWidth = config.strokeWidth;
  if (goog.isDef(this.strokeWidth)) {
    goog.asserts.assertNumber(
        this.strokeWidth, 'strokeWidth must be a number');
  }

  goog.asserts.assert(
      goog.isDef(this.fillStyle) ||
      (goog.isDef(this.strokeStyle) && goog.isDef(this.strokeWidth)),
      'Either fillStyle or strokeStyle and strokeWidth must be set');

  goog.asserts.assertNumber(config.opacity, 'opacity must be a number');
  /** @type {number} */
  this.opacity = config.opacity;

};
goog.inherits(ol.style.PolygonLiteral, ol.style.SymbolizerLiteral);


/**
 * @inheritDoc
 */
ol.style.PolygonLiteral.prototype.equals = function(polygonLiteral) {
  return this.fillStyle == polygonLiteral.fillStyle &&
      this.strokeStyle == polygonLiteral.strokeStyle &&
      this.strokeWidth == polygonLiteral.strokeWidth &&
      this.opacity == polygonLiteral.opacity;
};



/**
 * @constructor
 * @extends {ol.style.Symbolizer}
 * @param {ol.style.PolygonOptions} options Symbolizer properties.
 */
ol.style.Polygon = function(options) {
  goog.base(this);

  /**
   * @type {ol.Expression}
   * @private
   */
  this.fillStyle_ = !goog.isDefAndNotNull(options.fillStyle) ?
      null :
      (options.fillStyle instanceof ol.Expression) ?
          options.fillStyle : new ol.ExpressionLiteral(options.fillStyle);

  // stroke handling - if any stroke property is supplied, use defaults
  var strokeStyle = null,
      strokeWidth = null;

  if (goog.isDefAndNotNull(options.strokeStyle) ||
      goog.isDefAndNotNull(options.strokeWidth)) {

    strokeStyle = !goog.isDefAndNotNull(options.strokeStyle) ?
        new ol.ExpressionLiteral(ol.style.PolygonDefaults.strokeStyle) :
        (options.strokeStyle instanceof ol.Expression) ?
            options.strokeStyle : new ol.ExpressionLiteral(options.strokeStyle);

    strokeWidth = !goog.isDef(options.strokeWidth) ?
        new ol.ExpressionLiteral(ol.style.PolygonDefaults.strokeWidth) :
        (options.strokeWidth instanceof ol.Expression) ?
            options.strokeWidth : new ol.ExpressionLiteral(options.strokeWidth);
  }

  /**
   * @type {ol.Expression}
   * @private
   */
  this.strokeStyle_ = strokeStyle;

  /**
   * @type {ol.Expression}
   * @private
   */
  this.strokeWidth_ = strokeWidth;

  // one of stroke or fill can be null, both null is user error
  goog.asserts.assert(!goog.isNull(this.fillStyle_) ||
      !(goog.isNull(this.strokeStyle_) && goog.isNull(this.strokeWidth_)),
      'Stroke or fill properties must be provided');

  /**
   * @type {ol.Expression}
   * @private
   */
  this.opacity_ = !goog.isDef(options.opacity) ?
      new ol.ExpressionLiteral(ol.style.PolygonDefaults.opacity) :
      (options.opacity instanceof ol.Expression) ?
          options.opacity : new ol.ExpressionLiteral(options.opacity);

};
goog.inherits(ol.style.Polygon, ol.style.Symbolizer);


/**
 * @inheritDoc
 * @return {ol.style.PolygonLiteral} Literal shape symbolizer.
 */
ol.style.Polygon.prototype.createLiteral = function(opt_feature) {
  var attrs,
      feature = opt_feature;
  if (goog.isDef(feature)) {
    attrs = feature.getAttributes();
  }

  var fillStyle = goog.isNull(this.fillStyle_) ?
      undefined :
      /** @type {string} */ (this.fillStyle_.evaluate(feature, attrs));
  goog.asserts.assert(!goog.isDef(fillStyle) || goog.isString(fillStyle));

  var strokeStyle = goog.isNull(this.strokeStyle_) ?
      undefined :
      /** @type {string} */ (this.strokeStyle_.evaluate(feature, attrs));
  goog.asserts.assert(!goog.isDef(strokeStyle) || goog.isString(strokeStyle));

  var strokeWidth = goog.isNull(this.strokeWidth_) ?
      undefined :
      /** @type {number} */ (this.strokeWidth_.evaluate(feature, attrs));
  goog.asserts.assert(!goog.isDef(strokeWidth) || goog.isNumber(strokeWidth));

  goog.asserts.assert(
      goog.isDef(fillStyle) ||
      (goog.isDef(strokeStyle) && goog.isDef(strokeWidth)),
      'either fill style or strokeStyle and strokeWidth must be defined');

  var opacity = this.opacity_.evaluate(feature, attrs);
  goog.asserts.assertNumber(opacity, 'opacity must be a number');

  return new ol.style.PolygonLiteral({
    fillStyle: fillStyle,
    strokeStyle: strokeStyle,
    strokeWidth: strokeWidth,
    opacity: opacity
  });
};


/**
 * @type {ol.style.PolygonLiteral}
 */
ol.style.PolygonDefaults = new ol.style.PolygonLiteral({
  fillStyle: '#ffffff',
  strokeStyle: '#696969',
  strokeWidth: 1.5,
  opacity: 0.75
});
