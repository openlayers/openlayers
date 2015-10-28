// FIXME offset panning

goog.provide('ol.renderer.canvas.Map');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom');
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
goog.require('ol.layer.VectorTile');
goog.require('ol.render.Event');
goog.require('ol.render.EventType');
goog.require('ol.render.canvas.Immediate');
goog.require('ol.renderer.Map');
goog.require('ol.renderer.canvas.ImageLayer');
goog.require('ol.renderer.canvas.Layer');
goog.require('ol.renderer.canvas.TileLayer');
goog.require('ol.renderer.canvas.VectorLayer');
goog.require('ol.renderer.canvas.VectorTileLayer');
goog.require('ol.source.State');
goog.require('ol.vec.Mat4');



/**
 * @constructor
 * @extends {ol.renderer.Map}
 * @param {Element} container Container.
 * @param {ol.Map} map Map.
 */
ol.renderer.canvas.Map = function(container, map) {

  goog.base(this, container, map);

  /**
   * @private
   * @type {CanvasRenderingContext2D}
   */
  this.context_ = ol.dom.createCanvasContext2D();

  /**
   * @private
   * @type {HTMLCanvasElement}
   */
  this.canvas_ = this.context_.canvas;

  this.canvas_.style.width = '100%';
  this.canvas_.style.height = '100%';
  this.canvas_.className = ol.css.CLASS_UNSELECTABLE;
  goog.dom.insertChildAt(container, this.canvas_, 0);

  /**
   * @private
   * @type {boolean}
   */
  this.renderedVisible_ = true;

  /**
   * @private
   * @type {!goog.vec.Mat4.Number}
   */
  this.transform_ = goog.vec.Mat4.createNumber();

};
goog.inherits(ol.renderer.canvas.Map, ol.renderer.Map);


/**
 * @inheritDoc
 */
ol.renderer.canvas.Map.prototype.createLayerRenderer = function(layer) {
  if (ol.ENABLE_IMAGE && layer instanceof ol.layer.Image) {
    return new ol.renderer.canvas.ImageLayer(layer);
  } else if (ol.ENABLE_TILE && layer instanceof ol.layer.Tile) {
    return new ol.renderer.canvas.TileLayer(layer);
  } else if (ol.ENABLE_VECTOR_TILE && layer instanceof ol.layer.VectorTile) {
    return new ol.renderer.canvas.VectorTileLayer(layer);
  } else if (ol.ENABLE_VECTOR && layer instanceof ol.layer.Vector) {
    return new ol.renderer.canvas.VectorLayer(layer);
  } else {
    goog.asserts.fail('unexpected layer configuration');
    return null;
  }
};


/**
 * @param {ol.render.EventType} type Event type.
 * @param {olx.FrameState} frameState Frame state.
 * @private
 */
ol.renderer.canvas.Map.prototype.dispatchComposeEvent_ =
    function(type, frameState) {
  var map = this.getMap();
  var context = this.context_;
  if (map.hasListener(type)) {
    var extent = frameState.extent;
    var pixelRatio = frameState.pixelRatio;
    var viewState = frameState.viewState;
    var rotation = viewState.rotation;

    var transform = this.getTransform(frameState);

    var vectorContext = new ol.render.canvas.Immediate(context, pixelRatio,
        extent, transform, rotation);
    var composeEvent = new ol.render.Event(type, map, vectorContext,
        frameState, context, null);
    map.dispatchEvent(composeEvent);

    vectorContext.flush();
  }
};


/**
 * @param {olx.FrameState} frameState Frame state.
 * @protected
 * @return {!goog.vec.Mat4.Number} Transform.
 */
ol.renderer.canvas.Map.prototype.getTransform = function(frameState) {
  var pixelRatio = frameState.pixelRatio;
  var viewState = frameState.viewState;
  var resolution = viewState.resolution;
  return ol.vec.Mat4.makeTransform2D(this.transform_,
      this.canvas_.width / 2, this.canvas_.height / 2,
      pixelRatio / resolution, -pixelRatio / resolution,
      -viewState.rotation,
      -viewState.center[0], -viewState.center[1]);
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.Map.prototype.getType = function() {
  return ol.RendererType.CANVAS;
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.Map.prototype.renderFrame = function(frameState) {

  if (!frameState) {
    if (this.renderedVisible_) {
      goog.style.setElementShown(this.canvas_, false);
      this.renderedVisible_ = false;
    }
    return;
  }

  var context = this.context_;
  var width = frameState.size[0] * frameState.pixelRatio;
  var height = frameState.size[1] * frameState.pixelRatio;
  if (this.canvas_.width != width || this.canvas_.height != height) {
    this.canvas_.width = width;
    this.canvas_.height = height;
  } else {
    context.clearRect(0, 0, this.canvas_.width, this.canvas_.height);
  }

  this.calculateMatrices2D(frameState);

  this.dispatchComposeEvent_(ol.render.EventType.PRECOMPOSE, frameState);

  var layerStatesArray = frameState.layerStatesArray;
  goog.array.stableSort(layerStatesArray, ol.renderer.Map.sortByZIndex);

  var viewResolution = frameState.viewState.resolution;
  var i, ii, layer, layerRenderer, layerState;
  for (i = 0, ii = layerStatesArray.length; i < ii; ++i) {
    layerState = layerStatesArray[i];
    layer = layerState.layer;
    layerRenderer = this.getLayerRenderer(layer);
    goog.asserts.assertInstanceof(layerRenderer, ol.renderer.canvas.Layer,
        'layerRenderer is an instance of ol.renderer.canvas.Layer');
    if (!ol.layer.Layer.visibleAtResolution(layerState, viewResolution) ||
        layerState.sourceState != ol.source.State.READY) {
      continue;
    }
    if (layerRenderer.prepareFrame(frameState, layerState)) {
      layerRenderer.composeFrame(frameState, layerState, context);
    }
  }

  this.dispatchComposeEvent_(
      ol.render.EventType.POSTCOMPOSE, frameState);

  if (!this.renderedVisible_) {
    goog.style.setElementShown(this.canvas_, true);
    this.renderedVisible_ = true;
  }

  this.scheduleRemoveUnusedLayerRenderers(frameState);
  this.scheduleExpireIconCache(frameState);
};
