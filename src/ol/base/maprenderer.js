goog.provide('ol.MapRenderer');

goog.require('goog.Disposable');
goog.require('goog.events');
goog.require('goog.fx.anim');
goog.require('goog.fx.anim.Animated');
goog.require('goog.vec.Mat4');
goog.require('ol.Map');
goog.require('ol.MapProperty');



/**
 * @constructor
 * @extends {goog.Disposable}
 * @param {Element} target Target.
 * @param {ol.Map} map Map.
 */
ol.MapRenderer = function(target, map) {

  goog.base(this);

  /**
   * @private
   * @type {Element}
   */
  this.target_ = target;

  /**
   * @protected
   * @type {ol.Map}
   */
  this.map = map;

  /**
   * @protected
   * @type {Object.<number, ol.LayerRenderer>}
   */
  this.layerRenderers = {};

  /**
   * @private
   * @type {Array.<number>}
   */
  this.layersListenerKeys_ = null;

  /**
   * @private
   * @type {goog.vec.Mat4.Number}
   */
  this.coordinateToPixelMatrix_ = goog.vec.Mat4.createNumber();

  /**
   * @private
   * @type {goog.vec.Mat4.Number}
   */
  this.pixelToCoordinateMatrix_ = goog.vec.Mat4.createNumber();

  /**
   * @private
   * @type {boolean}
   */
  this.matricesDirty_ = true;

  /**
   * @private
   * @type {Array.<number>}
   */
  this.mapListenerKeys_ = [
    goog.events.listen(
        map, ol.Object.getChangedEventType(ol.MapProperty.BACKGROUND_COLOR),
        this.handleBackgroundColorChanged, false, this),

    goog.events.listen(
        map, ol.Object.getChangedEventType(ol.MapProperty.CENTER),
        this.handleCenterChanged, false, this),

    goog.events.listen(
        map, ol.Object.getChangedEventType(ol.MapProperty.LAYERS),
        this.handleLayersChanged, false, this),

    goog.events.listen(
        map, ol.Object.getChangedEventType(ol.MapProperty.RESOLUTION),
        this.handleResolutionChanged, false, this),

    goog.events.listen(
        map, ol.Object.getChangedEventType(ol.MapProperty.ROTATION),
        this.handleRotationChanged, false, this),

    goog.events.listen(
        map, ol.Object.getChangedEventType(ol.MapProperty.SIZE),
        this.handleSizeChanged, false, this)
  ];

};
goog.inherits(ol.MapRenderer, goog.Disposable);


/**
 * @inheritDoc
 */
ol.MapRenderer.prototype.disposeInternal = function() {
  goog.object.forEach(this.layerRenderers, function(layerRenderer) {
    goog.dispose(layerRenderer);
  });
  goog.array.forEach(this.mapListenerKeys_, goog.events.unlistenByKey);
  if (!goog.isNull(this.layersListenerKeys_)) {
    goog.array.forEach(this.layersListenerKeys_, goog.events.unlistenByKey);
  }
  goog.base(this, 'disposeInternal');
};


/**
 * @param {function(this: T, ol.Layer, ol.LayerRenderer, number)} f Function.
 * @param {T=} opt_obj Object.
 * @template T
 */
ol.MapRenderer.prototype.forEachReadyVisibleLayer = function(f, opt_obj) {
  var layers = this.map.getLayers();
  layers.forEach(function(layer, index) {
    if (layer.isReady() && layer.getVisible()) {
      var layerRenderer = this.getLayerRenderer(layer);
      f.call(opt_obj, layer, layerRenderer, index);
    }
  }, this);
};


/**
 * @return {ol.Map} Map.
 */
ol.MapRenderer.prototype.getMap = function() {
  return this.map;
};


/**
 * @param {ol.Layer} layer Layer.
 * @protected
 * @return {ol.LayerRenderer} Layer renderer.
 */
ol.MapRenderer.prototype.getLayerRenderer = function(layer) {
  var key = goog.getUid(layer);
  var layerRenderer = this.layerRenderers[key];
  goog.asserts.assert(goog.isDef(layerRenderer));
  return layerRenderer;
};


/**
 * @param {ol.Layer} layer Layer.
 * @param {ol.LayerRenderer} layerRenderer Layer renderer.
 * @protected
 */
ol.MapRenderer.prototype.setLayerRenderer = function(layer, layerRenderer) {
  var key = goog.getUid(layer);
  goog.asserts.assert(!(key in this.layerRenderers));
  this.layerRenderers[key] = layerRenderer;
};


/**
 * @return {boolean} Can rotate.
 */
ol.MapRenderer.prototype.canRotate = goog.functions.FALSE;


/**
 */
ol.MapRenderer.prototype.handleBackgroundColorChanged = goog.nullFunction;


/**
 * @protected
 */
ol.MapRenderer.prototype.handleCenterChanged = function() {
  this.matricesDirty_ = true;
};


/**
 * @protected
 */
ol.MapRenderer.prototype.handleLayersChanged = function() {
  var layerRenderers = goog.object.getValues(this.layerRenderers);
  goog.array.forEach(layerRenderers, function(layerRenderer) {
    this.removeLayerRenderer(layerRenderer);
  }, this);
  this.layerRenderers = {};
  if (!goog.isNull(this.layersListenerKeys_)) {
    goog.array.forEach(this.layersListenerKeys_, goog.events.unlistenByKey);
    this.layersListenerKeys_ = null;
  }
  var layers = this.map.getLayers();
  if (goog.isDefAndNotNull(layers)) {
    layers.forEach(this.addLayer, this);
    this.layersListenerKeys_ = [
      goog.events.listen(layers, ol.CollectionEventType.ADD,
          this.handleLayersAdd, false, this),
      goog.events.listen(layers, ol.CollectionEventType.REMOVE,
          this.handleLayersRemove, false, this)
    ];
  }
};


/**
 * @param {ol.CollectionEvent} collectionEvent Collection event.
 * @protected
 */
ol.MapRenderer.prototype.handleLayersAdd = function(collectionEvent) {
  var layer = /** @type {ol.Layer} */ collectionEvent.elem;
  this.addLayer(layer);
};


/**
 * @param {ol.Layer} layer Layer.
 * @protected
 */
ol.MapRenderer.prototype.addLayer = function(layer) {
  var layerRenderer = this.createLayerRenderer(layer);
  this.setLayerRenderer(layer, layerRenderer);
};


/**
 * @param {ol.Layer} layer Layer.
 * @protected
 * @return {ol.LayerRenderer} layerRenderer Layer renderer.
 */
ol.MapRenderer.prototype.createLayerRenderer = goog.abstractMethod;


/**
 * @param {ol.CollectionEvent} collectionEvent Collection event.
 * @protected
 */
ol.MapRenderer.prototype.handleLayersRemove = function(collectionEvent) {
  var layer = /** @type {ol.Layer} */ collectionEvent.elem;
  this.removeLayer(layer);
};


/**
 * @param {ol.Layer} layer Layer.
 * @protected
 */
ol.MapRenderer.prototype.removeLayer = function(layer) {
  goog.dispose(this.removeLayerRenderer(layer));
};


/**
 * @param {ol.Layer} layer Layer.
 * @return {ol.LayerRenderer} Layer renderer.
 * @protected
 */
ol.MapRenderer.prototype.removeLayerRenderer = function(layer) {
  var key = goog.getUid(layer);
  if (key in this.layerRenderers) {
    var layerRenderer = this.layerRenderers[key];
    delete this.layerRenderers[key];
    return layerRenderer;
  } else {
    return null;
  }
};


/**
 * @protected
 */
ol.MapRenderer.prototype.handleResolutionChanged = function() {
  this.matricesDirty_ = true;
};


/**
 * @protected
 */
ol.MapRenderer.prototype.handleRotationChanged = function() {
  this.matricesDirty_ = true;
};


/**
 * @protected
 */
ol.MapRenderer.prototype.handleSizeChanged = function() {
  this.matricesDirty_ = true;
};


/**
 * @return {boolean} Animating.
 */
ol.MapRenderer.prototype.render = function() {
  var animate = false;
  this.forEachReadyVisibleLayer(function(layer, layerRenderer) {
    if (layerRenderer.render()) {
      animate = true;
    }
  });
  return animate;
};


/**
 * @private
 */
ol.MapRenderer.prototype.updateMatrices_ = function() {

  if (this.matricesDirty_) {

    var map = this.map;
    var center = /** @type {!ol.Coordinate} */ map.getCenter();
    var resolution = /** @type {number} */ map.getResolution();
    var rotation = map.getRotation();
    var size = /** @type {!ol.Size} */ map.getSize();

    goog.vec.Mat4.makeIdentity(this.coordinateToPixelMatrix_);
    goog.vec.Mat4.translate(this.coordinateToPixelMatrix_,
        size.width / 2,
        size.height / 2,
        0);
    goog.vec.Mat4.scale(this.coordinateToPixelMatrix_,
        1 / resolution,
        -1 / resolution,
        1);
    if (this.canRotate() && goog.isDef(rotation)) {
      goog.vec.Mat4.rotate(this.coordinateToPixelMatrix_,
          -rotation,
          0,
          0,
          1);
    }
    goog.vec.Mat4.translate(this.coordinateToPixelMatrix_,
        -center.x,
        -center.y,
        0);

    var inverted = goog.vec.Mat4.invert(
        this.coordinateToPixelMatrix_, this.pixelToCoordinateMatrix_);
    goog.asserts.assert(inverted);

    this.matricesDirty_ = false;

  }

};


/**
 * @param {ol.Pixel} pixel Pixel.
 * @return {ol.Coordinate} Coordinate.
 */
ol.MapRenderer.prototype.getCoordinateFromPixel = function(pixel) {
  this.updateMatrices_();
  var vec3 = [pixel.x, pixel.y, 0];
  goog.vec.Mat4.multVec3(this.pixelToCoordinateMatrix_, vec3, vec3);
  return new ol.Coordinate(vec3[0], vec3[1]);
};


/**
 * @param {ol.Coordinate} coordinate Coordinate.
 * @return {ol.Pixel} Pixel.
 */
ol.MapRenderer.prototype.getPixelFromCoordinate = function(coordinate) {
  this.updateMatrices_();
  var vec3 = [coordinate.x, coordinate.y, 0];
  goog.vec.Mat4.multVec3(this.coordinateToPixelMatrix_, vec3, vec3);
  return new ol.Pixel(vec3[0], vec3[1]);
};
