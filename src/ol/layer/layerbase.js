goog.provide('ol.layer.Base');
goog.provide('ol.layer.LayerProperty');
goog.provide('ol.layer.LayerState');

goog.require('goog.events');
goog.require('goog.math');
goog.require('goog.object');
goog.require('ol.Object');
goog.require('ol.source.State');


/**
 * @enum {string}
 */
ol.layer.LayerProperty = {
  BRIGHTNESS: 'brightness',
  CONTRAST: 'contrast',
  HUE: 'hue',
  OPACITY: 'opacity',
  SATURATION: 'saturation',
  VISIBLE: 'visible',
  EXTENT: 'extent',
  MAX_RESOLUTION: 'maxResolution',
  MIN_RESOLUTION: 'minResolution',
  SOURCE: 'source'
};


/**
 * @typedef {{layer: ol.layer.Layer,
 *            brightness: number,
 *            contrast: number,
 *            hue: number,
 *            opacity: number,
 *            saturation: number,
 *            sourceState: ol.source.State,
 *            visible: boolean,
 *            extent: (ol.Extent|undefined),
 *            maxResolution: number,
 *            minResolution: number}}
 */
ol.layer.LayerState;



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

  goog.base(this);

  /**
   * @type {Object.<string, *>}
   */
  var properties = goog.object.clone(options);
  properties[ol.layer.LayerProperty.BRIGHTNESS] =
      goog.isDef(options.brightness) ? options.brightness : 0;
  properties[ol.layer.LayerProperty.CONTRAST] =
      goog.isDef(options.contrast) ? options.contrast : 1;
  properties[ol.layer.LayerProperty.HUE] =
      goog.isDef(options.hue) ? options.hue : 0;
  properties[ol.layer.LayerProperty.OPACITY] =
      goog.isDef(options.opacity) ? options.opacity : 1;
  properties[ol.layer.LayerProperty.SATURATION] =
      goog.isDef(options.saturation) ? options.saturation : 1;
  properties[ol.layer.LayerProperty.VISIBLE] =
      goog.isDef(options.visible) ? options.visible : true;
  properties[ol.layer.LayerProperty.MAX_RESOLUTION] =
      goog.isDef(options.maxResolution) ? options.maxResolution : Infinity;
  properties[ol.layer.LayerProperty.MIN_RESOLUTION] =
      goog.isDef(options.minResolution) ? options.minResolution : 0;

  this.setProperties(properties);
};
goog.inherits(ol.layer.Base, ol.Object);


/**
 * @return {number} The brightness of the layer.
 * @observable
 * @api
 */
ol.layer.Base.prototype.getBrightness = function() {
  return /** @type {number} */ (this.get(ol.layer.LayerProperty.BRIGHTNESS));
};
goog.exportProperty(
    ol.layer.Base.prototype,
    'getBrightness',
    ol.layer.Base.prototype.getBrightness);


/**
 * @return {number} The contrast of the layer.
 * @observable
 * @api
 */
ol.layer.Base.prototype.getContrast = function() {
  return /** @type {number} */ (this.get(ol.layer.LayerProperty.CONTRAST));
};
goog.exportProperty(
    ol.layer.Base.prototype,
    'getContrast',
    ol.layer.Base.prototype.getContrast);


/**
 * @return {number} The hue of the layer.
 * @observable
 * @api
 */
ol.layer.Base.prototype.getHue = function() {
  return /** @type {number} */ (this.get(ol.layer.LayerProperty.HUE));
};
goog.exportProperty(
    ol.layer.Base.prototype,
    'getHue',
    ol.layer.Base.prototype.getHue);


/**
 * @return {ol.layer.LayerState} Layer state.
 */
ol.layer.Base.prototype.getLayerState = function() {
  var brightness = this.getBrightness();
  var contrast = this.getContrast();
  var hue = this.getHue();
  var opacity = this.getOpacity();
  var saturation = this.getSaturation();
  var sourceState = this.getSourceState();
  var visible = this.getVisible();
  var extent = this.getExtent();
  var maxResolution = this.getMaxResolution();
  var minResolution = this.getMinResolution();
  return {
    layer: /** @type {ol.layer.Layer} */ (this),
    brightness: goog.math.clamp(brightness, -1, 1),
    contrast: Math.max(contrast, 0),
    hue: hue,
    opacity: goog.math.clamp(opacity, 0, 1),
    saturation: Math.max(saturation, 0),
    sourceState: sourceState,
    visible: visible,
    extent: extent,
    maxResolution: maxResolution,
    minResolution: Math.max(minResolution, 0)
  };
};


/**
 * @param {Array.<ol.layer.Layer>=} opt_array Array of layers (to be
 *     modified in place).
 * @return {Array.<ol.layer.Layer>} Array of layers.
 */
ol.layer.Base.prototype.getLayersArray = goog.abstractMethod;


/**
 * @param {Array.<ol.layer.LayerState>=} opt_states Optional list of layer
 *     states (to be modified in place).
 * @return {Array.<ol.layer.LayerState>} List of layer states.
 */
ol.layer.Base.prototype.getLayerStatesArray = goog.abstractMethod;


/**
 * @return {ol.Extent|undefined} The layer extent.
 * @observable
 * @api stable
 */
ol.layer.Base.prototype.getExtent = function() {
  return /** @type {ol.Extent|undefined} */ (
      this.get(ol.layer.LayerProperty.EXTENT));
};
goog.exportProperty(
    ol.layer.Base.prototype,
    'getExtent',
    ol.layer.Base.prototype.getExtent);


/**
 * @return {number} The maximum resolution of the layer.
 * @observable
 * @api stable
 */
ol.layer.Base.prototype.getMaxResolution = function() {
  return /** @type {number} */ (
      this.get(ol.layer.LayerProperty.MAX_RESOLUTION));
};
goog.exportProperty(
    ol.layer.Base.prototype,
    'getMaxResolution',
    ol.layer.Base.prototype.getMaxResolution);


/**
 * @return {number} The minimum resolution of the layer.
 * @observable
 * @api stable
 */
ol.layer.Base.prototype.getMinResolution = function() {
  return /** @type {number} */ (
      this.get(ol.layer.LayerProperty.MIN_RESOLUTION));
};
goog.exportProperty(
    ol.layer.Base.prototype,
    'getMinResolution',
    ol.layer.Base.prototype.getMinResolution);


/**
 * @return {number} The opacity of the layer.
 * @observable
 * @api stable
 */
ol.layer.Base.prototype.getOpacity = function() {
  return /** @type {number} */ (this.get(ol.layer.LayerProperty.OPACITY));
};
goog.exportProperty(
    ol.layer.Base.prototype,
    'getOpacity',
    ol.layer.Base.prototype.getOpacity);


/**
 * @return {number} The saturation of the layer.
 * @observable
 * @api
 */
ol.layer.Base.prototype.getSaturation = function() {
  return /** @type {number} */ (this.get(ol.layer.LayerProperty.SATURATION));
};
goog.exportProperty(
    ol.layer.Base.prototype,
    'getSaturation',
    ol.layer.Base.prototype.getSaturation);


/**
 * @return {ol.source.State} Source state.
 */
ol.layer.Base.prototype.getSourceState = goog.abstractMethod;


/**
 * @return {boolean} The visibility of the layer.
 * @observable
 * @api stable
 */
ol.layer.Base.prototype.getVisible = function() {
  return /** @type {boolean} */ (this.get(ol.layer.LayerProperty.VISIBLE));
};
goog.exportProperty(
    ol.layer.Base.prototype,
    'getVisible',
    ol.layer.Base.prototype.getVisible);


/**
 * Adjust the layer brightness.  A value of -1 will render the layer completely
 * black.  A value of 0 will leave the brightness unchanged.  A value of 1 will
 * render the layer completely white.  Other values are linear multipliers on
 * the effect (values are clamped between -1 and 1).
 *
 * The filter effects draft [1] says the brightness function is supposed to
 * render 0 black, 1 unchanged, and all other values as a linear multiplier.
 *
 * The current WebKit implementation clamps values between -1 (black) and 1
 * (white) [2].  There is a bug open to change the filter effect spec [3].
 *
 * TODO: revisit this if the spec is still unmodified before we release
 *
 * [1] https://dvcs.w3.org/hg/FXTF/raw-file/tip/filters/index.html
 * [2] https://github.com/WebKit/webkit/commit/8f4765e569
 * [3] https://www.w3.org/Bugs/Public/show_bug.cgi?id=15647
 *
 * @param {number} brightness The brightness of the layer.
 * @observable
 * @api
 */
ol.layer.Base.prototype.setBrightness = function(brightness) {
  this.set(ol.layer.LayerProperty.BRIGHTNESS, brightness);
};
goog.exportProperty(
    ol.layer.Base.prototype,
    'setBrightness',
    ol.layer.Base.prototype.setBrightness);


/**
 * Adjust the layer contrast.  A value of 0 will render the layer completely
 * grey.  A value of 1 will leave the contrast unchanged.  Other values are
 * linear multipliers on the effect (and values over 1 are permitted).
 *
 * @param {number} contrast The contrast of the layer.
 * @observable
 * @api
 */
ol.layer.Base.prototype.setContrast = function(contrast) {
  this.set(ol.layer.LayerProperty.CONTRAST, contrast);
};
goog.exportProperty(
    ol.layer.Base.prototype,
    'setContrast',
    ol.layer.Base.prototype.setContrast);


/**
 * Apply a hue-rotation to the layer.  A value of 0 will leave the hue
 * unchanged.  Other values are radians around the color circle.
 * @param {number} hue The hue of the layer.
 * @observable
 * @api
 */
ol.layer.Base.prototype.setHue = function(hue) {
  this.set(ol.layer.LayerProperty.HUE, hue);
};
goog.exportProperty(
    ol.layer.Base.prototype,
    'setHue',
    ol.layer.Base.prototype.setHue);


/**
 * Set the extent at which the layer is visible.  If `undefined`, the layer
 * will be visible at all extents.
 * @param {ol.Extent|undefined} extent The extent of the layer.
 * @observable
 * @api stable
 */
ol.layer.Base.prototype.setExtent = function(extent) {
  this.set(ol.layer.LayerProperty.EXTENT, extent);
};
goog.exportProperty(
    ol.layer.Base.prototype,
    'setExtent',
    ol.layer.Base.prototype.setExtent);


/**
 * @param {number} maxResolution The maximum resolution of the layer.
 * @observable
 * @api stable
 */
ol.layer.Base.prototype.setMaxResolution = function(maxResolution) {
  this.set(ol.layer.LayerProperty.MAX_RESOLUTION, maxResolution);
};
goog.exportProperty(
    ol.layer.Base.prototype,
    'setMaxResolution',
    ol.layer.Base.prototype.setMaxResolution);


/**
 * @param {number} minResolution The minimum resolution of the layer.
 * @observable
 * @api stable
 */
ol.layer.Base.prototype.setMinResolution = function(minResolution) {
  this.set(ol.layer.LayerProperty.MIN_RESOLUTION, minResolution);
};
goog.exportProperty(
    ol.layer.Base.prototype,
    'setMinResolution',
    ol.layer.Base.prototype.setMinResolution);


/**
 * @param {number} opacity The opacity of the layer.
 * @observable
 * @api stable
 */
ol.layer.Base.prototype.setOpacity = function(opacity) {
  this.set(ol.layer.LayerProperty.OPACITY, opacity);
};
goog.exportProperty(
    ol.layer.Base.prototype,
    'setOpacity',
    ol.layer.Base.prototype.setOpacity);


/**
 * Adjust layer saturation.  A value of 0 will render the layer completely
 * unsaturated.  A value of 1 will leave the saturation unchanged.  Other
 * values are linear multipliers of the effect (and values over 1 are
 * permitted).
 *
 * @param {number} saturation The saturation of the layer.
 * @observable
 * @api
 */
ol.layer.Base.prototype.setSaturation = function(saturation) {
  this.set(ol.layer.LayerProperty.SATURATION, saturation);
};
goog.exportProperty(
    ol.layer.Base.prototype,
    'setSaturation',
    ol.layer.Base.prototype.setSaturation);


/**
 * @param {boolean} visible The visibility of the layer.
 * @observable
 * @api stable
 */
ol.layer.Base.prototype.setVisible = function(visible) {
  this.set(ol.layer.LayerProperty.VISIBLE, visible);
};
goog.exportProperty(
    ol.layer.Base.prototype,
    'setVisible',
    ol.layer.Base.prototype.setVisible);
