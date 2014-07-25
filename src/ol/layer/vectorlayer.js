goog.provide('ol.layer.Vector');

goog.require('goog.object');
goog.require('ol.layer.Layer');
goog.require('ol.style.Style');


/**
 * @enum {string}
 */
ol.layer.VectorProperty = {
  RENDER_ORDER: 'renderOrder'
};



/**
 * @classdesc
 * Vector data that is rendered client-side.
 * Note that any property set in the options is set as a {@link ol.Object}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @constructor
 * @extends {ol.layer.Layer}
 * @fires ol.render.Event
 * @param {olx.layer.VectorOptions=} opt_options Options.
 * @api
 */
ol.layer.Vector = function(opt_options) {

  var options = goog.isDef(opt_options) ?
      opt_options : /** @type {olx.layer.VectorOptions} */ ({});

  var baseOptions = goog.object.clone(options);

  delete baseOptions.style;
  goog.base(this, /** @type {olx.layer.LayerOptions} */ (baseOptions));

  /**
   * User provided style.
   * @type {ol.style.Style|Array.<ol.style.Style>|ol.style.StyleFunction}
   * @private
   */
  this.style_ = null;

  /**
   * Style function for use within the library.
   * @type {ol.style.StyleFunction|undefined}
   * @private
   */
  this.styleFunction_ = undefined;

  this.setStyle(goog.isDefAndNotNull(options.style) ?
      options.style : ol.style.defaultStyleFunction);

};
goog.inherits(ol.layer.Vector, ol.layer.Layer);


/**
 * @return {function(ol.Feature, ol.Feature): number|null|undefined} Render
 *     order.
 */
ol.layer.Vector.prototype.getRenderOrder = function() {
  return /** @type {function(ol.Feature, ol.Feature):number|null|undefined} */ (
      this.get(ol.layer.VectorProperty.RENDER_ORDER));
};


/**
 * Get the style for features.  This returns whatever was passed to the `style`
 * option at construction or to the `setStyle` method.
 * @return {ol.style.Style|Array.<ol.style.Style>|ol.style.StyleFunction}
 *     Layer style.
 * @api
 */
ol.layer.Vector.prototype.getStyle = function() {
  return this.style_;
};


/**
 * Get the style function.
 * @return {ol.style.StyleFunction|undefined} Layer style function.
 * @api
 */
ol.layer.Vector.prototype.getStyleFunction = function() {
  return this.styleFunction_;
};


/**
 * @param {function(ol.Feature, ol.Feature):number|null|undefined} renderOrder
 *     Render order.
 */
ol.layer.Vector.prototype.setRenderOrder = function(renderOrder) {
  this.set(ol.layer.VectorProperty.RENDER_ORDER, renderOrder);
};


/**
 * Set the style for features.  This can be a single style object, an array
 * of styles, or a function that takes a feature and resolution and returns
 * an array of styles.
 * @param {ol.style.Style|Array.<ol.style.Style>|ol.style.StyleFunction} style
 *     Layer style.
 * @api
 */
ol.layer.Vector.prototype.setStyle = function(style) {
  this.style_ = style;
  this.styleFunction_ = ol.style.createStyleFunction(style);
  this.dispatchChangeEvent();
};
