goog.provide('ol.renderer.dom.Map');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.events.EventType');
goog.require('goog.style');
goog.require('goog.vec.Mat4');
goog.require('ol');
goog.require('ol.RendererType');
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
goog.require('ol.renderer.dom.Layer');
goog.require('ol.renderer.dom.TileLayer');
goog.require('ol.renderer.dom.VectorLayer');
goog.require('ol.source.State');
goog.require('ol.vec.Mat4');



/**
 * @constructor
 * @extends {ol.renderer.Map}
 * @param {Element} container Container.
 * @param {ol.Map} map Map.
 */
ol.renderer.dom.Map = function(container, map) {

  goog.base(this, container, map);

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
  goog.dom.insertChildAt(container, canvas, 0);

  /**
   * @private
   * @type {!goog.vec.Mat4.Number}
   */
  this.transform_ = goog.vec.Mat4.createNumber();

  /**
   * @type {!Element}
   * @private
   */
  this.layersPane_ = goog.dom.createElement('DIV');
  this.layersPane_.className = ol.css.CLASS_UNSELECTABLE;
  var style = this.layersPane_.style;
  style.position = 'absolute';
  style.width = '100%';
  style.height = '100%';

  // prevent the img context menu on mobile devices
  goog.events.listen(this.layersPane_, goog.events.EventType.TOUCHSTART,
      goog.events.Event.preventDefault);

  goog.dom.insertChildAt(container, this.layersPane_, 0);

  /**
   * @private
   * @type {boolean}
   */
  this.renderedVisible_ = true;

};
goog.inherits(ol.renderer.dom.Map, ol.renderer.Map);


/**
 * @inheritDoc
 */
ol.renderer.dom.Map.prototype.disposeInternal = function() {
  goog.dom.removeNode(this.layersPane_);
  goog.base(this, 'disposeInternal');
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
    goog.asserts.fail('unexpected layer configuration');
    return null;
  }
  return layerRenderer;
};


/**
 * @param {ol.render.EventType} type Event type.
 * @param {olx.FrameState} frameState Frame state.
 * @private
 */
ol.renderer.dom.Map.prototype.dispatchComposeEvent_ =
    function(type, frameState) {
  var map = this.getMap();
  if (map.hasListener(type)) {
    var extent = frameState.extent;
    var pixelRatio = frameState.pixelRatio;
    var viewState = frameState.viewState;
    var rotation = viewState.rotation;
    var context = this.context_;
    var canvas = context.canvas;

    ol.vec.Mat4.makeTransform2D(this.transform_,
        canvas.width / 2,
        canvas.height / 2,
        pixelRatio / viewState.resolution,
        -pixelRatio / viewState.resolution,
        -viewState.rotation,
        -viewState.center[0], -viewState.center[1]);
    var vectorContext = new ol.render.canvas.Immediate(context, pixelRatio,
        extent, this.transform_, rotation);
    var composeEvent = new ol.render.Event(type, map, vectorContext,
        frameState, context, null);
    map.dispatchEvent(composeEvent);
    vectorContext.flush();
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
      goog.style.setElementShown(this.layersPane_, false);
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
  goog.array.stableSort(layerStatesArray, ol.renderer.Map.sortByZIndex);

  var viewResolution = frameState.viewState.resolution;
  var i, ii, layer, layerRenderer, layerState;
  for (i = 0, ii = layerStatesArray.length; i < ii; ++i) {
    layerState = layerStatesArray[i];
    layer = layerState.layer;
    layerRenderer = /** @type {ol.renderer.dom.Layer} */ (
        this.getLayerRenderer(layer));
    goog.asserts.assertInstanceof(layerRenderer, ol.renderer.dom.Layer,
        'renderer is an instance of ol.renderer.dom.Layer');
    goog.dom.insertChildAt(this.layersPane_, layerRenderer.getTarget(), i);
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
      layerRenderer = this.getLayerRendererByKey(layerKey);
      goog.asserts.assertInstanceof(layerRenderer, ol.renderer.dom.Layer,
          'renderer is an instance of ol.renderer.dom.Layer');
      goog.dom.removeNode(layerRenderer.getTarget());
    }
  }

  if (!this.renderedVisible_) {
    goog.style.setElementShown(this.layersPane_, true);
    this.renderedVisible_ = true;
  }

  this.calculateMatrices2D(frameState);
  this.scheduleRemoveUnusedLayerRenderers(frameState);
  this.scheduleExpireIconCache(frameState);

  this.dispatchComposeEvent_(ol.render.EventType.POSTCOMPOSE, frameState);
};
