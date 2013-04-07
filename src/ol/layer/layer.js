goog.provide('ol.layer.Layer');
goog.provide('ol.layer.LayerProperty');
goog.provide('ol.layer.LayerState');

goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.math');
goog.require('ol.Object');
goog.require('ol.source.Source');


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
 * @param {ol.layer.LayerOptions} options Layer options.
 */
ol.layer.Layer = function(options) {

  goog.base(this);

  /**
   * @private
   * @type {ol.source.Source}
   */
  this.source_ = options.source;

  this.setBrightness(goog.isDef(options.brightness) ? options.brightness : 0);
  this.setContrast(goog.isDef(options.contrast) ? options.contrast : 1);
  this.setHue(goog.isDef(options.hue) ? options.hue : 0);
  this.setOpacity(goog.isDef(options.opacity) ? options.opacity : 1);
  this.setSaturation(goog.isDef(options.saturation) ? options.saturation : 1);
  this.setVisible(goog.isDef(options.visible) ? options.visible : true);

  if (!this.source_.isReady()) {
    goog.events.listenOnce(this.source_, goog.events.EventType.LOAD,
        this.handleSourceLoad_, false, this);
  }

};
goog.inherits(ol.layer.Layer, ol.Object);


/**
 * @private
 */
ol.layer.Layer.prototype.dispatchLoadEvent_ = function() {
  this.dispatchEvent(goog.events.EventType.LOAD);
};


/**
 * @return {number} Brightness.
 */
ol.layer.Layer.prototype.getBrightness = function() {
  return /** @type {number} */ (this.get(ol.layer.LayerProperty.BRIGHTNESS));
};
goog.exportProperty(
    ol.layer.Layer.prototype,
    'getBrightness',
    ol.layer.Layer.prototype.getBrightness);


/**
 * @return {number} Contrast.
 */
ol.layer.Layer.prototype.getContrast = function() {
  return /** @type {number} */ (this.get(ol.layer.LayerProperty.CONTRAST));
};
goog.exportProperty(
    ol.layer.Layer.prototype,
    'getContrast',
    ol.layer.Layer.prototype.getContrast);


/**
 * @return {number} Hue.
 */
ol.layer.Layer.prototype.getHue = function() {
  return /** @type {number} */ (this.get(ol.layer.LayerProperty.HUE));
};
goog.exportProperty(
    ol.layer.Layer.prototype,
    'getHue',
    ol.layer.Layer.prototype.getHue);


/**
 * @return {ol.layer.LayerState} Layer state.
 */
ol.layer.Layer.prototype.getLayerState = function() {
  var brightness = this.getBrightness();
  var contrast = this.getContrast();
  var hue = this.getHue();
  var opacity = this.getOpacity();
  var ready = this.isReady();
  var saturation = this.getSaturation();
  var visible = this.getVisible();
  return {
    brightness: goog.isDef(brightness) ? brightness : 0,
    contrast: goog.isDef(contrast) ? contrast : 1,
    hue: goog.isDef(hue) ? hue : 0,
    opacity: goog.isDef(opacity) ? opacity : 1,
    ready: ready,
    saturation: goog.isDef(saturation) ? saturation : 1,
    visible: goog.isDef(visible) ? visible : true
  };
};


/**
 * @return {number} Opacity.
 */
ol.layer.Layer.prototype.getOpacity = function() {
  return /** @type {number} */ (this.get(ol.layer.LayerProperty.OPACITY));
};
goog.exportProperty(
    ol.layer.Layer.prototype,
    'getOpacity',
    ol.layer.Layer.prototype.getOpacity);


/**
 * @return {number} Saturation.
 */
ol.layer.Layer.prototype.getSaturation = function() {
  return /** @type {number} */ (this.get(ol.layer.LayerProperty.SATURATION));
};
goog.exportProperty(
    ol.layer.Layer.prototype,
    'getSaturation',
    ol.layer.Layer.prototype.getSaturation);


/**
 * @return {ol.source.Source} Source.
 */
ol.layer.Layer.prototype.getSource = function() {
  return this.source_;
};


/**
 * @return {boolean} Visible.
 */
ol.layer.Layer.prototype.getVisible = function() {
  return /** @type {boolean} */ (this.get(ol.layer.LayerProperty.VISIBLE));
};
goog.exportProperty(
    ol.layer.Layer.prototype,
    'getVisible',
    ol.layer.Layer.prototype.getVisible);


/**
 * @private
 */
ol.layer.Layer.prototype.handleSourceLoad_ = function() {
  this.dispatchLoadEvent_();
};


/**
 * @return {boolean} Is ready.
 */
ol.layer.Layer.prototype.isReady = function() {
  return this.getSource().isReady();
};


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
ol.layer.Layer.prototype.setBrightness = function(brightness) {
  brightness = goog.math.clamp(brightness, -1, 1);
  if (brightness != this.getBrightness()) {
    this.set(ol.layer.LayerProperty.BRIGHTNESS, brightness);
  }
};
goog.exportProperty(
    ol.layer.Layer.prototype,
    'setBrightness',
    ol.layer.Layer.prototype.setBrightness);


/**
 * Adjust the layer contrast.  A value of 0 will render the layer completely
 * grey.  A value of 1 will leave the contrast unchanged.  Other values are
 * linear multipliers on the effect (and values over 1 are permitted).
 *
 * @param {number} contrast Contrast.
 */
ol.layer.Layer.prototype.setContrast = function(contrast) {
  contrast = Math.max(0, contrast);
  if (contrast != this.getContrast()) {
    this.set(ol.layer.LayerProperty.CONTRAST, contrast);
  }
};
goog.exportProperty(
    ol.layer.Layer.prototype,
    'setContrast',
    ol.layer.Layer.prototype.setContrast);


/**
 * Apply a hue-rotation to the layer.  A value of 0 will leave the hue
 * unchanged.  Other values are radians around the color circle.
 * @param {number} hue Hue.
 */
ol.layer.Layer.prototype.setHue = function(hue) {
  if (hue != this.getHue()) {
    this.set(ol.layer.LayerProperty.HUE, hue);
  }
};
goog.exportProperty(
    ol.layer.Layer.prototype,
    'setHue',
    ol.layer.Layer.prototype.setHue);


/**
 * @param {number} opacity Opacity.
 */
ol.layer.Layer.prototype.setOpacity = function(opacity) {
  opacity = goog.math.clamp(opacity, 0, 1);
  if (opacity != this.getOpacity()) {
    this.set(ol.layer.LayerProperty.OPACITY, opacity);
  }
};
goog.exportProperty(
    ol.layer.Layer.prototype,
    'setOpacity',
    ol.layer.Layer.prototype.setOpacity);


/**
 * Adjust layer saturation.  A value of 0 will render the layer completely
 * unsaturated.  A value of 1 will leave the saturation unchanged.  Other
 * values are linear multipliers of the effect (and values over 1 are
 * permitted).
 *
 * @param {number} saturation Saturation.
 */
ol.layer.Layer.prototype.setSaturation = function(saturation) {
  saturation = Math.max(0, saturation);
  if (saturation != this.getSaturation()) {
    this.set(ol.layer.LayerProperty.SATURATION, saturation);
  }
};
goog.exportProperty(
    ol.layer.Layer.prototype,
    'setSaturation',
    ol.layer.Layer.prototype.setSaturation);


/**
 * @param {boolean} visible Visible.
 */
ol.layer.Layer.prototype.setVisible = function(visible) {
  visible = !!visible;
  if (visible != this.getVisible()) {
    this.set(ol.layer.LayerProperty.VISIBLE, visible);
  }
};
goog.exportProperty(
    ol.layer.Layer.prototype,
    'setVisible',
    ol.layer.Layer.prototype.setVisible);
