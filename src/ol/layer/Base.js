/**
 * @module ol/layer/Base
 */
import {inherits} from '../util.js';
import BaseObject from '../Object.js';
import LayerProperty from '../layer/Property.js';
import {clamp} from '../math.js';
import {assign} from '../obj.js';


/**
 * @typedef {Object} Options
 * @property {number} [opacity=1] Opacity (0, 1).
 * @property {boolean} [visible=true] Visibility.
 * @property {module:ol/extent~Extent} [extent] The bounding extent for layer rendering.  The layer will not be
 * rendered outside of this extent.
 * @property {number} [zIndex=0] The z-index for layer rendering.  At rendering time, the layers
 * will be ordered, first by Z-index and then by position.
 * @property {number} [minResolution] The minimum resolution (inclusive) at which this layer will be
 * visible.
 * @property {number} [maxResolution] The maximum resolution (exclusive) below which this layer will
 * be visible.
 */


/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Note that with {@link module:ol/layer/Base} and all its subclasses, any property set in
 * the options is set as a {@link module:ol/Object} property on the layer object, so
 * is observable, and has get/set accessors.
 *
 * @constructor
 * @abstract
 * @extends {module:ol/Object}
 * @param {module:ol/layer/Base~Options} options Layer options.
 * @api
 */
const BaseLayer = function(options) {

  BaseObject.call(this);

  /**
   * @type {Object.<string, *>}
   */
  const properties = assign({}, options);
  properties[LayerProperty.OPACITY] =
      options.opacity !== undefined ? options.opacity : 1;
  properties[LayerProperty.VISIBLE] =
      options.visible !== undefined ? options.visible : true;
  properties[LayerProperty.Z_INDEX] =
      options.zIndex !== undefined ? options.zIndex : 0;
  properties[LayerProperty.MAX_RESOLUTION] =
      options.maxResolution !== undefined ? options.maxResolution : Infinity;
  properties[LayerProperty.MIN_RESOLUTION] =
      options.minResolution !== undefined ? options.minResolution : 0;

  this.setProperties(properties);

  /**
   * @type {module:ol/layer/Layer~State}
   * @private
   */
  this.state_ = /** @type {module:ol/layer/Layer~State} */ ({
    layer: /** @type {module:ol/layer/Layer} */ (this),
    managed: true
  });

  /**
   * The layer type.
   * @type {module:ol/LayerType}
   * @protected;
   */
  this.type;

};

inherits(BaseLayer, BaseObject);


/**
 * Get the layer type (used when creating a layer renderer).
 * @return {module:ol/LayerType} The layer type.
 */
BaseLayer.prototype.getType = function() {
  return this.type;
};


/**
 * @return {module:ol/layer/Layer~State} Layer state.
 */
BaseLayer.prototype.getLayerState = function() {
  this.state_.opacity = clamp(this.getOpacity(), 0, 1);
  this.state_.sourceState = this.getSourceState();
  this.state_.visible = this.getVisible();
  this.state_.extent = this.getExtent();
  this.state_.zIndex = this.getZIndex();
  this.state_.maxResolution = this.getMaxResolution();
  this.state_.minResolution = Math.max(this.getMinResolution(), 0);

  return this.state_;
};


/**
 * @abstract
 * @param {Array.<module:ol/layer/Layer>=} opt_array Array of layers (to be
 *     modified in place).
 * @return {Array.<module:ol/layer/Layer>} Array of layers.
 */
BaseLayer.prototype.getLayersArray = function(opt_array) {};


/**
 * @abstract
 * @param {Array.<module:ol/layer/Layer~State>=} opt_states Optional list of layer
 *     states (to be modified in place).
 * @return {Array.<module:ol/layer/Layer~State>} List of layer states.
 */
BaseLayer.prototype.getLayerStatesArray = function(opt_states) {};


/**
 * Return the {@link module:ol/extent~Extent extent} of the layer or `undefined` if it
 * will be visible regardless of extent.
 * @return {module:ol/extent~Extent|undefined} The layer extent.
 * @observable
 * @api
 */
BaseLayer.prototype.getExtent = function() {
  return (
    /** @type {module:ol/extent~Extent|undefined} */ (this.get(LayerProperty.EXTENT))
  );
};


/**
 * Return the maximum resolution of the layer.
 * @return {number} The maximum resolution of the layer.
 * @observable
 * @api
 */
BaseLayer.prototype.getMaxResolution = function() {
  return /** @type {number} */ (this.get(LayerProperty.MAX_RESOLUTION));
};


/**
 * Return the minimum resolution of the layer.
 * @return {number} The minimum resolution of the layer.
 * @observable
 * @api
 */
BaseLayer.prototype.getMinResolution = function() {
  return /** @type {number} */ (this.get(LayerProperty.MIN_RESOLUTION));
};


/**
 * Return the opacity of the layer (between 0 and 1).
 * @return {number} The opacity of the layer.
 * @observable
 * @api
 */
BaseLayer.prototype.getOpacity = function() {
  return /** @type {number} */ (this.get(LayerProperty.OPACITY));
};


/**
 * @abstract
 * @return {module:ol/source/State} Source state.
 */
BaseLayer.prototype.getSourceState = function() {};


/**
 * Return the visibility of the layer (`true` or `false`).
 * @return {boolean} The visibility of the layer.
 * @observable
 * @api
 */
BaseLayer.prototype.getVisible = function() {
  return /** @type {boolean} */ (this.get(LayerProperty.VISIBLE));
};


/**
 * Return the Z-index of the layer, which is used to order layers before
 * rendering. The default Z-index is 0.
 * @return {number} The Z-index of the layer.
 * @observable
 * @api
 */
BaseLayer.prototype.getZIndex = function() {
  return /** @type {number} */ (this.get(LayerProperty.Z_INDEX));
};


/**
 * Set the extent at which the layer is visible.  If `undefined`, the layer
 * will be visible at all extents.
 * @param {module:ol/extent~Extent|undefined} extent The extent of the layer.
 * @observable
 * @api
 */
BaseLayer.prototype.setExtent = function(extent) {
  this.set(LayerProperty.EXTENT, extent);
};


/**
 * Set the maximum resolution at which the layer is visible.
 * @param {number} maxResolution The maximum resolution of the layer.
 * @observable
 * @api
 */
BaseLayer.prototype.setMaxResolution = function(maxResolution) {
  this.set(LayerProperty.MAX_RESOLUTION, maxResolution);
};


/**
 * Set the minimum resolution at which the layer is visible.
 * @param {number} minResolution The minimum resolution of the layer.
 * @observable
 * @api
 */
BaseLayer.prototype.setMinResolution = function(minResolution) {
  this.set(LayerProperty.MIN_RESOLUTION, minResolution);
};


/**
 * Set the opacity of the layer, allowed values range from 0 to 1.
 * @param {number} opacity The opacity of the layer.
 * @observable
 * @api
 */
BaseLayer.prototype.setOpacity = function(opacity) {
  this.set(LayerProperty.OPACITY, opacity);
};


/**
 * Set the visibility of the layer (`true` or `false`).
 * @param {boolean} visible The visibility of the layer.
 * @observable
 * @api
 */
BaseLayer.prototype.setVisible = function(visible) {
  this.set(LayerProperty.VISIBLE, visible);
};


/**
 * Set Z-index of the layer, which is used to order layers before rendering.
 * The default Z-index is 0.
 * @param {number} zindex The z-index of the layer.
 * @observable
 * @api
 */
BaseLayer.prototype.setZIndex = function(zindex) {
  this.set(LayerProperty.Z_INDEX, zindex);
};
export default BaseLayer;
