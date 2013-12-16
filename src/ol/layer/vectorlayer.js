goog.provide('ol.layer.Vector');

goog.require('ol.layer.Layer');
goog.require('ol.source.Vector');


/**
 * @enum {string}
 */
ol.layer.VectorProperty = {
  RENDER_GEOMETRY_FUNCTION: 'renderGeometryFunction',
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
 * @param {ol.Feature} feature Feature.
 * @param {number} resolution Resolution.
 * @return {Array.<ol.style.Style>} Styles.
 */
ol.layer.Vector.defaultStyleFunction = function(feature, resolution) {
  var featureStyleFunction = feature.getStyleFunction();
  if (goog.isDef(featureStyleFunction)) {
    return featureStyleFunction.call(feature, resolution);
  } else {
    return null;
  }
};


/**
 * @return {function(ol.geom.Geometry): boolean|undefined} Render geometry
 *     function.
 */
ol.layer.Vector.prototype.getRenderGeometryFunction = function() {
  return /** @type {function(ol.geom.Geometry): boolean|undefined} */ (
      this.get(ol.layer.VectorProperty.RENDER_GEOMETRY_FUNCTION));
};
goog.exportProperty(
    ol.layer.Vector.prototype,
    'getRenderGeometryFunction',
    ol.layer.Vector.prototype.getRenderGeometryFunction);


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
 * @param {function(ol.geom.Geometry): boolean|undefined} renderGeometryFunction
 *     Render geometry function.
 */
ol.layer.Vector.prototype.setRenderGeometryFunction =
    function(renderGeometryFunction) {
  this.set(
      ol.layer.VectorProperty.RENDER_GEOMETRY_FUNCTION, renderGeometryFunction);
};
goog.exportProperty(
    ol.layer.Vector.prototype,
    'setRenderGeometryFunction',
    ol.layer.Vector.prototype.setRenderGeometryFunction);


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
