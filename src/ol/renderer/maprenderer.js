goog.provide('ol.renderer.Map');

goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.functions');
goog.require('goog.fx.anim');
goog.require('goog.fx.anim.Animated');
goog.require('goog.vec.Mat4');
goog.require('ol.View2D');
goog.require('ol.View2DProperty');



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
   * @type {?number}
   */
  this.viewPropertyListenerKey_ = null;

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
        map, ol.Object.getChangedEventType(ol.MapProperty.LAYERS),
        this.handleLayersChanged, false, this),

    goog.events.listen(
        map, ol.Object.getChangedEventType(ol.MapProperty.SIZE),
        this.handleSizeChanged, false, this),

    goog.events.listen(
        map, ol.Object.getChangedEventType(ol.MapProperty.VIEW),
        this.handleViewChanged, false, this)
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
ol.renderer.Map.prototype.createLayerRenderer = goog.functions.NULL;


/**
 * @inheritDoc
 */
ol.renderer.Map.prototype.disposeInternal = function() {
  goog.object.forEach(this.layerRenderers, function(layerRenderer) {
    goog.dispose(layerRenderer);
  });
  goog.array.forEach(this.mapListenerKeys_, goog.events.unlistenByKey);
  if (!goog.isNull(this.viewPropertyListenerKey_)) {
    goog.events.unlistenByKey(this.viewPropertyListenerKey_);
  }
  if (!goog.isNull(this.layersListenerKeys_)) {
    goog.array.forEach(this.layersListenerKeys_, goog.events.unlistenByKey);
  }
  goog.base(this, 'disposeInternal');
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
 * @param {ol.CollectionEvent} collectionEvent Collection event.
 * @protected
 */
ol.renderer.Map.prototype.handleLayersAdd = function(collectionEvent) {
  var layer = /** @type {ol.layer.Layer} */ (collectionEvent.elem);
  this.addLayer(layer);
};


/**
 * @protected
 */
ol.renderer.Map.prototype.handleLayersChanged = function() {
  goog.disposeAll(goog.object.getValues(this.layerRenderers));
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
  var layer = /** @type {ol.layer.Layer} */ (collectionEvent.elem);
  this.removeLayer(layer);
};


/**
 * @protected
 */
ol.renderer.Map.prototype.handleViewPropertyChanged = function() {
  this.matricesDirty_ = true;
};


/**
 * @protected
 */
ol.renderer.Map.prototype.handleSizeChanged = function() {
  this.matricesDirty_ = true;
};


/**
 * @protected
 */
ol.renderer.Map.prototype.handleViewChanged = function() {
  if (!goog.isNull(this.viewPropertyListenerKey_)) {
    goog.events.unlistenByKey(this.viewPropertyListenerKey_);
    this.viewPropertyListenerKey_ = null;
  }
  var view = this.getMap().getView();
  if (goog.isDefAndNotNull(view)) {
    this.viewPropertyListenerKey_ = goog.events.listen(
        view, ol.ObjectEventType.CHANGED,
        this.handleViewPropertyChanged, false, this);
  }
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
 * Render.
 * @param {number} time Time.
 */
ol.renderer.Map.prototype.renderFrame = goog.functions.FALSE;


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
    var view = map.getView().getView2D();
    var center = /** @type {!ol.Coordinate} */ (view.getCenter());
    var resolution = /** @type {number} */ (view.getResolution());
    var rotation = view.getRotation();
    var size = /** @type {!ol.Size} */ (map.getSize());

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
