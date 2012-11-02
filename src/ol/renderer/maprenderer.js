goog.provide('ol.renderer.Map');

goog.require('goog.Disposable');
goog.require('goog.events');
goog.require('goog.fx.anim');
goog.require('goog.fx.anim.Animated');
goog.require('goog.vec.Mat4');



/**
 * @constructor
 * @extends {goog.Disposable}
 * @param {Element} container Container.
 * @param {ol.Map} map Map.
 */
ol.renderer.Map = function(container, map) {

  goog.base(this);

  /**
   * @private
   * @type {Element}
   */
  this.container_ = container;

  /**
   * @protected
   * @type {ol.Map}
   */
  this.map = map;

  /**
   * @protected
   * @type {Object.<number, ol.renderer.Layer>}
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
goog.inherits(ol.renderer.Map, goog.Disposable);


/**
 * @param {ol.layer.Layer} layer Layer.
 * @protected
 */
ol.renderer.Map.prototype.addLayer = function(layer) {
  var layerRenderer = this.createLayerRenderer(layer);
  this.setLayerRenderer(layer, layerRenderer);
};


/**
 * @return {boolean} Can rotate.
 */
ol.renderer.Map.prototype.canRotate = goog.functions.FALSE;


/**
 * @param {ol.layer.Layer} layer Layer.
 * @protected
 * @return {ol.renderer.Layer} layerRenderer Layer renderer.
 */
ol.renderer.Map.prototype.createLayerRenderer = function(layer) {
  return null;
};


/**
 * @inheritDoc
 */
ol.renderer.Map.prototype.disposeInternal = function() {
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
 * @param {function(this: T, ol.layer.Layer, ol.renderer.Layer, number)} f
 *     Function.
 * @param {T=} opt_obj Object.
 * @template T
 */
ol.renderer.Map.prototype.forEachReadyVisibleLayer = function(f, opt_obj) {
  var layers = this.map.getLayers();
  if (goog.isDef(layers)) {
    layers.forEach(function(layer, index) {
      if (layer.isReady() && layer.getVisible()) {
        var layerRenderer = this.getLayerRenderer(layer);
        f.call(opt_obj, layer, layerRenderer, index);
      }
    }, this);
  }
};


/**
 * @param {ol.Pixel} pixel Pixel.
 * @return {ol.Coordinate} Coordinate.
 */
ol.renderer.Map.prototype.getCoordinateFromPixel = function(pixel) {
  this.updateMatrices_();
  var vec3 = [pixel.x, pixel.y, 0];
  goog.vec.Mat4.multVec3(this.pixelToCoordinateMatrix_, vec3, vec3);
  return new ol.Coordinate(vec3[0], vec3[1]);
};


/**
 * @param {ol.layer.Layer} layer Layer.
 * @protected
 * @return {ol.renderer.Layer} Layer renderer.
 */
ol.renderer.Map.prototype.getLayerRenderer = function(layer) {
  var key = goog.getUid(layer);
  var layerRenderer = this.layerRenderers[key];
  goog.asserts.assert(goog.isDef(layerRenderer));
  return layerRenderer;
};


/**
 * @return {ol.Map} Map.
 */
ol.renderer.Map.prototype.getMap = function() {
  return this.map;
};


/**
 * @param {ol.Coordinate} coordinate Coordinate.
 * @return {ol.Pixel} Pixel.
 */
ol.renderer.Map.prototype.getPixelFromCoordinate = function(coordinate) {
  this.updateMatrices_();
  var vec3 = [coordinate.x, coordinate.y, 0];
  goog.vec.Mat4.multVec3(this.coordinateToPixelMatrix_, vec3, vec3);
  return new ol.Pixel(vec3[0], vec3[1]);
};


/**
 * Handle background color changed.
 */
ol.renderer.Map.prototype.handleBackgroundColorChanged = goog.nullFunction;


/**
 * @protected
 */
ol.renderer.Map.prototype.handleCenterChanged = function() {
  this.matricesDirty_ = true;
};


/**
 * @param {ol.CollectionEvent} collectionEvent Collection event.
 * @protected
 */
ol.renderer.Map.prototype.handleLayersAdd = function(collectionEvent) {
  var layer = /** @type {ol.layer.Layer} */ collectionEvent.elem;
  this.addLayer(layer);
};


/**
 * @protected
 */
ol.renderer.Map.prototype.handleLayersChanged = function() {
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
ol.renderer.Map.prototype.handleLayersRemove = function(collectionEvent) {
  var layer = /** @type {ol.layer.Layer} */ collectionEvent.elem;
  this.removeLayer(layer);
};


/**
 * @protected
 */
ol.renderer.Map.prototype.handleResolutionChanged = function() {
  this.matricesDirty_ = true;
};


/**
 * @protected
 */
ol.renderer.Map.prototype.handleRotationChanged = function() {
  this.matricesDirty_ = true;
};


/**
 * @protected
 */
ol.renderer.Map.prototype.handleSizeChanged = function() {
  this.matricesDirty_ = true;
};


/**
 * @param {ol.layer.Layer} layer Layer.
 * @protected
 */
ol.renderer.Map.prototype.removeLayer = function(layer) {
  goog.dispose(this.removeLayerRenderer(layer));
};


/**
 * @param {ol.layer.Layer} layer Layer.
 * @return {ol.renderer.Layer} Layer renderer.
 * @protected
 */
ol.renderer.Map.prototype.removeLayerRenderer = function(layer) {
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
ol.renderer.Map.prototype.render = goog.functions.FALSE;


/**
 * @param {ol.layer.Layer} layer Layer.
 * @param {ol.renderer.Layer} layerRenderer Layer renderer.
 * @protected
 */
ol.renderer.Map.prototype.setLayerRenderer = function(layer, layerRenderer) {
  var key = goog.getUid(layer);
  goog.asserts.assert(!(key in this.layerRenderers));
  this.layerRenderers[key] = layerRenderer;
};


/**
 * @private
 */
ol.renderer.Map.prototype.updateMatrices_ = function() {

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
      goog.vec.Mat4.rotateZ(this.coordinateToPixelMatrix_, -rotation);
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
