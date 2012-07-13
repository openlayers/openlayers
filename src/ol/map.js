goog.provide('ol.Map');

goog.require('goog.object');
goog.require('ol.Array');
goog.require('ol.Camera');
goog.require('ol.DOMMapRenderer');
goog.require('ol.MapRenderer');
goog.require('ol.MapRendererProperty');
goog.require('ol.Object');
goog.require('ol.Projection');
goog.require('ol.WebGLMapRenderer');


/**
 * @define {boolean} Whether to enable the DOM renderer.
 */
ol.ENABLE_DOM_RENDERER = true;


/**
 * @define {boolean} Whether to enable the WebGL renderer.
 */
ol.ENABLE_WEBGL_RENDERER = true;


/**
 * @enum {string}
 */
ol.MapProperty = {
  CAMERA: 'camera',
  LAYERS: 'layers',
  PROJECTION: 'projection'
};



/**
 * @constructor
 * @extends {ol.Object}
 * @param {!HTMLDivElement} target Target.
 * @param {Object.<string, *>=} opt_values Values.
 */
ol.Map = function(target, opt_values) {

  goog.base(this);

  /**
   * @private
   * @type {HTMLDivElement}
   */
  this.target_ = target;

  /**
   * @private
   * @type {ol.MapRenderer}
   */
  this.mapRenderer_ = null;

  if (ol.ENABLE_WEBGL_RENDERER && goog.isNull(this.mapRenderer_)) {
    if (ol.WebGLMapRenderer.isSupported()) {
      this.mapRenderer_ = new ol.WebGLMapRenderer(this.target_);
    }
  }

  if (ol.ENABLE_DOM_RENDERER && goog.isNull(this.mapRenderer_)) {
    if (ol.DOMMapRenderer.isSupported()) {
      this.mapRenderer_ = new ol.DOMMapRenderer(this.target_);
    }
  }

  goog.asserts.assert(!goog.isNull(this.mapRenderer_));

  this.mapRenderer_.bindTo(
      ol.MapRendererProperty.CAMERA, this, ol.MapProperty.CAMERA);
  this.mapRenderer_.bindTo(
      ol.MapRendererProperty.LAYERS, this, ol.MapProperty.LAYERS);

  var values = goog.isDef(opt_values) ? goog.object.clone(opt_values) : {};

  if (!(ol.MapProperty.CAMERA in values)) {
    values[ol.MapProperty.CAMERA] = new ol.Camera();
  }
  if (!(ol.MapProperty.LAYERS in values)) {
    values[ol.MapProperty.LAYERS] = new ol.Array();
  }
  if (!(ol.MapProperty.PROJECTION in values)) {
    values[ol.MapProperty.PROJECTION] =
        ol.Projection.createFromCode('EPSG:3857');
  }

  this.setValues(values);

};
goog.inherits(ol.Map, ol.Object);


/**
 * @return {ol.Camera} Camera.
 */
ol.Map.prototype.getCamera = function() {
  return /** @type {ol.Camera} */ (this.get(ol.MapProperty.CAMERA));
};


/**
 * @return {ol.Array} Layers.
 */
ol.Map.prototype.getLayers = function() {
  return /** @type {ol.Array} */ (this.get(ol.MapProperty.LAYERS));
};


/**
 * @return {ol.Projection} Projection.
 */
ol.Map.prototype.getProjection = function() {
  return /** @type {ol.Projection} */ (this.get(ol.MapProperty.PROJECTION));
};


/**
 * @return {HTMLDivElement} Target.
 */
ol.Map.prototype.getTarget = function() {
  return this.target_;
};


/**
 * @param {ol.Camera} camera Camera.
 */
ol.Map.prototype.setCamera = function(camera) {
  this.set(ol.MapProperty.CAMERA, camera);
};


/**
 * @param {ol.Projection} projection Projection.
 */
ol.Map.prototype.setProjection = function(projection) {
  this.set(ol.MapProperty.PROJECTION, projection);
};


/**
 * @param {ol.Array} layers Layers.
 */
ol.Map.prototype.setLayers = function(layers) {
  this.set(ol.MapProperty.LAYERS, layers);
};
