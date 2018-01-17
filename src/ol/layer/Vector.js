/**
 * @module ol/layer/Vector
 */
import {inherits} from '../index.js';
import LayerType from '../LayerType.js';
import Layer from '../layer/Layer.js';
import _ol_layer_VectorRenderType_ from '../layer/VectorRenderType.js';
import {assign} from '../obj.js';
import Style from '../style/Style.js';


/**
 * @enum {string}
 * @private
 */
const Property = {
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
const VectorLayer = function(opt_options) {
  const options = opt_options ?
    opt_options : /** @type {olx.layer.VectorOptions} */ ({});

  const baseOptions = assign({}, options);

  delete baseOptions.style;
  delete baseOptions.renderBuffer;
  delete baseOptions.updateWhileAnimating;
  delete baseOptions.updateWhileInteracting;
  Layer.call(this, /** @type {olx.layer.LayerOptions} */ (baseOptions));

  /**
   * @private
   * @type {boolean}
   */
  this.declutter_ = options.declutter !== undefined ? options.declutter : false;

  /**
   * @type {number}
   * @private
   */
  this.renderBuffer_ = options.renderBuffer !== undefined ?
    options.renderBuffer : 100;

  /**
   * User provided style.
   * @type {ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction}
   * @private
   */
  this.style_ = null;

  /**
   * Style function for use within the library.
   * @type {ol.StyleFunction|undefined}
   * @private
   */
  this.styleFunction_ = undefined;

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
   * @private
   * @type {ol.layer.VectorTileRenderType|string}
   */
  this.renderMode_ = options.renderMode || _ol_layer_VectorRenderType_.VECTOR;

  /**
   * The layer type.
   * @protected
   * @type {ol.LayerType}
   */
  this.type = LayerType.VECTOR;

};

inherits(VectorLayer, Layer);


/**
 * @return {boolean} Declutter.
 */
VectorLayer.prototype.getDeclutter = function() {
  return this.declutter_;
};


/**
 * @param {boolean} declutter Declutter.
 */
VectorLayer.prototype.setDeclutter = function(declutter) {
  this.declutter_ = declutter;
};


/**
 * @return {number|undefined} Render buffer.
 */
VectorLayer.prototype.getRenderBuffer = function() {
  return this.renderBuffer_;
};


/**
 * @return {function(ol.Feature, ol.Feature): number|null|undefined} Render
 *     order.
 */
VectorLayer.prototype.getRenderOrder = function() {
  return (/** @type {ol.RenderOrderFunction|null|undefined} */ this.get(Property.RENDER_ORDER));
};


/**
 * Return the associated {@link ol.source.Vector vectorsource} of the layer.
 * @function
 * @return {ol.source.Vector} Source.
 * @api
 */
VectorLayer.prototype.getSource;


/**
 * Get the style for features.  This returns whatever was passed to the `style`
 * option at construction or to the `setStyle` method.
 * @return {ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction}
 *     Layer style.
 * @api
 */
VectorLayer.prototype.getStyle = function() {
  return this.style_;
};


/**
 * Get the style function.
 * @return {ol.StyleFunction|undefined} Layer style function.
 * @api
 */
VectorLayer.prototype.getStyleFunction = function() {
  return this.styleFunction_;
};


/**
 * @return {boolean} Whether the rendered layer should be updated while
 *     animating.
 */
VectorLayer.prototype.getUpdateWhileAnimating = function() {
  return this.updateWhileAnimating_;
};


/**
 * @return {boolean} Whether the rendered layer should be updated while
 *     interacting.
 */
VectorLayer.prototype.getUpdateWhileInteracting = function() {
  return this.updateWhileInteracting_;
};


/**
 * @param {ol.RenderOrderFunction|null|undefined} renderOrder
 *     Render order.
 */
VectorLayer.prototype.setRenderOrder = function(renderOrder) {
  this.set(Property.RENDER_ORDER, renderOrder);
};


/**
 * Set the style for features.  This can be a single style object, an array
 * of styles, or a function that takes a feature and resolution and returns
 * an array of styles. If it is `undefined` the default style is used. If
 * it is `null` the layer has no style (a `null` style), so only features
 * that have their own styles will be rendered in the layer. See
 * {@link ol.style} for information on the default style.
 * @param {ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction|null|undefined}
 *     style Layer style.
 * @api
 */
VectorLayer.prototype.setStyle = function(style) {
  this.style_ = style !== undefined ? style : Style.defaultFunction;
  this.styleFunction_ = style === null ?
    undefined : Style.createFunction(this.style_);
  this.changed();
};


/**
 * @return {ol.layer.VectorRenderType|string} The render mode.
 */
VectorLayer.prototype.getRenderMode = function() {
  return this.renderMode_;
};


export default VectorLayer;
