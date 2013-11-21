goog.provide('ol.style.Icon');

goog.require('goog.asserts');
goog.require('ol.Feature');
goog.require('ol.expr');
goog.require('ol.expr.Expression');
goog.require('ol.expr.Literal');
goog.require('ol.geom.GeometryType');
goog.require('ol.style.IconLiteral');
goog.require('ol.style.Point');



/**
 * @constructor
 * @extends {ol.style.Point}
 * @param {ol.style.IconOptions} options Icon options.
 * @todo stability experimental
 */
ol.style.Icon = function(options) {
  goog.base(this);

  goog.asserts.assert(options.url, 'url must be set');

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.url_ = (options.url instanceof ol.expr.Expression) ?
          options.url : new ol.expr.Literal(options.url);

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.width_ = !goog.isDef(options.width) ?
      null :
      (options.width instanceof ol.expr.Expression) ?
          options.width : new ol.expr.Literal(options.width);

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.height_ = !goog.isDef(options.height) ?
      null :
      (options.height instanceof ol.expr.Expression) ?
          options.height : new ol.expr.Literal(options.height);

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.opacity_ = !goog.isDef(options.opacity) ?
      new ol.expr.Literal(ol.style.IconDefaults.opacity) :
      (options.opacity instanceof ol.expr.Expression) ?
          options.opacity : new ol.expr.Literal(options.opacity);

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.rotation_ = !goog.isDef(options.rotation) ?
      new ol.expr.Literal(ol.style.IconDefaults.rotation) :
      (options.rotation instanceof ol.expr.Expression) ?
          options.rotation : new ol.expr.Literal(options.rotation);

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.xOffset_ = !goog.isDef(options.xOffset) ?
      new ol.expr.Literal(ol.style.IconDefaults.xOffset) :
      (options.xOffset instanceof ol.expr.Expression) ?
          options.xOffset : new ol.expr.Literal(options.xOffset);

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.yOffset_ = !goog.isDef(options.yOffset) ?
      new ol.expr.Literal(ol.style.IconDefaults.yOffset) :
      (options.yOffset instanceof ol.expr.Expression) ?
          options.yOffset : new ol.expr.Literal(options.yOffset);

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.zIndex_ = !goog.isDefAndNotNull(options.zIndex) ?
      new ol.expr.Literal(ol.style.IconDefaults.zIndex) :
      (options.zIndex instanceof ol.expr.Expression) ?
          options.zIndex : new ol.expr.Literal(options.zIndex);

};
goog.inherits(ol.style.Icon, ol.style.Point);


/**
 * @inheritDoc
 * @return {ol.style.IconLiteral} Literal shape symbolizer.
 */
ol.style.Icon.prototype.createLiteral = function(featureOrType) {
  var feature, type;
  if (featureOrType instanceof ol.Feature) {
    feature = featureOrType;
    var geometry = feature.getGeometry();
    type = geometry ? geometry.getType() : null;
  } else {
    type = featureOrType;
  }

  var literal = null;
  if (type === ol.geom.GeometryType.POINT ||
      type === ol.geom.GeometryType.MULTIPOINT) {

    var url = ol.expr.evaluateFeature(this.url_, feature);
    goog.asserts.assertString(url, 'url must be a string');
    goog.asserts.assert(url != '#', 'url must not be "#"');

    var width;
    if (!goog.isNull(this.width_)) {
      width = Number(ol.expr.evaluateFeature(this.width_, feature));
      goog.asserts.assert(!isNaN(width), 'width must be a number');
    }

    var height;
    if (!goog.isNull(this.height_)) {
      height = Number(ol.expr.evaluateFeature(this.height_, feature));
      goog.asserts.assertNumber(height, 'height must be a number');
    }

    var opacity = Number(ol.expr.evaluateFeature(this.opacity_, feature));
    goog.asserts.assert(!isNaN(opacity), 'opacity must be a number');

    var rotation = Number(ol.expr.evaluateFeature(this.rotation_, feature));
    goog.asserts.assert(!isNaN(rotation), 'rotation must be a number');

    var xOffset = Number(ol.expr.evaluateFeature(this.xOffset_, feature));
    goog.asserts.assert(!isNaN(xOffset), 'xOffset must be a number');

    var yOffset = Number(ol.expr.evaluateFeature(this.yOffset_, feature));
    goog.asserts.assert(!isNaN(yOffset), 'yOffset must be a number');

    var zIndex = Number(ol.expr.evaluateFeature(this.zIndex_, feature));
    goog.asserts.assert(!isNaN(zIndex), 'zIndex must be a number');

    literal = new ol.style.IconLiteral({
      url: url,
      width: width,
      height: height,
      opacity: opacity,
      rotation: rotation,
      xOffset: xOffset,
      yOffset: yOffset,
      zIndex: zIndex
    });
  }

  return literal;
};


/**
 * Get the height.
 * @return {ol.expr.Expression} Icon height.
 */
ol.style.Icon.prototype.getHeight = function() {
  return this.height_;
};


/**
 * Get the opacity.
 * @return {ol.expr.Expression} Opacity.
 */
ol.style.Icon.prototype.getOpacity = function() {
  return this.opacity_;
};


/**
 * Get the rotation.
 * @return {ol.expr.Expression} Icon rotation.
 */
ol.style.Icon.prototype.getRotation = function() {
  return this.rotation_;
};


/**
 * Get the URL.
 * @return {ol.expr.Expression} Icon URL.
 */
ol.style.Icon.prototype.getUrl = function() {
  return this.url_;
};


/**
 * Get the width.
 * @return {ol.expr.Expression} Icon width.
 */
ol.style.Icon.prototype.getWidth = function() {
  return this.width_;
};


/**
 * Get the xOffset.
 * @return {ol.expr.Expression} Icon xOffset.
 */
ol.style.Icon.prototype.getXOffset = function() {
  return this.xOffset_;
};


/**
 * Get the yOffset.
 * @return {ol.expr.Expression} Icon yOffset.
 */
ol.style.Icon.prototype.getYOffset = function() {
  return this.yOffset_;
};


/**
 * Get the zIndex.
 * @return {ol.expr.Expression} Icon zIndex.
 */
ol.style.Icon.prototype.getZIndex = function() {
  return this.zIndex_;
};


/**
 * Set the height.
 * @param {ol.expr.Expression} height Icon height.
 */
ol.style.Icon.prototype.setHeight = function(height) {
  goog.asserts.assertInstanceof(height, ol.expr.Expression);
  this.height_ = height;
};


/**
 * Set the opacity.
 * @param {ol.expr.Expression} opacity Opacity.
 */
ol.style.Icon.prototype.setOpacity = function(opacity) {
  goog.asserts.assertInstanceof(opacity, ol.expr.Expression);
  this.opacity_ = opacity;
};


/**
 * Set the rotation.
 * @param {ol.expr.Expression} rotation Icon rotation.
 */
ol.style.Icon.prototype.setRotation = function(rotation) {
  goog.asserts.assertInstanceof(rotation, ol.expr.Expression);
  this.rotation_ = rotation;
};


/**
 * Set the URL.
 * @param {ol.expr.Expression} url Icon URL.
 */
ol.style.Icon.prototype.setUrl = function(url) {
  goog.asserts.assertInstanceof(url, ol.expr.Expression);
  this.url_ = url;
};


/**
 * Set the width.
 * @param {ol.expr.Expression} width Icon width.
 */
ol.style.Icon.prototype.setWidth = function(width) {
  goog.asserts.assertInstanceof(width, ol.expr.Expression);
  this.width_ = width;
};


/**
 * Set the xOffset.
 * @param {ol.expr.Expression} xOffset Icon xOffset.
 */
ol.style.Icon.prototype.setXOffset = function(xOffset) {
  goog.asserts.assertInstanceof(xOffset, ol.expr.Expression);
  this.xOffset_ = xOffset;
};


/**
 * Set the yOffset.
 * @param {ol.expr.Expression} yOffset Icon yOffset.
 */
ol.style.Icon.prototype.setYOffset = function(yOffset) {
  goog.asserts.assertInstanceof(yOffset, ol.expr.Expression);
  this.yOffset_ = yOffset;
};


/**
 * Set the zIndex.
 * @param {ol.expr.Expression} zIndex Icon zIndex.
 */
ol.style.Icon.prototype.setZIndex = function(zIndex) {
  goog.asserts.assertInstanceof(zIndex, ol.expr.Expression);
  this.zIndex_ = zIndex;
};


/**
 * @typedef {{opacity: number,
 *            rotation: number,
 *            xOffset: number,
 *            yOffset: number,
 *            zIndex: number}}
 */
ol.style.IconDefaults = {
  opacity: 1,
  rotation: 0,
  xOffset: 0,
  yOffset: 0,
  zIndex: 0
};
