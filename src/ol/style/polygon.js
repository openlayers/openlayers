goog.provide('ol.style.Polygon');
goog.provide('ol.style.PolygonLiteral');

goog.require('goog.asserts');
goog.require('ol.Expression');
goog.require('ol.ExpressionLiteral');
goog.require('ol.style.Symbolizer');
goog.require('ol.style.SymbolizerLiteral');


/**
 * @typedef {{fillColor: (string|undefined),
 *            strokeColor: (string|undefined),
 *            strokeWidth: (number|undefined),
 *            opacity: (number)}}
 */
ol.style.PolygonLiteralOptions;



/**
 * @constructor
 * @extends {ol.style.SymbolizerLiteral}
 * @param {ol.style.PolygonLiteralOptions} options Polygon literal options.
 */
ol.style.PolygonLiteral = function(options) {
  goog.base(this);

  /** @type {string|undefined} */
  this.fillColor = options.fillColor;
  if (goog.isDef(options.fillColor)) {
    goog.asserts.assertString(options.fillColor, 'fillColor must be a string');
  }

  /** @type {string|undefined} */
  this.strokeColor = options.strokeColor;
  if (goog.isDef(this.strokeColor)) {
    goog.asserts.assertString(
        this.strokeColor, 'strokeColor must be a string');
  }

  /** @type {number|undefined} */
  this.strokeWidth = options.strokeWidth;
  if (goog.isDef(this.strokeWidth)) {
    goog.asserts.assertNumber(
        this.strokeWidth, 'strokeWidth must be a number');
  }

  goog.asserts.assert(
      goog.isDef(this.fillColor) ||
      (goog.isDef(this.strokeColor) && goog.isDef(this.strokeWidth)),
      'Either fillColor or strokeColor and strokeWidth must be set');

  goog.asserts.assertNumber(options.opacity, 'opacity must be a number');
  /** @type {number} */
  this.opacity = options.opacity;

};
goog.inherits(ol.style.PolygonLiteral, ol.style.SymbolizerLiteral);


/**
 * @inheritDoc
 */
ol.style.PolygonLiteral.prototype.equals = function(polygonLiteral) {
  return this.fillColor == polygonLiteral.fillColor &&
      this.strokeColor == polygonLiteral.strokeColor &&
      this.strokeWidth == polygonLiteral.strokeWidth &&
      this.opacity == polygonLiteral.opacity;
};



/**
 * @constructor
 * @extends {ol.style.Symbolizer}
 * @param {ol.style.PolygonOptions} options Polygon options.
 */
ol.style.Polygon = function(options) {
  goog.base(this);

  /**
   * @type {ol.Expression}
   * @private
   */
  this.fillColor_ = !goog.isDefAndNotNull(options.fillColor) ?
      null :
      (options.fillColor instanceof ol.Expression) ?
          options.fillColor : new ol.ExpressionLiteral(options.fillColor);

  // stroke handling - if any stroke property is supplied, use defaults
  var strokeColor = null,
      strokeWidth = null;

  if (goog.isDefAndNotNull(options.strokeColor) ||
      goog.isDefAndNotNull(options.strokeWidth)) {

    strokeColor = !goog.isDefAndNotNull(options.strokeColor) ?
        new ol.ExpressionLiteral(ol.style.PolygonDefaults.strokeColor) :
        (options.strokeColor instanceof ol.Expression) ?
            options.strokeColor : new ol.ExpressionLiteral(options.strokeColor);

    strokeWidth = !goog.isDef(options.strokeWidth) ?
        new ol.ExpressionLiteral(ol.style.PolygonDefaults.strokeWidth) :
        (options.strokeWidth instanceof ol.Expression) ?
            options.strokeWidth : new ol.ExpressionLiteral(options.strokeWidth);
  }

  /**
   * @type {ol.Expression}
   * @private
   */
  this.strokeColor_ = strokeColor;

  /**
   * @type {ol.Expression}
   * @private
   */
  this.strokeWidth_ = strokeWidth;

  // one of stroke or fill can be null, both null is user error
  goog.asserts.assert(!goog.isNull(this.fillColor_) ||
      !(goog.isNull(this.strokeColor_) && goog.isNull(this.strokeWidth_)),
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

  var fillColor = goog.isNull(this.fillColor_) ?
      undefined :
      /** @type {string} */ (this.fillColor_.evaluate(feature, attrs));
  goog.asserts.assert(!goog.isDef(fillColor) || goog.isString(fillColor));

  var strokeColor = goog.isNull(this.strokeColor_) ?
      undefined :
      /** @type {string} */ (this.strokeColor_.evaluate(feature, attrs));
  goog.asserts.assert(!goog.isDef(strokeColor) || goog.isString(strokeColor));

  var strokeWidth = goog.isNull(this.strokeWidth_) ?
      undefined :
      /** @type {number} */ (this.strokeWidth_.evaluate(feature, attrs));
  goog.asserts.assert(!goog.isDef(strokeWidth) || goog.isNumber(strokeWidth));

  goog.asserts.assert(
      goog.isDef(fillColor) ||
      (goog.isDef(strokeColor) && goog.isDef(strokeWidth)),
      'either fill style or strokeColor and strokeWidth must be defined');

  var opacity = this.opacity_.evaluate(feature, attrs);
  goog.asserts.assertNumber(opacity, 'opacity must be a number');

  return new ol.style.PolygonLiteral({
    fillColor: fillColor,
    strokeColor: strokeColor,
    strokeWidth: strokeWidth,
    opacity: opacity
  });
};


/**
 * @type {ol.style.PolygonLiteral}
 */
ol.style.PolygonDefaults = new ol.style.PolygonLiteral({
  fillColor: '#ffffff',
  strokeColor: '#696969',
  strokeWidth: 1.5,
  opacity: 0.75
});
