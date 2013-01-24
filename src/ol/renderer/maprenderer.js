goog.provide('ol.renderer.Map');

goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.functions');
goog.require('goog.vec.Mat4');
goog.require('ol.FrameState');
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

  //
  // We listen to layer add/remove to add/remove layer renderers.
  //

  /**
   * @private
   * @type {?number}
   */
  this.mapLayersChangedListenerKey_ =
      goog.events.listen(
          map, ol.Object.getChangedEventType(ol.MapProperty.LAYERS),
          this.handleLayersChanged, false, this);

  /**
   * @private
   * @type {Array.<number>}
   */
  this.layersListenerKeys_ = null;

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
 * @param {ol.FrameState} frameState FrameState.
 * @protected
 */
ol.renderer.Map.prototype.calculateMatrices2D = function(frameState) {

  var view2DState = frameState.view2DState;
  var coordinateToPixelMatrix = frameState.coordinateToPixelMatrix;

  goog.vec.Mat4.makeIdentity(coordinateToPixelMatrix);
  goog.vec.Mat4.translate(coordinateToPixelMatrix,
      frameState.size.width / 2,
      frameState.size.height / 2,
      0);
  goog.vec.Mat4.scale(coordinateToPixelMatrix,
      1 / view2DState.resolution,
      -1 / view2DState.resolution,
      1);
  goog.vec.Mat4.rotateZ(coordinateToPixelMatrix,
      -view2DState.rotation);
  goog.vec.Mat4.translate(coordinateToPixelMatrix,
      -view2DState.center.x,
      -view2DState.center.y,
      0);

  var inverted = goog.vec.Mat4.invert(
      coordinateToPixelMatrix, frameState.pixelToCoordinateMatrix);
  goog.asserts.assert(inverted);

};


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
  goog.events.unlistenByKey(this.mapLayersChangedListenerKey_);
  if (!goog.isNull(this.layersListenerKeys_)) {
    goog.array.forEach(this.layersListenerKeys_, goog.events.unlistenByKey);
  }
  goog.base(this, 'disposeInternal');
};


/**
 * @return {Element} Canvas.
 */
ol.renderer.Map.prototype.getCanvas = goog.functions.NULL;


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
 * @param {?ol.FrameState} frameState Frame state.
 */
ol.renderer.Map.prototype.renderFrame = goog.nullFunction;


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
