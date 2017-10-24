goog.provide('ol.layer.Raster');

goog.require('ol');
goog.require('ol.LayerType');
goog.require('ol.layer.Layer');
goog.require('ol.obj');
goog.require('ol.style.Monochrome');


/**
 * @classdesc
 * Raster data that is rendered client-side.
 * Note that any property set in the options is set as a {@link ol.Object}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @constructor
 * @extends {ol.layer.Layer}
 * @fires ol.render.Event
 * @param {olx.layer.RasterOptions=} opt_options Layer options.
 * @api
 */
ol.layer.Raster = function(opt_options) {
  var options = opt_options ?
    opt_options : /** @type {olx.layer.RasterOptions} */ ({});

  var baseOptions = ol.obj.assign({}, options);

  delete baseOptions.style;
  delete baseOptions.updateWhileAnimating;
  delete baseOptions.updateWhileInteracting;
  ol.layer.Layer.call(this, /** @type {olx.layer.LayerOptions} */ (baseOptions));

  /**
   * User provided style.
   * @type {ol.RasterStyle}
   * @private
   */
  this.style_ = null;

  this.setStyle(options.style);

  /**
   * @type {boolean}
   * @private
   */
  this.updateWhileAnimating_ = options.updateWhileAnimating !== undefined ?
    options.updateWhileAnimating : false;

  /**
   * @type {boolean}
   * @private
   */
  this.updateWhileInteracting_ = options.updateWhileInteracting !== undefined ?
    options.updateWhileInteracting : false;

  /**
   * The layer type.
   * @protected
   * @type {ol.LayerType}
   */
  this.type = ol.LayerType.RASTER;

};
ol.inherits(ol.layer.Raster, ol.layer.Layer);


/**
 * Return the associated source of the raster layer.
 * @function
 * @return {ol.source.RasterBase} Source.
 * @api
 */
ol.layer.Raster.prototype.getSource;


/**
 * Get the style for cells. This returns whatever was passed to the `style`
 * option at construction or to the `setStyle` method.
 * @return {ol.style.Monochrome|ol.style.Pseudocolor|ol.style.RGB} Layer style.
 * @api
 */
ol.layer.Raster.prototype.getStyle = function() {
  return this.style_;
};


/**
 * @return {boolean} Whether the rendered layer should be updated while
 *     animating.
 */
ol.layer.Raster.prototype.getUpdateWhileAnimating = function() {
  return this.updateWhileAnimating_;
};


/**
 * @return {boolean} Whether the rendered layer should be updated while
 *     interacting.
 */
ol.layer.Raster.prototype.getUpdateWhileInteracting = function() {
  return this.updateWhileInteracting_;
};


/**
 * Set the style for cells.  This can be a single style object. If it is
 *`undefined` the default style is used. If it is `null` the layer has no style
 * (a `null` style), so it will not be rendered. See {@link ol.style} for
 * information on the default style.
 * @param {ol.RasterStyle|null|undefined}
 * style Layer style.
 * @api
 */
ol.layer.Raster.prototype.setStyle = function(style) {
  this.style_ = style !== undefined ? style : ol.style.Monochrome.defaultStyle();
  this.changed();
};
