goog.provide('ol.layer.Vector');

goog.require('ol.feature');
goog.require('ol.layer.Layer');


/**
 * @enum {string}
 */
ol.layer.VectorProperty = {
  RENDER_GEOMETRY_FUNCTIONS: 'renderGeometryFunctions',
  STYLE_FUNCTION: 'styleFunction'
};



/**
 * @constructor
 * @extends {ol.layer.Layer}
 * @param {olx.layer.VectorOptions=} opt_options Options.
 */
ol.layer.Vector = function(opt_options) {

  var options = goog.isDef(opt_options) ?
      opt_options : /** @type {olx.layer.VectorOptions} */ ({});

  goog.base(this, /** @type {olx.layer.LayerOptions} */ (options));

  // FIXME veryify this
  if (goog.isDef(options.styleFunction)) {
    this.setStyleFunction(options.styleFunction);
  }

};
goog.inherits(ol.layer.Vector, ol.layer.Layer);


/**
 * @return {ol.Collection|undefined} Render geometry functions.
 */
ol.layer.Vector.prototype.getRenderGeometryFunctions = function() {
  return /** @type {ol.Collection|undefined} */ (
      this.get(ol.layer.VectorProperty.RENDER_GEOMETRY_FUNCTIONS));
};
goog.exportProperty(
    ol.layer.Vector.prototype,
    'getRenderGeometryFunctions',
    ol.layer.Vector.prototype.getRenderGeometryFunctions);


/**
 * @return {ol.feature.StyleFunction|undefined} Style function.
 */
ol.layer.Vector.prototype.getStyleFunction = function() {
  return /** @type {ol.feature.StyleFunction|undefined} */ (
      this.get(ol.layer.VectorProperty.STYLE_FUNCTION));
};
goog.exportProperty(
    ol.layer.Vector.prototype,
    'getStyleFunction',
    ol.layer.Vector.prototype.getStyleFunction);


/**
 * @param {ol.Collection|undefined} renderGeometryFunctions Render geometry
 *     functions.
 */
ol.layer.Vector.prototype.setRenderGeometryFunctions =
    function(renderGeometryFunctions) {
  this.set(ol.layer.VectorProperty.RENDER_GEOMETRY_FUNCTIONS,
      renderGeometryFunctions);
};
goog.exportProperty(
    ol.layer.Vector.prototype,
    'setRenderGeometryFunctions',
    ol.layer.Vector.prototype.setRenderGeometryFunctions);


/**
 * @param {ol.feature.StyleFunction|undefined} styleFunction Style function.
 */
ol.layer.Vector.prototype.setStyleFunction = function(styleFunction) {
  this.set(ol.layer.VectorProperty.STYLE_FUNCTION, styleFunction);
};
goog.exportProperty(
    ol.layer.Vector.prototype,
    'setStyleFunction',
    ol.layer.Vector.prototype.setStyleFunction);
