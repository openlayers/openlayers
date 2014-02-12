goog.provide('ol.layer.Vector');

goog.require('goog.object');
goog.require('ol.feature');
goog.require('ol.layer.Layer');


/**
 * @enum {string}
 */
ol.layer.VectorProperty = {
  RENDER_GEOMETRY_FUNCTIONS: 'renderGeometryFunctions'
};



/**
 * @constructor
 * @extends {ol.layer.Layer}
 * @param {olx.layer.VectorOptions=} opt_options Options.
 * @todo stability experimental
 */
ol.layer.Vector = function(opt_options) {

  var options = goog.isDef(opt_options) ?
      opt_options : /** @type {olx.layer.VectorOptions} */ ({});

  var baseOptions = /** @type {olx.layer.LayerOptions} */
      (goog.object.clone(options));

  delete baseOptions.style;
  goog.base(this, baseOptions);

  /**
   * User provided style.
   * @type {ol.style.Style|Array.<ol.style.Style>|ol.feature.StyleFunction}
   * @private
   */
  this.style_ = null;

  /**
   * Style function for use within the library.
   * @type {ol.feature.StyleFunction}
   * @private
   */
  this.styleFunction_;

  if (goog.isDef(options.style)) {
    this.setStyle(options.style);
  }

};
goog.inherits(ol.layer.Vector, ol.layer.Layer);


/**
 * @return {ol.Collection|undefined} Render geometry functions.
 * @todo stability experimental
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
 * @return {ol.style.Style|Array.<ol.style.Style>|ol.feature.StyleFunction}
 *     Layer style.
 * @todo stability experimental
 */
ol.layer.Vector.prototype.getStyle = function() {
  return this.style_;
};


/**
 * @return {ol.feature.StyleFunction} Layer style function.
 * @todo stability experimental
 */
ol.layer.Vector.prototype.getStyleFunction = function() {
  return this.styleFunction_;
};


/**
 * @param {ol.Collection|undefined} renderGeometryFunctions Render geometry
 *     functions.
 * @todo stability experimental
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
 * If the styles are changed by setting a new style function or by changing the
 * value returned by the style function then `dispatchChangeEvent` should be
 * called on the layer for the layer to be refreshed on the screen.
 * @param {ol.style.Style|Array.<ol.style.Style>|ol.feature.StyleFunction} style
 *     Layer style.
 * @todo stability experimental
 */
ol.layer.Vector.prototype.setStyle = function(style) {
  this.style_ = style;
  this.styleFunction_ = ol.feature.createStyleFunction(style);
  this.dispatchChangeEvent();
};
