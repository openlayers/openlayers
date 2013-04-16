goog.provide('ol.renderer.Map');

goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dispose');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.functions');
goog.require('goog.object');
goog.require('goog.vec.Mat4');
goog.require('ol.CollectionEvent');
goog.require('ol.CollectionEventType');
goog.require('ol.FrameState');
goog.require('ol.Object');
goog.require('ol.layer.Layer');
goog.require('ol.renderer.Layer');



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
   * @private
   * @type {ol.Map}
   */
  this.map_ = map;

  /**
   * @private
   * @type {Object.<string, ol.renderer.Layer>}
   */
  this.layerRenderers_ = {};

  /**
   * @private
   * @type {?number}
   */
  this.mapLayersChangedListenerKey_ = goog.events.listen(
      map, ol.Object.getChangedEventType(ol.MapProperty.LAYERS),
      this.handleLayersChanged_, false, this);

  /**
   * @private
   * @type {Array.<?number>}
   */
  this.layersListenerKeys_ = null;

  /**
   * @private
   * @type {Object.<string, ?number>}
   */
  this.layerRendererChangeListenKeys_ = {};

};
goog.inherits(ol.renderer.Map, goog.Disposable);


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
      -view2DState.center[0],
      -view2DState.center[1],
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
ol.renderer.Map.prototype.createLayerRenderer = function(layer) {
  return new ol.renderer.Layer(this, layer);
};


/**
 * @inheritDoc
 */
ol.renderer.Map.prototype.disposeInternal = function() {
  goog.object.forEach(this.layerRenderers_, function(layerRenderer) {
    goog.dispose(layerRenderer);
  });
  goog.events.unlistenByKey(this.mapLayersChangedListenerKey_);
  goog.object.forEach(
      this.layerRendererChangeListenKeys_, goog.events.unlistenByKey);
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
  var layerKey = goog.getUid(layer).toString();
  if (layerKey in this.layerRenderers_) {
    return this.layerRenderers_[layerKey];
  } else {
    var layerRenderer = this.createLayerRenderer(layer);
    this.layerRenderers_[layerKey] = layerRenderer;
    this.layerRendererChangeListenKeys_[layerKey] = goog.events.listen(
        layerRenderer, goog.events.EventType.CHANGE,
        this.handleLayerRendererChange_, false, this);
    return layerRenderer;
  }
};


/**
 * @protected
 * @return {Object.<number, ol.renderer.Layer>} Layer renderers.
 */
ol.renderer.Map.prototype.getLayerRenderers = function() {
  return this.layerRenderers_;
};


/**
 * @return {ol.Map} Map.
 */
ol.renderer.Map.prototype.getMap = function() {
  return this.map_;
};


/**
 * @param {goog.events.Event} event Event.
 * @private
 */
ol.renderer.Map.prototype.handleLayerRendererChange_ = function(event) {
  this.getMap().render();
};


/**
 * @param {ol.CollectionEvent} collectionEvent Collection event.
 * @private
 */
ol.renderer.Map.prototype.handleLayersAdd_ = function(collectionEvent) {
  this.getMap().render();
};


/**
 * @param {goog.events.Event} event Event.
 * @private
 */
ol.renderer.Map.prototype.handleLayersChanged_ = function(event) {
  if (!goog.isNull(this.layersListenerKeys_)) {
    goog.array.forEach(this.layersListenerKeys_, goog.events.unlistenByKey);
    this.layersListenerKeys_ = null;
  }
  var layers = this.getMap().getLayers();
  if (goog.isDefAndNotNull(layers)) {
    this.layersListenerKeys_ = [
      goog.events.listen(layers, ol.CollectionEventType.ADD,
          this.handleLayersAdd_, false, this),
      goog.events.listen(layers, ol.CollectionEventType.REMOVE,
          this.handleLayersRemove_, false, this)
    ];
  }
  this.getMap().render();
};


/**
 * @param {ol.CollectionEvent} collectionEvent Collection event.
 * @private
 */
ol.renderer.Map.prototype.handleLayersRemove_ = function(collectionEvent) {
  this.getMap().render();
};


/**
 * @param {string} layerKey Layer key.
 * @return {ol.renderer.Layer} Layer renderer.
 * @private
 */
ol.renderer.Map.prototype.removeLayerRendererByKey_ = function(layerKey) {
  goog.asserts.assert(layerKey in this.layerRenderers_);
  var layerRenderer = this.layerRenderers_[layerKey];
  delete this.layerRenderers_[layerKey];
  goog.asserts.assert(layerKey in this.layerRendererChangeListenKeys_);
  goog.events.unlistenByKey(this.layerRendererChangeListenKeys_[layerKey]);
  delete this.layerRendererChangeListenKeys_[layerKey];
  return layerRenderer;
};


/**
 * Render.
 * @param {?ol.FrameState} frameState Frame state.
 */
ol.renderer.Map.prototype.renderFrame = goog.nullFunction;


/**
 * @param {ol.Map} map Map.
 * @param {!ol.FrameState} frameState Frame state.
 * @private
 */
ol.renderer.Map.prototype.removeUnusedLayerRenderers_ =
    function(map, frameState) {
  var layerStates = frameState.layerStates;
  var layerKey;
  for (layerKey in this.layerRenderers_) {
    if (!(layerKey in layerStates)) {
      goog.dispose(this.removeLayerRendererByKey_(layerKey));
    }
  }
};


/**
 * @param {!ol.FrameState} frameState Frame state.
 * @protected
 */
ol.renderer.Map.prototype.scheduleRemoveUnusedLayerRenderers =
    function(frameState) {
  var layerKey;
  for (layerKey in this.layerRenderers_) {
    if (!(layerKey in frameState.layerStates)) {
      frameState.postRenderFunctions.push(
          goog.bind(this.removeUnusedLayerRenderers_, this));
      return;
    }
  }
};
