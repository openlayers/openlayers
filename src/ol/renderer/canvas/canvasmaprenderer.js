// FIXME offset panning

goog.provide('ol.renderer.canvas.Map');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.style');
goog.require('goog.vec.Mat4');
goog.require('ol.css');
goog.require('ol.layer.Image');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.render.Event');
goog.require('ol.render.EventType');
goog.require('ol.render.canvas.Immediate');
goog.require('ol.renderer.Map');
goog.require('ol.renderer.canvas.ImageLayer');
goog.require('ol.renderer.canvas.Layer');
goog.require('ol.renderer.canvas.TileLayer');
goog.require('ol.renderer.canvas.VectorLayer');
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
   * @type {HTMLCanvasElement}
   */
  this.canvas_ = /** @type {HTMLCanvasElement} */
      (goog.dom.createElement(goog.dom.TagName.CANVAS));
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
   * @type {CanvasRenderingContext2D}
   */
  this.context_ = /** @type {CanvasRenderingContext2D} */
      (this.canvas_.getContext('2d'));

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
  if (layer instanceof ol.layer.Image) {
    return new ol.renderer.canvas.ImageLayer(this, layer);
  } else if (layer instanceof ol.layer.Tile) {
    return new ol.renderer.canvas.TileLayer(this, layer);
  } else if (layer instanceof ol.layer.Vector) {
    return new ol.renderer.canvas.VectorLayer(this, layer);
  } else {
    goog.asserts.fail();
    return null;
  }
};


/**
 * @param {ol.render.EventType} type Event type.
 * @param {ol.FrameState} frameState Frame state.
 * @private
 */
ol.renderer.canvas.Map.prototype.dispatchComposeEvent_ =
    function(type, frameState) {
  var map = this.getMap();
  var context = this.context_;
  if (map.hasListener(type)) {
    var view2DState = frameState.view2DState;
    var devicePixelRatio = frameState.devicePixelRatio;
    ol.vec.Mat4.makeTransform2D(this.transform_,
        this.canvas_.width / 2,
        this.canvas_.height / 2,
        devicePixelRatio / view2DState.resolution,
        -devicePixelRatio / view2DState.resolution,
        -view2DState.rotation,
        -view2DState.center[0], -view2DState.center[1]);
    var render = new ol.render.canvas.Immediate(
        context, devicePixelRatio, frameState.extent, this.transform_);
    var composeEvent = new ol.render.Event(type, map, render, frameState,
        context, null);
    map.dispatchEvent(composeEvent);
  }
};


/**
 * @param {ol.layer.Layer} layer Layer.
 * @return {ol.renderer.canvas.Layer} Canvas layer renderer.
 */
ol.renderer.canvas.Map.prototype.getCanvasLayerRenderer = function(layer) {
  var layerRenderer = this.getLayerRenderer(layer);
  goog.asserts.assertInstanceof(layerRenderer, ol.renderer.canvas.Layer);
  return /** @type {ol.renderer.canvas.Layer} */ (layerRenderer);
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.Map.prototype.renderFrame = function(frameState) {

  if (goog.isNull(frameState)) {
    if (this.renderedVisible_) {
      goog.style.setElementShown(this.canvas_, false);
      this.renderedVisible_ = false;
    }
    return;
  }

  var context = this.context_;
  var ratio = frameState.devicePixelRatio;
  var width = frameState.size[0] * ratio;
  var height = frameState.size[1] * ratio;
  if (this.canvas_.width != width || this.canvas_.height != height) {
    this.canvas_.width = width;
    this.canvas_.height = height;
  } else {
    context.clearRect(0, 0, this.canvas_.width, this.canvas_.height);
  }

  this.calculateMatrices2D(frameState);

  this.dispatchComposeEvent_(ol.render.EventType.PRECOMPOSE, frameState);

  var layerStates = frameState.layerStates;
  var layersArray = frameState.layersArray;
  var viewResolution = frameState.view2DState.resolution;
  var i, ii, layer, layerRenderer, layerState;
  for (i = 0, ii = layersArray.length; i < ii; ++i) {
    layer = layersArray[i];
    layerRenderer = this.getLayerRenderer(layer);
    goog.asserts.assertInstanceof(layerRenderer, ol.renderer.canvas.Layer);
    layerState = layerStates[goog.getUid(layer)];
    if (!layerState.visible ||
        layerState.sourceState != ol.source.State.READY ||
        viewResolution >= layerState.maxResolution ||
        viewResolution < layerState.minResolution) {
      continue;
    }
    layerRenderer.prepareFrame(frameState, layerState);
    layerRenderer.composeFrame(frameState, layerState, context);
  }

  this.dispatchComposeEvent_(ol.render.EventType.POSTCOMPOSE, frameState);

  if (!this.renderedVisible_) {
    goog.style.setElementShown(this.canvas_, true);
    this.renderedVisible_ = true;
  }

  this.scheduleRemoveUnusedLayerRenderers(frameState);

};
