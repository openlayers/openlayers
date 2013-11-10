goog.provide('ol.layer.Vector');

goog.require('ol.layer.Layer');
goog.require('ol.source.Vector');


/**
 * @enum {string}
 */
ol.layer.VectorProperty = {
  RENDER_FEATURE_FUNCTION: 'renderFeatureFunction',
  STYLE_FUNCTION: 'styleFunction'
};



/**
 * @constructor
 * @extends {ol.layer.Layer}
 * @param {ol.layer.VectorOptions=} opt_options Options.
 */
ol.layer.Vector = function(opt_options) {

  var options = goog.isDef(opt_options) ?
      opt_options : /** @type {ol.layer.VectorOptions} */ ({});

  goog.base(this, /** @type {ol.layer.LayerOptions} */ (options));

  // FIXME veryify this
  if (goog.isDef(options.styleFunction)) {
    this.setStyleFunction(options.styleFunction);
  }

};
goog.inherits(ol.layer.Vector, ol.layer.Layer);


/**
 * @return {function(ol.Feature): boolean|undefined} Render feature function.
 */
ol.layer.Vector.prototype.getRenderFeatureFunction = function() {
  return /** @type {function(ol.Feature): boolean|undefined} */ (
      this.get(ol.layer.VectorProperty.RENDER_FEATURE_FUNCTION));
};
goog.exportProperty(
    ol.layer.Vector.prototype,
    'getRenderFeatureFunction',
    ol.layer.Vector.prototype.getRenderFeatureFunction);


/**
 * @return {ol.style.StyleFunction|undefined} Style function.
 */
ol.layer.Vector.prototype.getStyleFunction = function() {
  return /** @type {ol.style.StyleFunction|undefined} */ (
      this.get(ol.layer.VectorProperty.STYLE_FUNCTION));
};
goog.exportProperty(
    ol.layer.Vector.prototype,
    'getStyleFunction',
    ol.layer.Vector.prototype.getStyleFunction);


/**
 * @return {ol.source.Source} Vector source.
 */
ol.layer.Vector.prototype.getVectorSource = function() {
  return /** @type {ol.source.Vector} */ (this.getSource());
};


/**
 * @param {function(ol.Feature): boolean|undefined} renderFeatureFunction
 *     Render feature function.
 */
ol.layer.Vector.prototype.setRenderFeatureFunction =
    function(renderFeatureFunction) {
  this.set(
      ol.layer.VectorProperty.RENDER_FEATURE_FUNCTION, renderFeatureFunction);
};
goog.exportProperty(
    ol.layer.Vector.prototype,
    'setRenderFeatureFunction',
    ol.layer.Vector.prototype.setRenderFeatureFunction);


/**
 * @param {ol.style.StyleFunction|undefined} styleFunction Style function.
 */
ol.layer.Vector.prototype.setStyleFunction = function(styleFunction) {
  this.set(ol.layer.VectorProperty.STYLE_FUNCTION, styleFunction);
};
goog.exportProperty(
    ol.layer.Vector.prototype,
    'setStyleFunction',
    ol.layer.Vector.prototype.setStyleFunction);
