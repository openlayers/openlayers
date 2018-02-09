/**
 * @module ol/layer/Raster
 */
import {inherits} from '../index.js';
import ImageLayer from '../layer/Image.js';
import Monochrome from '../style/Monochrome.js';
import {assign} from '../obj.js';

/**
 * @classdesc
 * Coverage data rendered as a traditional raster layer.
 * Note that any property set in the options is set as a {@link ol.Object}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @constructor
 * @extends {ol.layer.Image}
 * @fires ol.render.Event
 * @param {olx.layer.RasterOptions=} opt_options Layer options.
 * @api
 */
const RasterLayer = function(opt_options) {
  const options = opt_options ?
    opt_options : /** @type {olx.layer.RasterOptions} */ ({});

  const baseOptions = assign({}, options);

  delete baseOptions.style;
  delete baseOptions.coverageDrawFunction;
  ImageLayer.call(this, /** @type {olx.layer.ImageOptions} */ (baseOptions));

  /**
   * User provided style.
   * @type {ol.CoverageStyle|null}
   * @private
   */
  this.style_ = null;

  /**
   * User provided coverage draw function.
   * @type {ol.CoverageDrawFunctionType|null}
   * @private
   */
  this.coverageDrawFunction_ = null;

  this.setStyle(options.style);
  this.setCoverageDrawFunction(options.coverageDrawFunction);

};

inherits(RasterLayer, ImageLayer);


/**
 * Returns the coverage draw function associated to this layer, if any.
 * @return {ol.CoverageDrawFunctionType|null} Coverage draw function.
 * @api
 */
RasterLayer.prototype.getCoverageDrawFunction = function() {
  return this.coverageDrawFunction_;
};


/**
 * Return the associated source of the raster layer.
 * @function
 * @return {ol.source.Coverage} Source.
 * @api
 */
RasterLayer.prototype.getSource;


/**
 * Get the style for cells. This returns whatever was passed to the `style`
 * option at construction or to the `setStyle` method.
 * @return {ol.CoverageStyle|null} Layer style.
 * @api
 */
RasterLayer.prototype.getStyle = function() {
  return this.style_;
};


/**
 * Set the coverage draw function, which is a function getting styled coverage
 * data with basic coverage properties, and expecting a HTML5 Canvas element
 * as a result.
 * @param {ol.CoverageDrawFunctionType|null|undefined} coverageDrawFunc Coverage draw function.
 * @api
 */
RasterLayer.prototype.setCoverageDrawFunction = function(coverageDrawFunc) {
  this.coverageDrawFunction_ = coverageDrawFunc !== undefined ?
    coverageDrawFunc : null;
  if (this.getSource()) {
    this.getSource().setCoverageDrawFunction(this.coverageDrawFunction_);
  }
  this.changed();
};


/**
 * Set the style for cells.  This can be a single style object. If it is
 *`undefined` the default style is used. If it is `null` the layer has no style
 * (a `null` style), so it will not be rendered. See {@link ol.style} for
 * information on the default style.
 * @param {ol.CoverageStyle|null|undefined} style Layer style.
 * @api
 */
RasterLayer.prototype.setStyle = function(style) {
  this.style_ = style !== undefined ? style : Monochrome.defaultStyle();
  if (this.getSource()) {
    this.getSource().setStyle(this.style_);
  }
  this.changed();
};


/**
 * @inheritDoc
 */
RasterLayer.prototype.setSource = function(source) {
  ImageLayer.prototype.setSource.call(this, source);
  /** @type {ol.source.Coverage} */ (source).setStyle(this.getStyle());
  /** @type {ol.source.Coverage} */ (source).setCoverageDrawFunction(
    this.getCoverageDrawFunction());
};
export default RasterLayer;
