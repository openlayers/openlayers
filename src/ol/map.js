goog.provide('ol.Map');
goog.provide('ol.MapProperty');

goog.require('goog.array');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.events.EventType');
goog.require('goog.object');
goog.require('ol.Array');
goog.require('ol.Camera');
goog.require('ol.CameraProperty');
goog.require('ol.Extent');
goog.require('ol.LayerRenderer');
goog.require('ol.Object');
goog.require('ol.Projection');


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
 * @param {HTMLDivElement} target Target.
 * @param {Object=} opt_values Values.
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
   * @type {goog.math.Size}
   */
  this.size_ = new goog.math.Size(target.clientWidth, target.clientHeight);

  /**
   * @private
   * @type {ol.Extent}
   */
  this.extent_ = null;

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
      this, ol.Object.getChangedEventType(ol.MapProperty.CAMERA),
      this.handleCameraChanged, false, this);

  goog.events.listen(
      this, ol.Object.getChangedEventType(ol.MapProperty.LAYERS),
      this.handleLayersChanged, false, this);

  if (goog.isDef(opt_values)) {
    this.setValues(opt_values);
  }

};
goog.inherits(ol.Map, ol.Object);


/**
 * @param {ol.Layer} layer Layer.
 * @protected
 * @return {ol.LayerRenderer} layerRenderer Layer renderer.
 */
ol.Map.prototype.createLayerRenderer = goog.abstractMethod;


/**
 * @protected
 * @param {function(this: T, ol.LayerRenderer)} f Function.
 * @param {T=} opt_obj The object to be used for the value of 'this' within f.
 * @template T
 */
ol.Map.prototype.forEachLayerRenderer = function(f, opt_obj) {
  var layers = this.getLayers();
  if (goog.isDefAndNotNull(layers)) {
    layers.forEach(function(layer) {
      var key = goog.getUid(layer);
      var layerRenderer = this.layerRenderers_[key];
      f.call(opt_obj, layerRenderer);
    }, this);
  }
};


/**
 * @return {ol.Camera} Camera.
 */
ol.Map.prototype.getCamera = function() {
  return /** @type {ol.Camera} */ (this.get(ol.MapProperty.CAMERA));
};


/**
 * @return {ol.Extent} Extent.
 */
ol.Map.prototype.getExtent = function() {
  return this.extent_.clone();
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
 * @param {ol.Extent} extent Extent.
 * @return {number} Resolution.
 */
ol.Map.prototype.getResolutionForExtent = function(extent) {
  var size = this.size_;
  var xResolution = (extent.right - extent.left) / size.width;
  var yResolution = (extent.top - extent.bottom) / size.height;
  // FIXME support discrete resolutions
  return Math.max(xResolution, yResolution);
};


/**
 * @protected
 * @return {goog.math.Size} Size.
 */
ol.Map.prototype.getSize = function() {
  return this.size_.clone();
};


/**
 * @return {HTMLDivElement} Target.
 */
ol.Map.prototype.getTarget = function() {
  return this.target_;
};


/**
 * @protected
 */
ol.Map.prototype.handleCameraChanged = function() {
  if (!goog.isNull(this.cameraListenerKeys_)) {
    goog.array.forEach(this.cameraListenerKeys_, goog.events.unlistenByKey);
    this.cameraListenerKeys_ = null;
  }
  var camera = this.getCamera();
  if (goog.isDefAndNotNull(camera)) {
    this.cameraListenerKeys_ = goog.array.map(
        goog.object.getValues(ol.CameraProperty),
        function(cameraProperty) {
          return goog.events.listen(camera,
              ol.Object.getChangedEventType(cameraProperty),
              this.handleCameraPropertyChanged, false, this);
        },
        this);
    this.handleCameraPropertyChanged();
  }
};


/**
 * @protected
 */
ol.Map.prototype.handleCameraPropertyChanged = function() {
  var camera = this.getCamera();
  var position = camera.getPosition();
  if (!goog.isDef(position)) {
    return;
  }
  var resolution = camera.getResolution();
  if (!goog.isDef(resolution)) {
    return;
  }
  var size = this.size_;
  var extent = this.extent_;
  extent.left = position.x - resolution * size.width / 2;
  extent.right = position.x + resolution * size.width / 2;
  extent.bottom = position.y - resolution * size.height / 2;
  extent.top = position.y + resolution * size.height / 2;
};


/**
 * @param {ol.Layer} layer Layer.
 * @protected
 */
ol.Map.prototype.handleLayerAdd = function(layer) {
  var key = goog.getUid(layer);
  var layerRenderer = this.createLayerRenderer(layer);
  this.layerRenderers_[key] = layerRenderer;
};


/**
 * @param {ol.Layer} layer Layer.
 * @protected
 */
ol.Map.prototype.handleLayerRemove = function(layer) {
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
ol.Map.prototype.handleLayersInsertAt = function(event) {
  var layers = /** @type {ol.Array} */ (event.target);
  var layer = /** @type {ol.Layer} */ layers.getAt(event.index);
  this.handleLayerAdd(layer);
};


/**
 * @param {ol.ArrayEvent} event Event.
 * @protected
 */
ol.Map.prototype.handleLayersRemoveAt = function(event) {
  var layer = /** @type {ol.Layer} */ (event.prev);
  this.handleLayerRemove(layer);
};


/**
 * @param {ol.ArrayEvent} event Event.
 * @protected
 */
ol.Map.prototype.handleLayersSetAt = function(event) {
  var prevLayer = /** @type {ol.Layer} */ (event.prev);
  this.handleLayerRemove(prevLayer);
  var layers = /** @type {ol.Array} */ (event.target);
  var layer = /** @type {ol.Layer} */ layers.getAt(event.index);
  this.handleLayerAdd(layer);
};


/**
 */
ol.Map.prototype.handleLayersChanged = function() {
  if (!goog.isNull(this.layersListenerKeys_)) {
    goog.array.forEach(this.layersListenerKeys_, goog.events.unlistenByKey);
    this.layersListenerKeys_ = null;
  }
  var layers = this.getLayers();
  if (goog.isDefAndNotNull(layers)) {
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
ol.Map.prototype.handleTargetResize = function(event) {
  goog.asserts.assert(event.target == this.target_);
  this.size_.width = this.target_.clientWidth;
  this.size_.height = this.target_.clientHeight;
};


/**
 * @param {ol.Camera} camera Camera.
 */
ol.Map.prototype.setCamera = function(camera) {
  this.set(ol.MapProperty.CAMERA, camera);
};


/**
 * @param {ol.Extent} extent Extent.
 */
ol.Map.prototype.setExtent = function(extent) {
  var camera = this.getCamera();
  var position = extent.getCenter();
  camera.setPosition(position);
  var resolution = this.getResolutionForExtent(extent);
  camera.setResolution(resolution);
};


/**
 * @param {ol.Array} layers Layers.
 */
ol.Map.prototype.setLayers = function(layers) {
  this.set(ol.MapProperty.LAYERS, layers);
};


/**
 * @param {ol.Projection} projection Projection.
 */
ol.Map.prototype.setProjection = function(projection) {
  this.set(ol.MapProperty.PROJECTION, projection);
};
