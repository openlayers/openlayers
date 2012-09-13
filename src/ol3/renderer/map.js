goog.provide('ol3.renderer.Map');

goog.require('goog.Disposable');
goog.require('goog.events');
goog.require('goog.fx.anim');
goog.require('goog.fx.anim.Animated');
goog.require('goog.vec.Mat4');
goog.require('ol3.Map');
goog.require('ol3.MapProperty');



/**
 * @constructor
 * @extends {goog.Disposable}
 * @param {Element} container Container.
 * @param {ol3.Map} map Map.
 */
ol3.renderer.Map = function(container, map) {

  goog.base(this);

  /**
   * @private
   * @type {Element}
   */
  this.container_ = container;

  /**
   * @protected
   * @type {ol3.Map}
   */
  this.map = map;

  /**
   * @protected
   * @type {Object.<number, ol3.renderer.Layer>}
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
        map, ol3.Object.getChangedEventType(ol3.MapProperty.BACKGROUND_COLOR),
        this.handleBackgroundColorChanged, false, this),

    goog.events.listen(
        map, ol3.Object.getChangedEventType(ol3.MapProperty.CENTER),
        this.handleCenterChanged, false, this),

    goog.events.listen(
        map, ol3.Object.getChangedEventType(ol3.MapProperty.LAYERS),
        this.handleLayersChanged, false, this),

    goog.events.listen(
        map, ol3.Object.getChangedEventType(ol3.MapProperty.RESOLUTION),
        this.handleResolutionChanged, false, this),

    goog.events.listen(
        map, ol3.Object.getChangedEventType(ol3.MapProperty.ROTATION),
        this.handleRotationChanged, false, this),

    goog.events.listen(
        map, ol3.Object.getChangedEventType(ol3.MapProperty.SIZE),
        this.handleSizeChanged, false, this)
  ];

};
goog.inherits(ol3.renderer.Map, goog.Disposable);


/**
 * @param {ol3.Layer} layer Layer.
 * @protected
 */
ol3.renderer.Map.prototype.addLayer = function(layer) {
  var layerRenderer = this.createLayerRenderer(layer);
  this.setLayerRenderer(layer, layerRenderer);
};


/**
 * @return {boolean} Can rotate.
 */
ol3.renderer.Map.prototype.canRotate = goog.functions.FALSE;


/**
 * @param {ol3.Layer} layer Layer.
 * @protected
 * @return {ol3.renderer.Layer} layerRenderer Layer renderer.
 */
ol3.renderer.Map.prototype.createLayerRenderer = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol3.renderer.Map.prototype.disposeInternal = function() {
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
 * @param {function(this: T, ol3.Layer, ol3.renderer.Layer, number)} f Function.
 * @param {T=} opt_obj Object.
 * @template T
 */
ol3.renderer.Map.prototype.forEachReadyVisibleLayer = function(f, opt_obj) {
  var layers = this.map.getLayers();
  layers.forEach(function(layer, index) {
    if (layer.isReady() && layer.getVisible()) {
      var layerRenderer = this.getLayerRenderer(layer);
      f.call(opt_obj, layer, layerRenderer, index);
    }
  }, this);
};


/**
 * @param {ol3.Pixel} pixel Pixel.
 * @return {ol3.Coordinate} Coordinate.
 */
ol3.renderer.Map.prototype.getCoordinateFromPixel = function(pixel) {
  this.updateMatrices_();
  var vec3 = [pixel.x, pixel.y, 0];
  goog.vec.Mat4.multVec3(this.pixelToCoordinateMatrix_, vec3, vec3);
  return new ol3.Coordinate(vec3[0], vec3[1]);
};


/**
 * @param {ol3.Layer} layer Layer.
 * @protected
 * @return {ol3.renderer.Layer} Layer renderer.
 */
ol3.renderer.Map.prototype.getLayerRenderer = function(layer) {
  var key = goog.getUid(layer);
  var layerRenderer = this.layerRenderers[key];
  goog.asserts.assert(goog.isDef(layerRenderer));
  return layerRenderer;
};


/**
 * @return {ol3.Map} Map.
 */
ol3.renderer.Map.prototype.getMap = function() {
  return this.map;
};


/**
 * @param {ol3.Coordinate} coordinate Coordinate.
 * @return {ol3.Pixel} Pixel.
 */
ol3.renderer.Map.prototype.getPixelFromCoordinate = function(coordinate) {
  this.updateMatrices_();
  var vec3 = [coordinate.x, coordinate.y, 0];
  goog.vec.Mat4.multVec3(this.coordinateToPixelMatrix_, vec3, vec3);
  return new ol3.Pixel(vec3[0], vec3[1]);
};


/**
 */
ol3.renderer.Map.prototype.handleBackgroundColorChanged = goog.nullFunction;


/**
 * @protected
 */
ol3.renderer.Map.prototype.handleCenterChanged = function() {
  this.matricesDirty_ = true;
};


/**
 * @param {ol3.CollectionEvent} collectionEvent Collection event.
 * @protected
 */
ol3.renderer.Map.prototype.handleLayersAdd = function(collectionEvent) {
  var layer = /** @type {ol3.Layer} */ collectionEvent.elem;
  this.addLayer(layer);
};


/**
 * @protected
 */
ol3.renderer.Map.prototype.handleLayersChanged = function() {
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
      goog.events.listen(layers, ol3.CollectionEventType.ADD,
          this.handleLayersAdd, false, this),
      goog.events.listen(layers, ol3.CollectionEventType.REMOVE,
          this.handleLayersRemove, false, this)
    ];
  }
};


/**
 * @param {ol3.CollectionEvent} collectionEvent Collection event.
 * @protected
 */
ol3.renderer.Map.prototype.handleLayersRemove = function(collectionEvent) {
  var layer = /** @type {ol3.Layer} */ collectionEvent.elem;
  this.removeLayer(layer);
};


/**
 * @protected
 */
ol3.renderer.Map.prototype.handleResolutionChanged = function() {
  this.matricesDirty_ = true;
};


/**
 * @protected
 */
ol3.renderer.Map.prototype.handleRotationChanged = function() {
  this.matricesDirty_ = true;
};


/**
 * @protected
 */
ol3.renderer.Map.prototype.handleSizeChanged = function() {
  this.matricesDirty_ = true;
};


/**
 * @param {ol3.Layer} layer Layer.
 * @protected
 */
ol3.renderer.Map.prototype.removeLayer = function(layer) {
  goog.dispose(this.removeLayerRenderer(layer));
};


/**
 * @param {ol3.Layer} layer Layer.
 * @return {ol3.renderer.Layer} Layer renderer.
 * @protected
 */
ol3.renderer.Map.prototype.removeLayerRenderer = function(layer) {
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
 * @return {boolean} Animating.
 */
ol3.renderer.Map.prototype.render = function() {
  var animate = false;
  this.forEachReadyVisibleLayer(function(layer, layerRenderer) {
    if (layerRenderer.render()) {
      animate = true;
    }
  });
  return animate;
};


/**
 * @param {ol3.Layer} layer Layer.
 * @param {ol3.renderer.Layer} layerRenderer Layer renderer.
 * @protected
 */
ol3.renderer.Map.prototype.setLayerRenderer = function(layer, layerRenderer) {
  var key = goog.getUid(layer);
  goog.asserts.assert(!(key in this.layerRenderers));
  this.layerRenderers[key] = layerRenderer;
};


/**
 * @private
 */
ol3.renderer.Map.prototype.updateMatrices_ = function() {

  if (this.matricesDirty_) {

    var map = this.map;
    var center = /** @type {!ol3.Coordinate} */ map.getCenter();
    var resolution = /** @type {number} */ map.getResolution();
    var rotation = map.getRotation();
    var size = /** @type {!ol3.Size} */ map.getSize();

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
