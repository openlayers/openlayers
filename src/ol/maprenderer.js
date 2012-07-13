goog.provide('ol.MapRenderer');
goog.provide('ol.MapRendererProperty');

goog.require('goog.array');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.events.EventType');
goog.require('goog.object');
goog.require('ol.Array');
goog.require('ol.Camera');
goog.require('ol.CameraProperty');
goog.require('ol.LayerRenderer');
goog.require('ol.Object');
goog.require('ol.Projection');


/**
 * @enum {string}
 */
ol.MapRendererProperty = {
  CAMERA: 'camera',
  LAYERS: 'layers',
  PROJECTION: 'projection'
};



/**
 * @constructor
 * @extends {ol.Object}
 * @param {HTMLDivElement} target Target.
 * @param {Object=} opt_values Values.
 */
ol.MapRenderer = function(target, opt_values) {

  goog.base(this);

  /**
   * @private
   * @type {HTMLDivElement}
   */
  this.target_ = target;

  /**
   * @private
   * @type {goog.math.Size}
   */
  this.size_ = new goog.math.Size(target.clientWidth, target.clientHeight);

  /**
   * @private
   * @type {Array.<number>}
   */
  this.cameraListenerKeys_ = null;

  /**
   * @private
   * @type {Array.<number>}
   */
  this.layersListenerKeys_ = null;

  /**
   * @private
   * @type {Object.<number, ol.LayerRenderer>}
   */
  this.layerRenderers_ = {};

  goog.events.listen(target, goog.events.EventType.RESIZE,
      this.handleTargetResize, false, this);

  goog.events.listen(
      this, ol.Object.getChangedEventType(ol.MapRendererProperty.CAMERA),
      this.handleCameraChanged, false, this);

  goog.events.listen(
      this, ol.Object.getChangedEventType(ol.MapRendererProperty.LAYERS),
      this.handleLayersChanged, false, this);

  if (goog.isDef(opt_values)) {
    this.setValues(opt_values);
  }

};
goog.inherits(ol.MapRenderer, ol.Object);


/**
 * @param {ol.Layer} layer Layer.
 * @protected
 * @return {ol.LayerRenderer} layerRenderer Layer renderer.
 */
ol.MapRenderer.prototype.createLayerRenderer = goog.abstractMethod;


/**
 * @return {ol.Camera} Camera.
 */
ol.MapRenderer.prototype.getCamera = function() {
  return /** @type {ol.Camera} */ (this.get(ol.MapRendererProperty.CAMERA));
};


/**
 * @return {ol.Array} Layers.
 */
ol.MapRenderer.prototype.getLayers = function() {
  return /** @type {ol.Array} */ (this.get(ol.MapRendererProperty.LAYERS));
};


/**
 * @return {ol.Projection} Projection.
 */
ol.MapRenderer.prototype.getProjection = function() {
  return /** @type {ol.Projection} */ (
      this.get(ol.MapRendererProperty.PROJECTION));
};


/**
 * @protected
 * @return {goog.math.Size} Size.
 */
ol.MapRenderer.prototype.getSize = function() {
  return this.size_;
};


/**
 * @return {HTMLDivElement} Target.
 */
ol.MapRenderer.prototype.getTarget = function() {
  return this.target_;
};


/**
 * @protected
 */
ol.MapRenderer.prototype.handleCameraChanged = function() {
  if (!goog.isNull(this.cameraListenerKeys_)) {
    goog.array.forEach(this.cameraListenerKeys_, goog.events.unlistenByKey);
    this.cameraListenerKeys_ = null;
  }
  var camera = this.getCamera();
  if (!goog.isNull(camera)) {
    this.cameraListenerKeys_ = goog.array.map(
        goog.object.getValues(ol.CameraProperty),
        function(cameraProperty) {
          return goog.events.listen(camera, cameraProperty,
              this.handleCameraPropertyChanged, false, this);
        });
  }
};


/**
 * @protected
 */
ol.MapRenderer.prototype.handleCameraPropertyChanged = function() {
};


/**
 * @param {ol.Layer} layer Layer.
 * @protected
 */
ol.MapRenderer.prototype.handleLayerAdd = function(layer) {
  var key = goog.getUid(layer);
  var layerRenderer = this.createLayerRenderer(layer);
  this.layerRenderers_[key] = layerRenderer;
};


/**
 * @param {ol.Layer} layer Layer.
 * @protected
 */
ol.MapRenderer.prototype.handleLayerRemove = function(layer) {
  var key = goog.getUid(layer);
  goog.asserts.assert(key in this.layerRenderers_);
  var layerRenderer = this.layerRenderers_[key];
  delete this.layerRenderers_[key];
  goog.dispose(layerRenderer);
};


/**
 * @param {ol.ArrayEvent} event Event.
 * @protected
 */
ol.MapRenderer.prototype.handleLayersInsertAt = function(event) {
  var layers = /** @type {ol.Array} */ (event.target);
  var layer = /** @type {ol.Layer} */ layers.getAt(event.index);
  this.handleLayerAdd(layer);
};


/**
 * @param {ol.ArrayEvent} event Event.
 * @protected
 */
ol.MapRenderer.prototype.handleLayersRemoveAt = function(event) {
  var layer = /** @type {ol.Layer} */ (event.prev);
  this.handleLayerRemove(layer);
};


/**
 * @param {ol.ArrayEvent} event Event.
 * @protected
 */
ol.MapRenderer.prototype.handleLayersSetAt = function(event) {
  var prevLayer = /** @type {ol.Layer} */ (event.prev);
  this.handleLayerRemove(prevLayer);
  var layers = /** @type {ol.Array} */ (event.target);
  var layer = /** @type {ol.Layer} */ layers.getAt(event.index);
  this.handleLayerAdd(layer);
};


/**
 */
ol.MapRenderer.prototype.handleLayersChanged = function() {
  if (!goog.isNull(this.layersListenerKeys_)) {
    goog.array.forEach(this.layersListenerKeys_, goog.events.unlistenByKey);
    this.layersListenerKeys_ = null;
  }
  var layers = this.getLayers();
  if (!goog.isNull(layers)) {
    this.layersListenerKeys_ = [
      goog.events.listen(layers, ol.ArrayEventType.INSERT_AT,
          this.handleLayersInsertAt, false, this),
      goog.events.listen(layers, ol.ArrayEventType.REMOVE_AT,
          this.handleLayersRemoveAt, false, this),
      goog.events.listen(layers, ol.ArrayEventType.SET_AT,
          this.handleLayersSetAt, false, this)
    ];
  }
};


/**
 * @param {goog.events.Event} event Event.
 * @protected
 */
ol.MapRenderer.prototype.handleTargetResize = function(event) {
  goog.asserts.assert(event.target == this.target_);
  this.size_.width = this.target_.clientWidth;
  this.size_.height = this.target_.clientHeight;
};


/**
 * @param {ol.Camera} camera Camera.
 */
ol.MapRenderer.prototype.setCamera = function(camera) {
  this.set(ol.MapRendererProperty.CAMERA, camera);
};


/**
 * @param {ol.Array} layers Layers.
 */
ol.MapRenderer.prototype.setLayers = function(layers) {
  this.set(ol.MapRendererProperty.LAYERS, layers);
};


/**
 * @param {ol.Projection} projection Projection.
 */
ol.MapRenderer.prototype.setProjection = function(projection) {
  this.set(ol.MapRendererProperty.PROJECTION, projection);
};
