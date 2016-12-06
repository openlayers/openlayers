// FIXME offset panning

goog.provide('ol.renderer.canvas.Map');

goog.require('ol.transform');
goog.require('ol');
goog.require('ol.array');
goog.require('ol.css');
goog.require('ol.dom');
goog.require('ol.extent');
goog.require('ol.layer.Image');
goog.require('ol.layer.Layer');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.layer.VectorTile');
goog.require('ol.render.Event');
goog.require('ol.render.canvas.Immediate');
goog.require('ol.renderer.Map');
goog.require('ol.renderer.Type');
goog.require('ol.renderer.canvas.ImageLayer');
goog.require('ol.renderer.canvas.TileLayer');
goog.require('ol.renderer.canvas.VectorLayer');
goog.require('ol.renderer.canvas.VectorTileLayer');
goog.require('ol.source.State');
goog.require('ol.geom.flat.transform');


/**
 * @constructor
 * @extends {ol.renderer.Map}
 * @param {Element} container Container.
 * @param {ol.Map} map Map.
 */
ol.renderer.canvas.Map = function(container, map) {

  ol.renderer.Map.call(this, container, map);

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

  this.canvas_.className = ol.css.CLASS_UNSELECTABLE;
  container.insertBefore(this.canvas_, container.childNodes[0] || null);

  /**
   * @private
   * @type {boolean}
   */
  this.renderedVisible_ = true;

  /**
   * @private
   * @type {ol.Transform}
   */
  this.transform_ = ol.transform.create();

};
ol.inherits(ol.renderer.canvas.Map, ol.renderer.Map);


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
    ol.DEBUG && console.assert(false, 'unexpected layer configuration');
    return null;
  }
};


/**
 * @param {ol.render.Event.Type} type Event type.
 * @param {olx.FrameState} frameState Frame state.
 * @private
 */
ol.renderer.canvas.Map.prototype.dispatchComposeEvent_ = function(type, frameState) {
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
    var composeEvent = new ol.render.Event(type, vectorContext,
        frameState, context, null);
    map.dispatchEvent(composeEvent);
  }
};


/**
 * @param {olx.FrameState} frameState Frame state.
 * @protected
 * @return {!ol.Transform} Transform.
 */
ol.renderer.canvas.Map.prototype.getTransform = function(frameState) {
  var viewState = frameState.viewState;
  var dx1 = this.canvas_.width / 2;
  var dy1 = this.canvas_.height / 2;
  var sx = frameState.pixelRatio / viewState.resolution;
  var sy = -sx;
  var angle = -viewState.rotation;
  var dx2 = -viewState.center[0];
  var dy2 = -viewState.center[1];
  return ol.transform.compose(this.transform_, dx1, dy1, sx, sy, angle, dx2, dy2);
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.Map.prototype.getType = function() {
  return ol.renderer.Type.CANVAS;
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.Map.prototype.renderFrame = function(frameState) {

  if (!frameState) {
    if (this.renderedVisible_) {
      this.canvas_.style.display = 'none';
      this.renderedVisible_ = false;
    }
    return;
  }

  var context = this.context_;
  var pixelRatio = frameState.pixelRatio;
  var rotation = frameState.viewState.rotation;
  var size = frameState.size;
  var width = Math.round(size[0] * pixelRatio);
  var height = Math.round(size[1] * pixelRatio);
  var coords = ol.geom.flat.transform.rotate(
      [0, 0, 0, height, width, height, width, 0], 0, 7, 2, rotation,
      [width / 2, height / 2]);
  var extent = ol.extent.createOrUpdateFromFlatCoordinates(coords, 0, 7, 2);
  var w = ol.extent.getWidth(extent);
  var h = ol.extent.getHeight(extent);
  if (this.canvas_.width != w || this.canvas_.height != h) {
    this.canvas_.width = w;
    this.canvas_.height = h;
    this.canvas_.style.width = (w / pixelRatio) + 'px';
    this.canvas_.style.height = (h / pixelRatio) + 'px';
  } else {
    context.clearRect(0, 0, width, height);
  }

  this.canvas_.style.transform = 'rotateZ(' + rotation + 'rad)';
  this.canvas_.style.position = 'relative';
  this.canvas_.style.left = (width - w) / 2 / pixelRatio + 'px';
  this.canvas_.style.top = (height - h) / 2 / pixelRatio + 'px';
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.translate(Math.round((w - width) / 2), Math.round((h - height) / 2));

  this.calculateMatrices2D(frameState);

  this.dispatchComposeEvent_(ol.render.Event.Type.PRECOMPOSE, frameState);

  var layerStatesArray = frameState.layerStatesArray;
  ol.array.stableSort(layerStatesArray, ol.renderer.Map.sortByZIndex);

  var viewResolution = frameState.viewState.resolution;
  var i, ii, layer, layerRenderer, layerState;
  for (i = 0, ii = layerStatesArray.length; i < ii; ++i) {
    layerState = layerStatesArray[i];
    layer = layerState.layer;
    layerRenderer = /** @type {ol.renderer.canvas.Layer} */ (this.getLayerRenderer(layer));
    if (!ol.layer.Layer.visibleAtResolution(layerState, viewResolution) ||
        layerState.sourceState != ol.source.State.READY) {
      continue;
    }
    if (layerRenderer.prepareFrame(frameState, layerState)) {
      layerRenderer.composeFrame(frameState, layerState, context);
    }
  }

  //ol.render.canvas.rotateAtOffset(context, -rotation, width / 2, height / 2);

  this.dispatchComposeEvent_(
      ol.render.Event.Type.POSTCOMPOSE, frameState);

  if (!this.renderedVisible_) {
    this.canvas_.style.display = '';
    this.renderedVisible_ = true;
  }

  this.scheduleRemoveUnusedLayerRenderers(frameState);
  this.scheduleExpireIconCache(frameState);
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.Map.prototype.forEachLayerAtPixel = function(pixel, frameState, callback, thisArg,
        layerFilter, thisArg2) {
  var result;
  var viewState = frameState.viewState;
  var viewResolution = viewState.resolution;

  var layerStates = frameState.layerStatesArray;
  var numLayers = layerStates.length;

  var coordinate = ol.transform.apply(
      frameState.pixelToCoordinateTransform, pixel.slice());

  var i;
  for (i = numLayers - 1; i >= 0; --i) {
    var layerState = layerStates[i];
    var layer = layerState.layer;
    if (ol.layer.Layer.visibleAtResolution(layerState, viewResolution) &&
        layerFilter.call(thisArg2, layer)) {
      var layerRenderer = this.getLayerRenderer(layer);
      result = layerRenderer.forEachLayerAtCoordinate(
          coordinate, frameState, callback, thisArg);
      if (result) {
        return result;
      }
    }
  }
  return undefined;
};
