goog.provide('ol.MapRenderer');

goog.require('goog.Disposable');
goog.require('goog.events');
goog.require('goog.fx.anim');
goog.require('goog.fx.anim.Animated');
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
ol.MapRenderer.prototype.handleCenterChanged = goog.nullFunction;


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
ol.MapRenderer.prototype.handleResolutionChanged = goog.nullFunction;


/**
 * @protected
 */
ol.MapRenderer.prototype.handleRotationChanged = goog.nullFunction;


/**
 * @protected
 */
ol.MapRenderer.prototype.handleSizeChanged = goog.nullFunction;


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
