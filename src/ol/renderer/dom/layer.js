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

  var hue = (layer.getHue() % 360).toFixed(3);
  var hueFilter = (+hue !== 0) ?
      'hue-rotate(' + hue + 'deg) ' : '';

  var saturation = layer.getSaturation().toFixed(3);
  var saturationFilter = (+saturation !== 1) ?
      'saturate(' + saturation + ') ' : '';

  /**
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
   */
  var brightness = layer.getBrightness().toFixed(3);
  var brightnessFilter = (+brightness !== 0) ?
      'brightness(' + brightness + ') ' : '';

  var contrast = layer.getContrast().toFixed(3);
  var contrastFilter = (+contrast !== 1) ?
      'contrast(' + contrast + ') ' : '';

  var filter = hueFilter + saturationFilter + brightnessFilter + contrastFilter;

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
