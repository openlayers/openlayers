goog.provide('ol.style.PolygonLiteral');

goog.require('goog.asserts');
goog.require('ol.style.Literal');


/**
 * @typedef {{fillColor: (string|undefined),
 *            fillOpacity: (number|undefined),
 *            strokeColor: (string|undefined),
 *            strokeOpacity: (number|undefined),
 *            strokeWidth: (number|undefined),
 *            zIndex: number}}
 */
ol.style.PolygonLiteralOptions;



/**
 * @constructor
 * @extends {ol.style.Literal}
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

  goog.asserts.assertNumber(
      options.zIndex, 'zIndex must be a number');
  /** @type {number} */
  this.zIndex = options.zIndex;

};
goog.inherits(ol.style.PolygonLiteral, ol.style.Literal);


/**
 * @inheritDoc
 */
ol.style.PolygonLiteral.prototype.equals = function(other) {
  return this.fillColor == other.fillColor &&
      this.fillOpacity == other.fillOpacity &&
      this.strokeColor == other.strokeColor &&
      this.strokeOpacity == other.strokeOpacity &&
      this.strokeWidth == other.strokeWidth &&
      this.zIndex == other.zIndex;
};
