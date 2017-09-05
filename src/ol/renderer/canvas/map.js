// FIXME offset panning

import _ol_transform_ from '../../transform';
import _ol_ from '../../index';
import _ol_array_ from '../../array';
import _ol_css_ from '../../css';
import _ol_dom_ from '../../dom';
import _ol_layer_Layer_ from '../../layer/layer';
import _ol_render_Event_ from '../../render/event';
import _ol_render_EventType_ from '../../render/eventtype';
import _ol_render_canvas_ from '../../render/canvas';
import _ol_render_canvas_Immediate_ from '../../render/canvas/immediate';
import _ol_renderer_Map_ from '../map';
import _ol_renderer_Type_ from '../type';
import _ol_source_State_ from '../../source/state';

/**
 * @constructor
 * @extends {ol.renderer.Map}
 * @param {Element} container Container.
 * @param {ol.PluggableMap} map Map.
 * @api
 */
var _ol_renderer_canvas_Map_ = function(container, map) {

  _ol_renderer_Map_.call(this, container, map);

  /**
   * @private
   * @type {CanvasRenderingContext2D}
   */
  this.context_ = _ol_dom_.createCanvasContext2D();

  /**
   * @private
   * @type {HTMLCanvasElement}
   */
  this.canvas_ = this.context_.canvas;

  this.canvas_.style.width = '100%';
  this.canvas_.style.height = '100%';
  this.canvas_.style.display = 'block';
  this.canvas_.className = _ol_css_.CLASS_UNSELECTABLE;
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
  this.transform_ = _ol_transform_.create();

};

_ol_.inherits(_ol_renderer_canvas_Map_, _ol_renderer_Map_);


/**
 * Determine if this renderer handles the provided layer.
 * @param {ol.renderer.Type} type The renderer type.
 * @return {boolean} The renderer can render the layer.
 */
_ol_renderer_canvas_Map_['handles'] = function(type) {
  return type === _ol_renderer_Type_.CANVAS;
};


/**
 * Create the map renderer.
 * @param {Element} container Container.
 * @param {ol.PluggableMap} map Map.
 * @return {ol.renderer.canvas.Map} The map renderer.
 */
_ol_renderer_canvas_Map_['create'] = function(container, map) {
  return new _ol_renderer_canvas_Map_(container, map);
};


/**
 * @param {ol.render.EventType} type Event type.
 * @param {olx.FrameState} frameState Frame state.
 * @private
 */
_ol_renderer_canvas_Map_.prototype.dispatchComposeEvent_ = function(type, frameState) {
  var map = this.getMap();
  var context = this.context_;
  if (map.hasListener(type)) {
    var extent = frameState.extent;
    var pixelRatio = frameState.pixelRatio;
    var viewState = frameState.viewState;
    var rotation = viewState.rotation;

    var transform = this.getTransform(frameState);

    var vectorContext = new _ol_render_canvas_Immediate_(context, pixelRatio,
        extent, transform, rotation);
    var composeEvent = new _ol_render_Event_(type, vectorContext,
        frameState, context, null);
    map.dispatchEvent(composeEvent);
  }
};


/**
 * @param {olx.FrameState} frameState Frame state.
 * @protected
 * @return {!ol.Transform} Transform.
 */
_ol_renderer_canvas_Map_.prototype.getTransform = function(frameState) {
  var viewState = frameState.viewState;
  var dx1 = this.canvas_.width / 2;
  var dy1 = this.canvas_.height / 2;
  var sx = frameState.pixelRatio / viewState.resolution;
  var sy = -sx;
  var angle = -viewState.rotation;
  var dx2 = -viewState.center[0];
  var dy2 = -viewState.center[1];
  return _ol_transform_.compose(this.transform_, dx1, dy1, sx, sy, angle, dx2, dy2);
};


/**
 * @inheritDoc
 */
_ol_renderer_canvas_Map_.prototype.getType = function() {
  return _ol_renderer_Type_.CANVAS;
};


/**
 * @inheritDoc
 */
_ol_renderer_canvas_Map_.prototype.renderFrame = function(frameState) {

  if (!frameState) {
    if (this.renderedVisible_) {
      this.canvas_.style.display = 'none';
      this.renderedVisible_ = false;
    }
    return;
  }

  var context = this.context_;
  var pixelRatio = frameState.pixelRatio;
  var width = Math.round(frameState.size[0] * pixelRatio);
  var height = Math.round(frameState.size[1] * pixelRatio);
  if (this.canvas_.width != width || this.canvas_.height != height) {
    this.canvas_.width = width;
    this.canvas_.height = height;
  } else {
    context.clearRect(0, 0, width, height);
  }

  var rotation = frameState.viewState.rotation;

  this.calculateMatrices2D(frameState);

  this.dispatchComposeEvent_(_ol_render_EventType_.PRECOMPOSE, frameState);

  var layerStatesArray = frameState.layerStatesArray;
  _ol_array_.stableSort(layerStatesArray, _ol_renderer_Map_.sortByZIndex);

  if (rotation) {
    context.save();
    _ol_render_canvas_.rotateAtOffset(context, rotation, width / 2, height / 2);
  }

  var viewResolution = frameState.viewState.resolution;
  var i, ii, layer, layerRenderer, layerState;
  for (i = 0, ii = layerStatesArray.length; i < ii; ++i) {
    layerState = layerStatesArray[i];
    layer = layerState.layer;
    layerRenderer = /** @type {ol.renderer.canvas.Layer} */ (this.getLayerRenderer(layer));
    if (!_ol_layer_Layer_.visibleAtResolution(layerState, viewResolution) ||
        layerState.sourceState != _ol_source_State_.READY) {
      continue;
    }
    if (layerRenderer.prepareFrame(frameState, layerState)) {
      layerRenderer.composeFrame(frameState, layerState, context);
    }
  }

  if (rotation) {
    context.restore();
  }

  this.dispatchComposeEvent_(
      _ol_render_EventType_.POSTCOMPOSE, frameState);

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
_ol_renderer_canvas_Map_.prototype.forEachLayerAtPixel = function(pixel, frameState, callback, thisArg,
    layerFilter, thisArg2) {
  var result;
  var viewState = frameState.viewState;
  var viewResolution = viewState.resolution;

  var layerStates = frameState.layerStatesArray;
  var numLayers = layerStates.length;

  var coordinate = _ol_transform_.apply(
      frameState.pixelToCoordinateTransform, pixel.slice());

  var i;
  for (i = numLayers - 1; i >= 0; --i) {
    var layerState = layerStates[i];
    var layer = layerState.layer;
    if (_ol_layer_Layer_.visibleAtResolution(layerState, viewResolution) &&
        layerFilter.call(thisArg2, layer)) {
      var layerRenderer = /** @type {ol.renderer.canvas.Layer} */ (this.getLayerRenderer(layer));
      result = layerRenderer.forEachLayerAtCoordinate(
          coordinate, frameState, callback, thisArg);
      if (result) {
        return result;
      }
    }
  }
  return undefined;
};
export default _ol_renderer_canvas_Map_;
