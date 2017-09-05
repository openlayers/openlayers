import _ol_ from '../index';
import _ol_Object_ from '../object';
import _ol_layer_Property_ from '../layer/property';
import _ol_math_ from '../math';
import _ol_obj_ from '../obj';

/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Note that with `ol.layer.Base` and all its subclasses, any property set in
 * the options is set as a {@link ol.Object} property on the layer object, so
 * is observable, and has get/set accessors.
 *
 * @constructor
 * @abstract
 * @extends {ol.Object}
 * @param {olx.layer.BaseOptions} options Layer options.
 * @api
 */
var _ol_layer_Base_ = function(options) {

  _ol_Object_.call(this);

  /**
   * @type {Object.<string, *>}
   */
  var properties = _ol_obj_.assign({}, options);
  properties[_ol_layer_Property_.OPACITY] =
      options.opacity !== undefined ? options.opacity : 1;
  properties[_ol_layer_Property_.VISIBLE] =
      options.visible !== undefined ? options.visible : true;
  properties[_ol_layer_Property_.Z_INDEX] =
      options.zIndex !== undefined ? options.zIndex : 0;
  properties[_ol_layer_Property_.MAX_RESOLUTION] =
      options.maxResolution !== undefined ? options.maxResolution : Infinity;
  properties[_ol_layer_Property_.MIN_RESOLUTION] =
      options.minResolution !== undefined ? options.minResolution : 0;

  this.setProperties(properties);

  /**
   * @type {ol.LayerState}
   * @private
   */
  this.state_ = /** @type {ol.LayerState} */ ({
    layer: /** @type {ol.layer.Layer} */ (this),
    managed: true
  });

  /**
   * The layer type.
   * @type {ol.LayerType}
   * @protected;
   */
  this.type;

};

_ol_.inherits(_ol_layer_Base_, _ol_Object_);


/**
 * Get the layer type (used when creating a layer renderer).
 * @return {ol.LayerType} The layer type.
 */
_ol_layer_Base_.prototype.getType = function() {
  return this.type;
};


/**
 * @return {ol.LayerState} Layer state.
 */
_ol_layer_Base_.prototype.getLayerState = function() {
  this.state_.opacity = _ol_math_.clamp(this.getOpacity(), 0, 1);
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
 * @param {Array.<ol.layer.Layer>=} opt_array Array of layers (to be
 *     modified in place).
 * @return {Array.<ol.layer.Layer>} Array of layers.
 */
_ol_layer_Base_.prototype.getLayersArray = function(opt_array) {};


/**
 * @abstract
 * @param {Array.<ol.LayerState>=} opt_states Optional list of layer
 *     states (to be modified in place).
 * @return {Array.<ol.LayerState>} List of layer states.
 */
_ol_layer_Base_.prototype.getLayerStatesArray = function(opt_states) {};


/**
 * Return the {@link ol.Extent extent} of the layer or `undefined` if it
 * will be visible regardless of extent.
 * @return {ol.Extent|undefined} The layer extent.
 * @observable
 * @api
 */
_ol_layer_Base_.prototype.getExtent = function() {
  return (
  /** @type {ol.Extent|undefined} */ this.get(_ol_layer_Property_.EXTENT)
  );
};


/**
 * Return the maximum resolution of the layer.
 * @return {number} The maximum resolution of the layer.
 * @observable
 * @api
 */
_ol_layer_Base_.prototype.getMaxResolution = function() {
  return (
  /** @type {number} */ this.get(_ol_layer_Property_.MAX_RESOLUTION)
  );
};


/**
 * Return the minimum resolution of the layer.
 * @return {number} The minimum resolution of the layer.
 * @observable
 * @api
 */
_ol_layer_Base_.prototype.getMinResolution = function() {
  return (
  /** @type {number} */ this.get(_ol_layer_Property_.MIN_RESOLUTION)
  );
};


/**
 * Return the opacity of the layer (between 0 and 1).
 * @return {number} The opacity of the layer.
 * @observable
 * @api
 */
_ol_layer_Base_.prototype.getOpacity = function() {
  return (
  /** @type {number} */ this.get(_ol_layer_Property_.OPACITY)
  );
};


/**
 * @abstract
 * @return {ol.source.State} Source state.
 */
_ol_layer_Base_.prototype.getSourceState = function() {};


/**
 * Return the visibility of the layer (`true` or `false`).
 * @return {boolean} The visibility of the layer.
 * @observable
 * @api
 */
_ol_layer_Base_.prototype.getVisible = function() {
  return (
  /** @type {boolean} */ this.get(_ol_layer_Property_.VISIBLE)
  );
};


/**
 * Return the Z-index of the layer, which is used to order layers before
 * rendering. The default Z-index is 0.
 * @return {number} The Z-index of the layer.
 * @observable
 * @api
 */
_ol_layer_Base_.prototype.getZIndex = function() {
  return (
  /** @type {number} */ this.get(_ol_layer_Property_.Z_INDEX)
  );
};


/**
 * Set the extent at which the layer is visible.  If `undefined`, the layer
 * will be visible at all extents.
 * @param {ol.Extent|undefined} extent The extent of the layer.
 * @observable
 * @api
 */
_ol_layer_Base_.prototype.setExtent = function(extent) {
  this.set(_ol_layer_Property_.EXTENT, extent);
};


/**
 * Set the maximum resolution at which the layer is visible.
 * @param {number} maxResolution The maximum resolution of the layer.
 * @observable
 * @api
 */
_ol_layer_Base_.prototype.setMaxResolution = function(maxResolution) {
  this.set(_ol_layer_Property_.MAX_RESOLUTION, maxResolution);
};


/**
 * Set the minimum resolution at which the layer is visible.
 * @param {number} minResolution The minimum resolution of the layer.
 * @observable
 * @api
 */
_ol_layer_Base_.prototype.setMinResolution = function(minResolution) {
  this.set(_ol_layer_Property_.MIN_RESOLUTION, minResolution);
};


/**
 * Set the opacity of the layer, allowed values range from 0 to 1.
 * @param {number} opacity The opacity of the layer.
 * @observable
 * @api
 */
_ol_layer_Base_.prototype.setOpacity = function(opacity) {
  this.set(_ol_layer_Property_.OPACITY, opacity);
};


/**
 * Set the visibility of the layer (`true` or `false`).
 * @param {boolean} visible The visibility of the layer.
 * @observable
 * @api
 */
_ol_layer_Base_.prototype.setVisible = function(visible) {
  this.set(_ol_layer_Property_.VISIBLE, visible);
};


/**
 * Set Z-index of the layer, which is used to order layers before rendering.
 * The default Z-index is 0.
 * @param {number} zindex The z-index of the layer.
 * @observable
 * @api
 */
_ol_layer_Base_.prototype.setZIndex = function(zindex) {
  this.set(_ol_layer_Property_.Z_INDEX, zindex);
};
export default _ol_layer_Base_;
