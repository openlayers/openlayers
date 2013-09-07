goog.provide('ol.layer.LayerBase');
goog.provide('ol.layer.LayerProperty');
goog.provide('ol.layer.LayerState');

goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.math');
goog.require('goog.object');
goog.require('ol.Object');


/**
 * @enum {string}
 */
ol.layer.LayerProperty = {
  BRIGHTNESS: 'brightness',
  CONTRAST: 'contrast',
  HUE: 'hue',
  OPACITY: 'opacity',
  SATURATION: 'saturation',
  VISIBLE: 'visible'
};


/**
 * @typedef {{brightness: number,
 *            contrast: number,
 *            hue: number,
 *            opacity: number,
 *            ready: boolean,
 *            saturation: number,
 *            visible: boolean}}
 */
ol.layer.LayerState;



/**
 * @constructor
 * @extends {ol.Object}
 * @param {ol.layer.LayerBaseOptions} options Layer options.
 */
ol.layer.LayerBase = function(options) {

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

  this.setValues(values);

  goog.events.listen(this, [
    ol.Object.getChangeEventType(ol.layer.LayerProperty.BRIGHTNESS),
    ol.Object.getChangeEventType(ol.layer.LayerProperty.CONTRAST),
    ol.Object.getChangeEventType(ol.layer.LayerProperty.HUE),
    ol.Object.getChangeEventType(ol.layer.LayerProperty.OPACITY),
    ol.Object.getChangeEventType(ol.layer.LayerProperty.SATURATION),
    goog.events.EventType.LOAD
  ],
  this.handleLayerChange, false, this);

  goog.events.listen(this,
      ol.Object.getChangeEventType(ol.layer.LayerProperty.VISIBLE),
      this.handleLayerVisibleChange, false, this);

};
goog.inherits(ol.layer.LayerBase, ol.Object);


/**
 * @protected
 */
ol.layer.LayerBase.prototype.dispatchChangeEvent = function() {
  this.dispatchEvent(goog.events.EventType.CHANGE);
};


/**
 * @return {number} Brightness.
 */
ol.layer.LayerBase.prototype.getBrightness = function() {
  return /** @type {number} */ (this.get(ol.layer.LayerProperty.BRIGHTNESS));
};
goog.exportProperty(
    ol.layer.LayerBase.prototype,
    'getBrightness',
    ol.layer.LayerBase.prototype.getBrightness);


/**
 * @return {number} Contrast.
 */
ol.layer.LayerBase.prototype.getContrast = function() {
  return /** @type {number} */ (this.get(ol.layer.LayerProperty.CONTRAST));
};
goog.exportProperty(
    ol.layer.LayerBase.prototype,
    'getContrast',
    ol.layer.LayerBase.prototype.getContrast);


/**
 * @return {number} Hue.
 */
ol.layer.LayerBase.prototype.getHue = function() {
  return /** @type {number} */ (this.get(ol.layer.LayerProperty.HUE));
};
goog.exportProperty(
    ol.layer.LayerBase.prototype,
    'getHue',
    ol.layer.LayerBase.prototype.getHue);


/**
 * @return {ol.layer.LayerState} Layer state.
 */
ol.layer.LayerBase.prototype.getLayerState = function() {
  var brightness = this.getBrightness();
  var contrast = this.getContrast();
  var hue = this.getHue();
  var opacity = this.getOpacity();
  var ready = this.isReady();
  var saturation = this.getSaturation();
  var visible = this.getVisible();
  return {
    brightness: goog.isDef(brightness) ? goog.math.clamp(brightness, -1, 1) : 0,
    contrast: goog.isDef(contrast) ? Math.max(contrast, 0) : 1,
    hue: goog.isDef(hue) ? hue : 0,
    opacity: goog.isDef(opacity) ? goog.math.clamp(opacity, 0, 1) : 1,
    ready: ready,
    saturation: goog.isDef(saturation) ? Math.max(saturation, 0) : 1,
    visible: goog.isDef(visible) ? !!visible : true
  };
};


/**
 * @param {Array.<ol.layer.Layer>=} opt_array Array of layers (to be
 *     modified in place).
 * @return {Array.<ol.layer.Layer>} Array of layers.
 */
ol.layer.LayerBase.prototype.getLayersArray = goog.abstractMethod;


/**
 * @param {{
 *     layers: Array.<ol.layer.Layer>,
 *     layerStates: Array.<ol.layer.LayerState>}=} opt_obj Object that store
 *     both the layers and the layerStates (to be modified in place).
 * @return {{
 *     layers: Array.<ol.layer.Layer>,
 *     layerStates: Array.<ol.layer.LayerState>}} Object that store both the
 *     layers and the layerStates.
 */
ol.layer.LayerBase.prototype.getLayerStatesArray = goog.abstractMethod;


/**
 * @return {number} Opacity.
 */
ol.layer.LayerBase.prototype.getOpacity = function() {
  return /** @type {number} */ (this.get(ol.layer.LayerProperty.OPACITY));
};
goog.exportProperty(
    ol.layer.LayerBase.prototype,
    'getOpacity',
    ol.layer.LayerBase.prototype.getOpacity);


/**
 * @return {number} Saturation.
 */
ol.layer.LayerBase.prototype.getSaturation = function() {
  return /** @type {number} */ (this.get(ol.layer.LayerProperty.SATURATION));
};
goog.exportProperty(
    ol.layer.LayerBase.prototype,
    'getSaturation',
    ol.layer.LayerBase.prototype.getSaturation);


/**
 * @return {boolean} Visible.
 */
ol.layer.LayerBase.prototype.getVisible = function() {
  return /** @type {boolean} */ (this.get(ol.layer.LayerProperty.VISIBLE));
};
goog.exportProperty(
    ol.layer.LayerBase.prototype,
    'getVisible',
    ol.layer.LayerBase.prototype.getVisible);


/**
 * @protected
 */
ol.layer.LayerBase.prototype.handleLayerChange = function() {
  if (this.getVisible() && this.isReady()) {
    this.dispatchChangeEvent();
  }
};


/**
 * @protected
 */
ol.layer.LayerBase.prototype.handleLayerVisibleChange = function() {
  if (this.isReady()) {
    this.dispatchChangeEvent();
  }
};


/**
 * @return {boolean} Is ready.
 */
ol.layer.LayerBase.prototype.isReady = goog.abstractMethod;


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
 * @param {number} brightness Brightness.
 */
ol.layer.LayerBase.prototype.setBrightness = function(brightness) {
  this.set(ol.layer.LayerProperty.BRIGHTNESS, brightness);
};
goog.exportProperty(
    ol.layer.LayerBase.prototype,
    'setBrightness',
    ol.layer.LayerBase.prototype.setBrightness);


/**
 * Adjust the layer contrast.  A value of 0 will render the layer completely
 * grey.  A value of 1 will leave the contrast unchanged.  Other values are
 * linear multipliers on the effect (and values over 1 are permitted).
 *
 * @param {number} contrast Contrast.
 */
ol.layer.LayerBase.prototype.setContrast = function(contrast) {
  this.set(ol.layer.LayerProperty.CONTRAST, contrast);
};
goog.exportProperty(
    ol.layer.LayerBase.prototype,
    'setContrast',
    ol.layer.LayerBase.prototype.setContrast);


/**
 * Apply a hue-rotation to the layer.  A value of 0 will leave the hue
 * unchanged.  Other values are radians around the color circle.
 * @param {number} hue Hue.
 */
ol.layer.LayerBase.prototype.setHue = function(hue) {
  this.set(ol.layer.LayerProperty.HUE, hue);
};
goog.exportProperty(
    ol.layer.LayerBase.prototype,
    'setHue',
    ol.layer.LayerBase.prototype.setHue);


/**
 * @param {number} opacity Opacity.
 */
ol.layer.LayerBase.prototype.setOpacity = function(opacity) {
  this.set(ol.layer.LayerProperty.OPACITY, opacity);
};
goog.exportProperty(
    ol.layer.LayerBase.prototype,
    'setOpacity',
    ol.layer.LayerBase.prototype.setOpacity);


/**
 * Adjust layer saturation.  A value of 0 will render the layer completely
 * unsaturated.  A value of 1 will leave the saturation unchanged.  Other
 * values are linear multipliers of the effect (and values over 1 are
 * permitted).
 *
 * @param {number} saturation Saturation.
 */
ol.layer.LayerBase.prototype.setSaturation = function(saturation) {
  this.set(ol.layer.LayerProperty.SATURATION, saturation);
};
goog.exportProperty(
    ol.layer.LayerBase.prototype,
    'setSaturation',
    ol.layer.LayerBase.prototype.setSaturation);


/**
 * @param {boolean} visible Visible.
 */
ol.layer.LayerBase.prototype.setVisible = function(visible) {
  this.set(ol.layer.LayerProperty.VISIBLE, visible);
};
goog.exportProperty(
    ol.layer.LayerBase.prototype,
    'setVisible',
    ol.layer.LayerBase.prototype.setVisible);
