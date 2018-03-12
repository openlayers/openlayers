/**
 * @module ol/layer/Coverage
 */
import {inherits} from '../index.js';
import {UNDEFINED} from '../functions.js';
import {assign} from '../obj.js';
import LayerType from '../LayerType.js';
import Layer from '../layer/Layer.js';
import Monochrome from '../style/Monochrome.js';

/**
 * @classdesc
 * Coverage layers rendered on the client side as vectors.
 * Note that any property set in the options is set as a {@link ol.Object}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @constructor
 * @extends {ol.layer.Layer}
 * @fires ol.render.Event
 * @param {olx.layer.CoverageOptions=} opt_options Layer options.
 * @api
 */
const CoverageLayer = function(opt_options) {
  const options = opt_options ?
    opt_options : /** @type {olx.layer.CoverageOptions} */ ({});

  const baseOptions = assign({}, options);

  delete baseOptions.style;
  delete baseOptions.updateWhileAnimating;
  delete baseOptions.updateWhileInteracting;
  Layer.call(this, /** @type {olx.layer.LayerOptions} */ (baseOptions));

  /**
   * User provided style.
   * @type {ol.CoverageStyle|null}
   * @private
   */
  this.style_ = options.style !== undefined ? options.style : Monochrome.defaultStyle();

  /**
   * Cosmetic stroke width provided by the user.
   * @type {number}
   * @private
   */
  this.stroke_ = options.strokeWidth;

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
  this.type = LayerType.COVERAGE;

};

inherits(CoverageLayer, Layer);


/**
 * Dummy function for compatibility reasons.
 * @return {undefined} False.
 */
CoverageLayer.prototype.getDeclutter = UNDEFINED;


/**
 * Return the associated source of the raster layer.
 * @function
 * @return {ol.source.Coverage} Source.
 * @api
 */
CoverageLayer.prototype.getSource;


/**
 * @return {number} Stroke width.
 */
CoverageLayer.prototype.getStroke = function() {
  return this.stroke_;
};


/**
 * Get the style for cells. This returns whatever was passed to the `style`
 * option at construction or to the `setStyle` method.
 * @return {ol.CoverageStyle|null} Layer style.
 * @api
 */
CoverageLayer.prototype.getStyle = function() {
  return this.style_;
};


/**
 * @return {boolean} Whether the rendered layer should be updated while
 *     animating.
 */
CoverageLayer.prototype.getUpdateWhileAnimating = function() {
  return this.updateWhileAnimating_;
};


/**
 * @return {boolean} Whether the rendered layer should be updated while
 *     interacting.
 */
CoverageLayer.prototype.getUpdateWhileInteracting = function() {
  return this.updateWhileInteracting_;
};


/**
 * Set the style for cells. This can be a single style object. If it is
 * `undefined` the default style is used. If it is `null` the layer has no style
 * (a `null` style), so it will not be rendered. See {@link ol.style} for
 * information on the default style.
 * @param {ol.CoverageStyle|null|undefined} style Layer style.
 * @api
 */
CoverageLayer.prototype.setStyle = function(style) {
  this.style_ = style !== undefined ? style : Monochrome.defaultStyle();
  this.changed();
};


export default CoverageLayer;
