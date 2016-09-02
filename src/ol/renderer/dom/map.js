goog.provide('ol.renderer.dom.Map');

goog.require('ol.events');
goog.require('ol.events.Event');
goog.require('ol.events.EventType');
goog.require('ol.transform');
goog.require('ol');
goog.require('ol.RendererType');
goog.require('ol.array');
goog.require('ol.css');
goog.require('ol.dom');
goog.require('ol.layer.Image');
goog.require('ol.layer.Layer');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.render.Event');
goog.require('ol.render.EventType');
goog.require('ol.render.canvas.Immediate');
goog.require('ol.renderer.Map');
goog.require('ol.renderer.dom.ImageLayer');
goog.require('ol.renderer.dom.TileLayer');
goog.require('ol.renderer.dom.VectorLayer');
goog.require('ol.source.State');


/**
 * @constructor
 * @extends {ol.renderer.Map}
 * @param {Element} container Container.
 * @param {ol.Map} map Map.
 */
ol.renderer.dom.Map = function(container, map) {

  ol.renderer.Map.call(this, container, map);

  /**
   * @private
   * @type {CanvasRenderingContext2D}
   */
  this.context_ = ol.dom.createCanvasContext2D();
  var canvas = this.context_.canvas;
  canvas.style.position = 'absolute';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.className = ol.css.CLASS_UNSELECTABLE;
  container.insertBefore(canvas, container.childNodes[0] || null);

  /**
   * @private
   * @type {ol.Transform}
   */
  this.transform_ = ol.transform.create();

  /**
   * @type {!Element}
   * @private
   */
  this.layersPane_ = document.createElement('DIV');
  this.layersPane_.className = ol.css.CLASS_UNSELECTABLE;
  var style = this.layersPane_.style;
  style.position = 'absolute';
  style.width = '100%';
  style.height = '100%';

  // prevent the img context menu on mobile devices
  ol.events.listen(this.layersPane_, ol.events.EventType.TOUCHSTART,
      ol.events.Event.preventDefault);

  container.insertBefore(this.layersPane_, container.childNodes[0] || null);

  /**
   * @private
   * @type {boolean}
   */
  this.renderedVisible_ = true;

};
ol.inherits(ol.renderer.dom.Map, ol.renderer.Map);


/**
 * @inheritDoc
 */
ol.renderer.dom.Map.prototype.disposeInternal = function() {
  ol.dom.removeNode(this.layersPane_);
  ol.renderer.Map.prototype.disposeInternal.call(this);
};


/**
 * @inheritDoc
 */
ol.renderer.dom.Map.prototype.createLayerRenderer = function(layer) {
  var layerRenderer;
  if (ol.ENABLE_IMAGE && layer instanceof ol.layer.Image) {
    layerRenderer = new ol.renderer.dom.ImageLayer(layer);
  } else if (ol.ENABLE_TILE && layer instanceof ol.layer.Tile) {
    layerRenderer = new ol.renderer.dom.TileLayer(layer);
  } else if (ol.ENABLE_VECTOR && layer instanceof ol.layer.Vector) {
    layerRenderer = new ol.renderer.dom.VectorLayer(layer);
  } else {
    goog.DEBUG && console.assert(false, 'unexpected layer configuration');
    return null;
  }
  return layerRenderer;
};


/**
 * @param {ol.render.EventType} type Event type.
 * @param {olx.FrameState} frameState Frame state.
 * @private
 */
ol.renderer.dom.Map.prototype.dispatchComposeEvent_ = function(type, frameState) {
  var map = this.getMap();
  if (map.hasListener(type)) {
    var extent = frameState.extent;
    var pixelRatio = frameState.pixelRatio;
    var viewState = frameState.viewState;
    var rotation = viewState.rotation;
    var context = this.context_;
    var canvas = context.canvas;

    var transform = ol.transform.compose(this.transform_,
        canvas.width / 2, canvas.height / 2,
        pixelRatio / viewState.resolution, -pixelRatio / viewState.resolution,
        -rotation,
        -viewState.center[0], -viewState.center[1]);

    var vectorContext = new ol.render.canvas.Immediate(context, pixelRatio,
        extent, transform, rotation);
    var composeEvent = new ol.render.Event(type, vectorContext,
        frameState, context, null);
    map.dispatchEvent(composeEvent);
  }
};


/**
 * @inheritDoc
 */
ol.renderer.dom.Map.prototype.getType = function() {
  return ol.RendererType.DOM;
};


/**
 * @inheritDoc
 */
ol.renderer.dom.Map.prototype.renderFrame = function(frameState) {

  if (!frameState) {
    if (this.renderedVisible_) {
      this.layersPane_.style.display = 'none';
      this.renderedVisible_ = false;
    }
    return;
  }

  var map = this.getMap();
  if (map.hasListener(ol.render.EventType.PRECOMPOSE) ||
      map.hasListener(ol.render.EventType.POSTCOMPOSE)) {
    var canvas = this.context_.canvas;
    var pixelRatio = frameState.pixelRatio;
    canvas.width = frameState.size[0] * pixelRatio;
    canvas.height = frameState.size[1] * pixelRatio;
  }

  this.dispatchComposeEvent_(ol.render.EventType.PRECOMPOSE, frameState);

  var layerStatesArray = frameState.layerStatesArray;
  ol.array.stableSort(layerStatesArray, ol.renderer.Map.sortByZIndex);

  var viewResolution = frameState.viewState.resolution;
  var i, ii, layer, layerRenderer, layerState;
  for (i = 0, ii = layerStatesArray.length; i < ii; ++i) {
    layerState = layerStatesArray[i];
    layer = layerState.layer;
    layerRenderer = /** @type {ol.renderer.dom.Layer} */ (
        this.getLayerRenderer(layer));
    this.layersPane_.insertBefore(layerRenderer.getTarget(), this.layersPane_.childNodes[i] || null);
    if (ol.layer.Layer.visibleAtResolution(layerState, viewResolution) &&
        layerState.sourceState == ol.source.State.READY) {
      if (layerRenderer.prepareFrame(frameState, layerState)) {
        layerRenderer.composeFrame(frameState, layerState);
      }
    } else {
      layerRenderer.clearFrame();
    }
  }

  var layerStates = frameState.layerStates;
  var layerKey;
  for (layerKey in this.getLayerRenderers()) {
    if (!(layerKey in layerStates)) {
      layerRenderer = /** @type {ol.renderer.dom.Layer} */ (this.getLayerRendererByKey(layerKey));
      ol.dom.removeNode(layerRenderer.getTarget());
    }
  }

  if (!this.renderedVisible_) {
    this.layersPane_.style.display = '';
    this.renderedVisible_ = true;
  }

  this.calculateMatrices2D(frameState);
  this.scheduleRemoveUnusedLayerRenderers(frameState);
  this.scheduleExpireIconCache(frameState);

  this.dispatchComposeEvent_(ol.render.EventType.POSTCOMPOSE, frameState);
};
