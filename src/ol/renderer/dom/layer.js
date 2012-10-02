goog.provide('ol.renderer.dom.Layer');

goog.require('ol.Coordinate');
goog.require('ol.renderer.Layer');



/**
 * @constructor
 * @extends {ol.renderer.Layer}
 * @param {ol.renderer.Map} mapRenderer Map renderer.
 * @param {ol.layer.Layer} layer Layer.
 * @param {!Element} target Target.
 */
ol.renderer.dom.Layer = function(mapRenderer, layer, target) {
  goog.base(this, mapRenderer, layer);

  /**
   * @type {!Element}
   * @protected
   */
  this.target = target;

  /**
   * Top left corner of the target in map coords.
   *
   * @type {ol.Coordinate}
   * @protected
   */
  this.origin = null;

  this.handleLayerOpacityChange();
  this.handleLayerVisibleChange();

};
goog.inherits(ol.renderer.dom.Layer, ol.renderer.Layer);


/**
 * @inheritDoc
 * @return {ol.renderer.Map} Map renderer.
 */
ol.renderer.dom.Layer.prototype.getMapRenderer = function() {
  return /** @type {ol.renderer.dom.Map} */ goog.base(this, 'getMapRenderer');
};


/**
 * @inheritDoc
 */
ol.renderer.dom.Layer.prototype.handleLayerBrightnessChange = function() {
  this.applyHSBCFilter_();
};


/**
 * @inheritDoc
 */
ol.renderer.dom.Layer.prototype.handleLayerContrastChange = function() {
  this.applyHSBCFilter_();
};


/**
 * @inheritDoc
 */
ol.renderer.dom.Layer.prototype.handleLayerHueChange = function() {
  this.applyHSBCFilter_();
};


/**
 * Create a CSS filter to match the current hue, saturation, brightness, and
 * contrast values.
 *
 * @private
 */
ol.renderer.dom.Layer.prototype.applyHSBCFilter_ = function() {
  var layer = this.getLayer();

  /**
   * Hue currently has no restrictions in range, but we map 1 to 180 and -1 to
   * -180.  The hue-rotate function has a domain of 0 to 360 degrees.
   */
  var hue = Math.round((360 + (180 * layer.getHue())) % 360);

  /**
   * Saturation has a range of -1 to 1.  We linearly map -1 to 0% and 1 to 200%
   * saturation change.
   */
  var saturation = Math.round(100 * (layer.getSaturation() + 1));

  /**
   * Brightness has a range of -1 to 1, and we use it directly.
   */
  var brightness = layer.getBrightness().toFixed(6);

  /**
   * Contrast has a range of -1 to 1.  We linearly map -1 to 0 and 1 to 200%
   * contrast change.
   */
  var contrast = Math.round(100 * (layer.getContrast() + 1));

  var filter = 'hue-rotate(' + hue + 'deg) ' +
      'saturate(' + saturation + '%)' +
      'brightness(' + brightness + ')' +
      'contrast(' + contrast + '%)';

  var style = this.target.style;
  style.WebkitFilter = filter;
};


/**
 * @inheritDoc
 */
ol.renderer.dom.Layer.prototype.handleLayerLoad = function() {
  this.getMap().render();
};


/**
 * @inheritDoc
 */
ol.renderer.dom.Layer.prototype.handleLayerOpacityChange = function() {
  goog.style.setOpacity(this.target, this.getLayer().getOpacity());
};


/**
 * @inheritDoc
 */
ol.renderer.dom.Layer.prototype.handleLayerSaturationChange = function() {
  this.applyHSBCFilter_();
};


/**
 * @inheritDoc
 */
ol.renderer.dom.Layer.prototype.handleLayerVisibleChange = function() {
  goog.style.showElement(this.target, this.getLayer().getVisible());
};


/**
 * Render.
 */
ol.renderer.dom.Layer.prototype.render = goog.abstractMethod;


/**
 * Set the location of the top left corner of the target.
 *
 * @param {ol.Coordinate} origin Origin.
 */
ol.renderer.dom.Layer.prototype.setOrigin = function(origin) {
  this.origin = origin;
};
