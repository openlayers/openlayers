goog.provide('ol.style.Polygon');
goog.provide('ol.style.PolygonLiteral');

goog.require('goog.asserts');
goog.require('ol.expr');
goog.require('ol.expr.Expression');
goog.require('ol.expr.Literal');
goog.require('ol.style.Symbolizer');
goog.require('ol.style.SymbolizerLiteral');


/**
 * @typedef {{fillColor: (string|undefined),
 *            fillOpacity: (number|undefined),
 *            strokeColor: (string|undefined),
 *            strokeOpacity: (number|undefined),
 *            strokeWidth: (number|undefined)}}
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

  /** @type {number|undefined} */
  this.fillOpacity = options.fillOpacity;
  if (goog.isDef(options.fillOpacity)) {
    goog.asserts.assertNumber(
        options.fillOpacity, 'fillOpacity must be a number');
  }

  /** @type {string|undefined} */
  this.strokeColor = options.strokeColor;
  if (goog.isDef(this.strokeColor)) {
    goog.asserts.assertString(
        this.strokeColor, 'strokeColor must be a string');
  }

  /** @type {number|undefined} */
  this.strokeOpacity = options.strokeOpacity;
  if (goog.isDef(this.strokeOpacity)) {
    goog.asserts.assertNumber(
        this.strokeOpacity, 'strokeOpacity must be a number');
  }

  /** @type {number|undefined} */
  this.strokeWidth = options.strokeWidth;
  if (goog.isDef(this.strokeWidth)) {
    goog.asserts.assertNumber(
        this.strokeWidth, 'strokeWidth must be a number');
  }

  // fill and/or stroke properties must be defined
  var fillDef = goog.isDef(this.fillColor) && goog.isDef(this.fillOpacity);
  var strokeDef = goog.isDef(this.strokeColor) &&
      goog.isDef(this.strokeOpacity) &&
      goog.isDef(this.strokeWidth);
  goog.asserts.assert(fillDef || strokeDef,
      'Either fillColor and fillOpacity or ' +
      'strokeColor and strokeOpacity and strokeWidth must be set');

};
goog.inherits(ol.style.PolygonLiteral, ol.style.SymbolizerLiteral);


/**
 * @inheritDoc
 */
ol.style.PolygonLiteral.prototype.equals = function(polygonLiteral) {
  return this.fillColor == polygonLiteral.fillColor &&
      this.fillOpacity == polygonLiteral.fillOpacity &&
      this.strokeColor == polygonLiteral.strokeColor &&
      this.strokeOpacity == polygonLiteral.strokeOpacity &&
      this.strokeWidth == polygonLiteral.strokeWidth;
};



/**
 * @constructor
 * @extends {ol.style.Symbolizer}
 * @param {ol.style.PolygonOptions} options Polygon options.
 */
ol.style.Polygon = function(options) {
  goog.base(this);


  // fill handling - if any fill property is supplied, use all defaults
  var fillColor = null,
      fillOpacity = null;

  if (goog.isDefAndNotNull(options.fillColor) ||
      goog.isDefAndNotNull(options.fillOpacity)) {

    if (goog.isDefAndNotNull(options.fillColor)) {
      fillColor = (options.fillColor instanceof ol.expr.Expression) ?
          options.fillColor :
          new ol.expr.Literal(options.fillColor);
    } else {
      fillColor = new ol.expr.Literal(
          /** @type {string} */ (ol.style.PolygonDefaults.fillColor));
    }

    if (goog.isDefAndNotNull(options.fillOpacity)) {
      fillOpacity = (options.fillOpacity instanceof ol.expr.Expression) ?
          options.fillOpacity :
          new ol.expr.Literal(options.fillOpacity);
    } else {
      fillOpacity = new ol.expr.Literal(
          /** @type {number} */ (ol.style.PolygonDefaults.fillOpacity));
    }

  }

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.fillColor_ = fillColor;

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.fillOpacity_ = fillOpacity;


  // stroke handling - if any stroke property is supplied, use defaults
  var strokeColor = null,
      strokeOpacity = null,
      strokeWidth = null;

  if (goog.isDefAndNotNull(options.strokeColor) ||
      goog.isDefAndNotNull(options.strokeOpacity) ||
      goog.isDefAndNotNull(options.strokeWidth)) {

    if (goog.isDefAndNotNull(options.strokeColor)) {
      strokeColor = (options.strokeColor instanceof ol.expr.Expression) ?
          options.strokeColor :
          new ol.expr.Literal(options.strokeColor);
    } else {
      strokeColor = new ol.expr.Literal(
          /** @type {string} */ (ol.style.PolygonDefaults.strokeColor));
    }

    if (goog.isDefAndNotNull(options.strokeOpacity)) {
      strokeOpacity = (options.strokeOpacity instanceof ol.expr.Expression) ?
          options.strokeOpacity :
          new ol.expr.Literal(options.strokeOpacity);
    } else {
      strokeOpacity = new ol.expr.Literal(
          /** @type {number} */ (ol.style.PolygonDefaults.strokeOpacity));
    }

    if (goog.isDefAndNotNull(options.strokeWidth)) {
      strokeWidth = (options.strokeWidth instanceof ol.expr.Expression) ?
          options.strokeWidth :
          new ol.expr.Literal(options.strokeWidth);
    } else {
      strokeWidth = new ol.expr.Literal(
          /** @type {number} */ (ol.style.PolygonDefaults.strokeWidth));
    }

  }

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.strokeColor_ = strokeColor;

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.strokeOpacity_ = strokeOpacity;

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.strokeWidth_ = strokeWidth;

  // one of stroke or fill can be null, both null is user error
  var fill = !goog.isNull(this.fillColor_) && !goog.isNull(this.fillOpacity_);
  var stroke = !goog.isNull(this.strokeColor_) &&
      !goog.isNull(this.strokeOpacity_) &&
      !goog.isNull(this.strokeWidth_);
  goog.asserts.assert(fill || stroke,
      'Stroke or fill properties must be provided');

};
goog.inherits(ol.style.Polygon, ol.style.Symbolizer);


/**
 * @inheritDoc
 * @return {ol.style.PolygonLiteral} Literal shape symbolizer.
 */
ol.style.Polygon.prototype.createLiteral = function(opt_feature) {

  var fillColor;
  if (!goog.isNull(this.fillColor_)) {
    fillColor = ol.expr.evaluateFeature(this.fillColor_, opt_feature);
    goog.asserts.assertString(fillColor, 'fillColor must be a string');
  }

  var fillOpacity;
  if (!goog.isNull(this.fillOpacity_)) {
    fillOpacity = ol.expr.evaluateFeature(this.fillOpacity_, opt_feature);
    goog.asserts.assertNumber(fillOpacity, 'fillOpacity must be a number');
  }

  var strokeColor;
  if (!goog.isNull(this.strokeColor_)) {
    strokeColor = ol.expr.evaluateFeature(this.strokeColor_, opt_feature);
    goog.asserts.assertString(strokeColor, 'strokeColor must be a string');
  }

  var strokeOpacity;
  if (!goog.isNull(this.strokeOpacity_)) {
    strokeOpacity = ol.expr.evaluateFeature(this.strokeOpacity_, opt_feature);
    goog.asserts.assertNumber(strokeOpacity, 'strokeOpacity must be a number');
  }

  var strokeWidth;
  if (!goog.isNull(this.strokeWidth_)) {
    strokeWidth = ol.expr.evaluateFeature(this.strokeWidth_, opt_feature);
    goog.asserts.assertNumber(strokeWidth, 'strokeWidth must be a number');
  }

  var fill = goog.isDef(fillColor) && goog.isDef(fillOpacity);
  var stroke = goog.isDef(strokeColor) && goog.isDef(strokeOpacity) &&
      goog.isDef(strokeWidth);

  goog.asserts.assert(fill || stroke,
      'either fill or stroke properties must be defined');

  return new ol.style.PolygonLiteral({
    fillColor: fillColor,
    fillOpacity: fillOpacity,
    strokeColor: strokeColor,
    strokeOpacity: strokeOpacity,
    strokeWidth: strokeWidth
  });
};


/**
 * Get the fill color.
 * @return {ol.expr.Expression} Fill color.
 */
ol.style.Polygon.prototype.getFillColor = function() {
  return this.fillColor_;
};


/**
 * Get the fill opacity.
 * @return {ol.expr.Expression} Fill opacity.
 */
ol.style.Polygon.prototype.getFillOpacity = function() {
  return this.fillOpacity_;
};


/**
 * Get the stroke color.
 * @return {ol.expr.Expression} Stroke color.
 */
ol.style.Polygon.prototype.getStrokeColor = function() {
  return this.strokeColor_;
};


/**
 * Get the stroke opacity.
 * @return {ol.expr.Expression} Stroke opacity.
 */
ol.style.Polygon.prototype.getStrokeOpacity = function() {
  return this.strokeOpacity_;
};


/**
 * Get the stroke width.
 * @return {ol.expr.Expression} Stroke width.
 */
ol.style.Polygon.prototype.getStrokeWidth = function() {
  return this.strokeWidth_;
};


/**
 * Set the fill color.
 * @param {ol.expr.Expression} fillColor Fill color.
 */
ol.style.Polygon.prototype.setFillColor = function(fillColor) {
  goog.asserts.assertInstanceof(fillColor, ol.expr.Expression);
  this.fillColor_ = fillColor;
};


/**
 * Set the fill opacity.
 * @param {ol.expr.Expression} fillOpacity Fill opacity.
 */
ol.style.Polygon.prototype.setFillOpacity = function(fillOpacity) {
  goog.asserts.assertInstanceof(fillOpacity, ol.expr.Expression);
  this.fillOpacity_ = fillOpacity;
};


/**
 * Set the stroke color.
 * @param {ol.expr.Expression} strokeColor Stroke color.
 */
ol.style.Polygon.prototype.setStrokeColor = function(strokeColor) {
  goog.asserts.assertInstanceof(strokeColor, ol.expr.Expression);
  this.strokeColor_ = strokeColor;
};


/**
 * Set the stroke opacity.
 * @param {ol.expr.Expression} strokeOpacity Stroke opacity.
 */
ol.style.Polygon.prototype.setStrokeOpacity = function(strokeOpacity) {
  goog.asserts.assertInstanceof(strokeOpacity, ol.expr.Expression);
  this.strokeOpacity_ = strokeOpacity;
};


/**
 * Set the stroke width.
 * @param {ol.expr.Expression} strokeWidth Stroke width.
 */
ol.style.Polygon.prototype.setStrokeWidth = function(strokeWidth) {
  goog.asserts.assertInstanceof(strokeWidth, ol.expr.Expression);
  this.strokeWidth_ = strokeWidth;
};


/**
 * @type {ol.style.PolygonLiteral}
 */
ol.style.PolygonDefaults = new ol.style.PolygonLiteral({
  fillColor: '#ffffff',
  fillOpacity: 0.4,
  strokeColor: '#696969',
  strokeOpacity: 0.8,
  strokeWidth: 1.5
});
