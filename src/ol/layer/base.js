goog.provide('ol.layer.Base');

goog.require('ol');
goog.require('ol.Object');
goog.require('ol.math');
goog.require('ol.obj');


/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Note that with `ol.layer.Base` and all its subclasses, any property set in
 * the options is set as a {@link ol.Object} property on the layer object, so
 * is observable, and has get/set accessors.
 *
 * @constructor
 * @extends {ol.Object}
 * @param {olx.layer.BaseOptions} options Layer options.
 * @api stable
 */
ol.layer.Base = function(options) {

  ol.Object.call(this);

  /**
   * @type {Object.<string, *>}
   */
  var properties = ol.obj.assign({}, options);
  properties[ol.layer.Base.Property.OPACITY] =
      options.opacity !== undefined ? options.opacity : 1;
  properties[ol.layer.Base.Property.VISIBLE] =
      options.visible !== undefined ? options.visible : true;
  properties[ol.layer.Base.Property.Z_INDEX] =
      options.zIndex !== undefined ? options.zIndex : 0;
  properties[ol.layer.Base.Property.MAX_RESOLUTION] =
      options.maxResolution !== undefined ? options.maxResolution : Infinity;
  properties[ol.layer.Base.Property.MIN_RESOLUTION] =
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

};
ol.inherits(ol.layer.Base, ol.Object);


/**
 * @return {ol.LayerState} Layer state.
 */
ol.layer.Base.prototype.getLayerState = function() {
  this.state_.opacity = ol.math.clamp(this.getOpacity(), 0, 1);
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
ol.layer.Base.prototype.getLayersArray = function(opt_array) {};


/**
 * @abstract
 * @param {Array.<ol.LayerState>=} opt_states Optional list of layer
 *     states (to be modified in place).
 * @return {Array.<ol.LayerState>} List of layer states.
 */
ol.layer.Base.prototype.getLayerStatesArray = function(opt_states) {};


/**
 * Return the {@link ol.Extent extent} of the layer or `undefined` if it
 * will be visible regardless of extent.
 * @return {ol.Extent|undefined} The layer extent.
 * @observable
 * @api stable
 */
ol.layer.Base.prototype.getExtent = function() {
  return /** @type {ol.Extent|undefined} */ (
      this.get(ol.layer.Base.Property.EXTENT));
};


/**
 * Return the maximum resolution of the layer.
 * @return {number} The maximum resolution of the layer.
 * @observable
 * @api stable
 */
ol.layer.Base.prototype.getMaxResolution = function() {
  return /** @type {number} */ (
      this.get(ol.layer.Base.Property.MAX_RESOLUTION));
};


/**
 * Return the minimum resolution of the layer.
 * @return {number} The minimum resolution of the layer.
 * @observable
 * @api stable
 */
ol.layer.Base.prototype.getMinResolution = function() {
  return /** @type {number} */ (
      this.get(ol.layer.Base.Property.MIN_RESOLUTION));
};


/**
 * Return the opacity of the layer (between 0 and 1).
 * @return {number} The opacity of the layer.
 * @observable
 * @api stable
 */
ol.layer.Base.prototype.getOpacity = function() {
  return /** @type {number} */ (this.get(ol.layer.Base.Property.OPACITY));
};


/**
 * @abstract
 * @return {ol.source.State} Source state.
 */
ol.layer.Base.prototype.getSourceState = function() {};


/**
 * Return the visibility of the layer (`true` or `false`).
 * @return {boolean} The visibility of the layer.
 * @observable
 * @api stable
 */
ol.layer.Base.prototype.getVisible = function() {
  return /** @type {boolean} */ (this.get(ol.layer.Base.Property.VISIBLE));
};


/**
 * Return the Z-index of the layer, which is used to order layers before
 * rendering. The default Z-index is 0.
 * @return {number} The Z-index of the layer.
 * @observable
 * @api
 */
ol.layer.Base.prototype.getZIndex = function() {
  return /** @type {number} */ (this.get(ol.layer.Base.Property.Z_INDEX));
};


/**
 * Set the extent at which the layer is visible.  If `undefined`, the layer
 * will be visible at all extents.
 * @param {ol.Extent|undefined} extent The extent of the layer.
 * @observable
 * @api stable
 */
ol.layer.Base.prototype.setExtent = function(extent) {
  this.set(ol.layer.Base.Property.EXTENT, extent);
};


/**
 * Set the maximum resolution at which the layer is visible.
 * @param {number} maxResolution The maximum resolution of the layer.
 * @observable
 * @api stable
 */
ol.layer.Base.prototype.setMaxResolution = function(maxResolution) {
  this.set(ol.layer.Base.Property.MAX_RESOLUTION, maxResolution);
};


/**
 * Set the minimum resolution at which the layer is visible.
 * @param {number} minResolution The minimum resolution of the layer.
 * @observable
 * @api stable
 */
ol.layer.Base.prototype.setMinResolution = function(minResolution) {
  this.set(ol.layer.Base.Property.MIN_RESOLUTION, minResolution);
};


/**
 * Set the opacity of the layer, allowed values range from 0 to 1.
 * @param {number} opacity The opacity of the layer.
 * @observable
 * @api stable
 */
ol.layer.Base.prototype.setOpacity = function(opacity) {
  this.set(ol.layer.Base.Property.OPACITY, opacity);
};


/**
 * Set the visibility of the layer (`true` or `false`).
 * @param {boolean} visible The visibility of the layer.
 * @observable
 * @api stable
 */
ol.layer.Base.prototype.setVisible = function(visible) {
  this.set(ol.layer.Base.Property.VISIBLE, visible);
};


/**
 * Set Z-index of the layer, which is used to order layers before rendering.
 * The default Z-index is 0.
 * @param {number} zindex The z-index of the layer.
 * @observable
 * @api
 */
ol.layer.Base.prototype.setZIndex = function(zindex) {
  this.set(ol.layer.Base.Property.Z_INDEX, zindex);
};


/**
 * @enum {string}
 */
ol.layer.Base.Property = {
  OPACITY: 'opacity',
  VISIBLE: 'visible',
  EXTENT: 'extent',
  Z_INDEX: 'zIndex',
  MAX_RESOLUTION: 'maxResolution',
  MIN_RESOLUTION: 'minResolution',
  SOURCE: 'source'
};
