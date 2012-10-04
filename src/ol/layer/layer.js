goog.provide('ol.layer.Layer');
goog.provide('ol.layer.LayerProperty');

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
 * @constructor
 * @extends {ol.Object}
 * @param {ol.layer.LayerOptions} layerOptions LayerOptions.
 */
ol.layer.Layer = function(layerOptions) {

  goog.base(this);

  /**
   * @private
   * @type {ol.source.Source}
   */
  this.source_ = layerOptions.source;

  this.setBrightness(
      goog.isDef(layerOptions.brightness) ? layerOptions.brightness : 0);
  this.setContrast(
      goog.isDef(layerOptions.contrast) ? layerOptions.contrast : 0);
  this.setHue(
      goog.isDef(layerOptions.hue) ? layerOptions.hue : 0);
  this.setOpacity(
      goog.isDef(layerOptions.opacity) ? layerOptions.opacity : 1);
  this.setSaturation(
      goog.isDef(layerOptions.saturation) ? layerOptions.saturation : 0);
  this.setVisible(
      goog.isDef(layerOptions.visible) ? layerOptions.visible : true);

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
  return /** @type {number} */ this.get(ol.layer.LayerProperty.BRIGHTNESS);
};
goog.exportProperty(
    ol.layer.Layer.prototype,
    'getBrightness',
    ol.layer.Layer.prototype.getBrightness);


/**
 * @return {number} Contrast.
 */
ol.layer.Layer.prototype.getContrast = function() {
  return /** @type {number} */ this.get(ol.layer.LayerProperty.CONTRAST);
};
goog.exportProperty(
    ol.layer.Layer.prototype,
    'getContrast',
    ol.layer.Layer.prototype.getContrast);


/**
 * @return {number} Hue.
 */
ol.layer.Layer.prototype.getHue = function() {
  return /** @type {number} */ this.get(ol.layer.LayerProperty.HUE);
};
goog.exportProperty(
    ol.layer.Layer.prototype,
    'getHue',
    ol.layer.Layer.prototype.getHue);


/**
 * @return {number} Opacity.
 */
ol.layer.Layer.prototype.getOpacity = function() {
  return /** @type {number} */ this.get(ol.layer.LayerProperty.OPACITY);
};
goog.exportProperty(
    ol.layer.Layer.prototype,
    'getOpacity',
    ol.layer.Layer.prototype.getOpacity);


/**
 * @return {number} Saturation.
 */
ol.layer.Layer.prototype.getSaturation = function() {
  return /** @type {number} */ this.get(ol.layer.LayerProperty.SATURATION);
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
  return /** @type {boolean} */ this.get(ol.layer.LayerProperty.VISIBLE);
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
 * @param {number} contrast Contrast.
 */
ol.layer.Layer.prototype.setContrast = function(contrast) {
  contrast = goog.math.clamp(contrast, -1, 1);
  if (contrast != this.getContrast()) {
    this.set(ol.layer.LayerProperty.CONTRAST, contrast);
  }
};
goog.exportProperty(
    ol.layer.Layer.prototype,
    'setContrast',
    ol.layer.Layer.prototype.setContrast);


/**
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
 * @param {number} saturation Saturation.
 */
ol.layer.Layer.prototype.setSaturation = function(saturation) {
  saturation = goog.math.clamp(saturation, -1, 1);
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
