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
  MAX_RESOLUTION: 'maxResolution',
  MIN_RESOLUTION: 'minResolution'
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
 *            maxResolution: number,
 *            minResolution: number}}
 */
ol.layer.LayerState;



/**
 * Base class for all layers. The most basic implementation is
 * {@link ol.layer.Layer}. See {@link ol.layer} for all implementations.
 * @constructor
 * @extends {ol.Object}
 * @param {olx.layer.BaseOptions} options Layer options.
 */
ol.layer.Base = function(options) {

  goog.base(this);

  var values = goog.object.clone(options);

  /** @type {number} */
  values.brightness = goog.isDef(values.brightness) ? values.brightness : 0;
  /** @type {number} */
  values.contrast = goog.isDef(values.contrast) ? values.contrast : 1;
  /** @type {number} */
  values.hue = goog.isDef(values.hue) ? values.hue : 0;
  /** @type {number} */
  values.opacity = goog.isDef(values.opacity) ? values.opacity : 1;
  /** @type {number} */
  values.saturation = goog.isDef(values.saturation) ? values.saturation : 1;
  /** @type {boolean} */
  values.visible = goog.isDef(values.visible) ? values.visible : true;
  /** @type {number} */
  values.maxResolution = goog.isDef(values.maxResolution) ?
      values.maxResolution : Infinity;
  /** @type {number} */
  values.minResolution = goog.isDef(values.minResolution) ?
      values.minResolution : 0;

  this.setValues(values);
};
goog.inherits(ol.layer.Base, ol.Object);


/**
 * @return {number|undefined} Brightness.
 * @todo api
 */
ol.layer.Base.prototype.getBrightness = function() {
  return /** @type {number|undefined} */ (
      this.get(ol.layer.LayerProperty.BRIGHTNESS));
};
goog.exportProperty(
    ol.layer.Base.prototype,
    'getBrightness',
    ol.layer.Base.prototype.getBrightness);


/**
 * @return {number|undefined} Contrast.
 * @todo api
 */
ol.layer.Base.prototype.getContrast = function() {
  return /** @type {number|undefined} */ (
      this.get(ol.layer.LayerProperty.CONTRAST));
};
goog.exportProperty(
    ol.layer.Base.prototype,
    'getContrast',
    ol.layer.Base.prototype.getContrast);


/**
 * @return {number|undefined} Hue.
 * @todo api
 */
ol.layer.Base.prototype.getHue = function() {
  return /** @type {number|undefined} */ (this.get(ol.layer.LayerProperty.HUE));
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
  var maxResolution = this.getMaxResolution();
  var minResolution = this.getMinResolution();
  return {
    layer: /** @type {ol.layer.Layer} */ (this),
    brightness: goog.isDef(brightness) ? goog.math.clamp(brightness, -1, 1) : 0,
    contrast: goog.isDef(contrast) ? Math.max(contrast, 0) : 1,
    hue: goog.isDef(hue) ? hue : 0,
    opacity: goog.isDef(opacity) ? goog.math.clamp(opacity, 0, 1) : 1,
    saturation: goog.isDef(saturation) ? Math.max(saturation, 0) : 1,
    sourceState: sourceState,
    visible: goog.isDef(visible) ? !!visible : true,
    maxResolution: goog.isDef(maxResolution) ? maxResolution : Infinity,
    minResolution: goog.isDef(minResolution) ? Math.max(minResolution, 0) : 0
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
 * @return {number|undefined} MaxResolution.
 * @todo api
 */
ol.layer.Base.prototype.getMaxResolution = function() {
  return /** @type {number|undefined} */ (
      this.get(ol.layer.LayerProperty.MAX_RESOLUTION));
};
goog.exportProperty(
    ol.layer.Base.prototype,
    'getMaxResolution',
    ol.layer.Base.prototype.getMaxResolution);


/**
 * @return {number|undefined} MinResolution.
 * @todo api
 */
ol.layer.Base.prototype.getMinResolution = function() {
  return /** @type {number|undefined} */ (
      this.get(ol.layer.LayerProperty.MIN_RESOLUTION));
};
goog.exportProperty(
    ol.layer.Base.prototype,
    'getMinResolution',
    ol.layer.Base.prototype.getMinResolution);


/**
 * @return {number|undefined} Opacity.
 * @todo api
 */
ol.layer.Base.prototype.getOpacity = function() {
  return /** @type {number|undefined} */ (
      this.get(ol.layer.LayerProperty.OPACITY));
};
goog.exportProperty(
    ol.layer.Base.prototype,
    'getOpacity',
    ol.layer.Base.prototype.getOpacity);


/**
 * @return {number|undefined} Saturation.
 * @todo api
 */
ol.layer.Base.prototype.getSaturation = function() {
  return /** @type {number|undefined} */ (
      this.get(ol.layer.LayerProperty.SATURATION));
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
 * @return {boolean|undefined} Visible.
 * @todo api
 */
ol.layer.Base.prototype.getVisible = function() {
  return /** @type {boolean|undefined} */ (
      this.get(ol.layer.LayerProperty.VISIBLE));
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
 * @param {number|undefined} brightness Brightness.
 * @todo api
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
 * @param {number|undefined} contrast Contrast.
 * @todo api
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
 * @param {number|undefined} hue Hue.
 * @todo api
 */
ol.layer.Base.prototype.setHue = function(hue) {
  this.set(ol.layer.LayerProperty.HUE, hue);
};
goog.exportProperty(
    ol.layer.Base.prototype,
    'setHue',
    ol.layer.Base.prototype.setHue);


/**
 * @param {number|undefined} maxResolution MaxResolution.
 * @todo api
 */
ol.layer.Base.prototype.setMaxResolution = function(maxResolution) {
  this.set(ol.layer.LayerProperty.MAX_RESOLUTION, maxResolution);
};
goog.exportProperty(
    ol.layer.Base.prototype,
    'setMaxResolution',
    ol.layer.Base.prototype.setMaxResolution);


/**
 * @param {number|undefined} minResolution MinResolution.
 * @todo api
 */
ol.layer.Base.prototype.setMinResolution = function(minResolution) {
  this.set(ol.layer.LayerProperty.MIN_RESOLUTION, minResolution);
};
goog.exportProperty(
    ol.layer.Base.prototype,
    'setMinResolution',
    ol.layer.Base.prototype.setMinResolution);


/**
 * @param {number|undefined} opacity Opacity.
 * @todo api
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
 * @param {number|undefined} saturation Saturation.
 * @todo api
 */
ol.layer.Base.prototype.setSaturation = function(saturation) {
  this.set(ol.layer.LayerProperty.SATURATION, saturation);
};
goog.exportProperty(
    ol.layer.Base.prototype,
    'setSaturation',
    ol.layer.Base.prototype.setSaturation);


/**
 * @param {boolean|undefined} visible Visible.
 * @todo api
 */
ol.layer.Base.prototype.setVisible = function(visible) {
  this.set(ol.layer.LayerProperty.VISIBLE, visible);
};
goog.exportProperty(
    ol.layer.Base.prototype,
    'setVisible',
    ol.layer.Base.prototype.setVisible);
