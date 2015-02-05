goog.provide('ol.renderer.dom.Map');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.events.EventType');
goog.require('goog.functions');
goog.require('goog.style');
goog.require('goog.vec.Mat4');
goog.require('ol');
goog.require('ol.RendererType');
goog.require('ol.css');
goog.require('ol.dom');
goog.require('ol.layer.Image');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.render.Event');
goog.require('ol.render.EventType');
goog.require('ol.render.canvas.Immediate');
goog.require('ol.render.canvas.ReplayGroup');
goog.require('ol.renderer.Map');
goog.require('ol.renderer.dom.ImageLayer');
goog.require('ol.renderer.dom.Layer');
goog.require('ol.renderer.dom.TileLayer');
goog.require('ol.renderer.dom.VectorLayer');
goog.require('ol.renderer.vector');
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
  this.context_ = null;
  if (!(ol.LEGACY_IE_SUPPORT && ol.IS_LEGACY_IE)) {
    this.context_ = ol.dom.createCanvasContext2D();
    var canvas = this.context_.canvas;
    canvas.style.position = 'absolute';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.className = ol.css.CLASS_UNSELECTABLE;
    goog.dom.insertChildAt(container, canvas, 0);
  }

  /**
   * @private
   * @type {!goog.vec.Mat4.Number}
   */
  this.transform_ = goog.vec.Mat4.createNumber();

  /**
   * @type {!Element}
   * @private
   */
  this.layersPane_ = goog.dom.createElement(goog.dom.TagName.DIV);
  this.layersPane_.className = ol.css.CLASS_UNSELECTABLE;
  var style = this.layersPane_.style;
  style.position = 'absolute';
  style.width = '100%';
  style.height = '100%';

  // in IE < 9, we need to return false from ondragstart to cancel the default
  // behavior of dragging images, which is interfering with the custom handler
  // in the Drag interaction subclasses
  if (ol.LEGACY_IE_SUPPORT && ol.IS_LEGACY_IE) {
    this.layersPane_.ondragstart = goog.functions.FALSE;
    this.layersPane_.onselectstart = goog.functions.FALSE;
  }

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
    layerRenderer = new ol.renderer.dom.ImageLayer(this, layer);
  } else if (ol.ENABLE_TILE && layer instanceof ol.layer.Tile) {
    layerRenderer = new ol.renderer.dom.TileLayer(this, layer);
  } else if (!(ol.LEGACY_IE_SUPPORT && ol.IS_LEGACY_IE) &&
      ol.ENABLE_VECTOR && layer instanceof ol.layer.Vector) {
    layerRenderer = new ol.renderer.dom.VectorLayer(this, layer);
  } else {
    goog.asserts.fail();
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
  if (!(ol.LEGACY_IE_SUPPORT && ol.IS_LEGACY_IE) && map.hasListener(type)) {
    var extent = frameState.extent;
    var pixelRatio = frameState.pixelRatio;
    var viewState = frameState.viewState;
    var resolution = viewState.resolution;
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
    var replayGroup = new ol.render.canvas.ReplayGroup(
        ol.renderer.vector.getTolerance(resolution, pixelRatio), extent,
        resolution);
    var composeEvent = new ol.render.Event(type, map, vectorContext,
        replayGroup, frameState, context, null);
    map.dispatchEvent(composeEvent);
    replayGroup.finish();
    if (!replayGroup.isEmpty()) {
      replayGroup.replay(context, pixelRatio, this.transform_, rotation, {});
    }
    vectorContext.flush();
    this.replayGroup = replayGroup;
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

  if (goog.isNull(frameState)) {
    if (this.renderedVisible_) {
      goog.style.setElementShown(this.layersPane_, false);
      this.renderedVisible_ = false;
    }
    return;
  }

  /**
   * @this {ol.renderer.dom.Map}
   * @param {Element} elem
   * @param {number} i
   */
  var addChild;

  // appendChild is actually more performant than insertBefore
  // in IE 7 and 8. http://jsperf.com/reattaching-dom-nodes
  if (ol.LEGACY_IE_SUPPORT && ol.IS_LEGACY_IE) {
    addChild =
        /**
         * @this {ol.renderer.dom.Map}
         * @param {Element} elem
         */ (
        function(elem) {
          goog.dom.appendChild(this.layersPane_, elem);
        });
  } else {
    addChild =
        /**
         * @this {ol.renderer.dom.Map}
         * @param {Element} elem
         * @param {number} i
         */ (
        function(elem, i) {
          goog.dom.insertChildAt(this.layersPane_, elem, i);
        });
  }

  var map = this.getMap();
  if (!(ol.LEGACY_IE_SUPPORT && ol.IS_LEGACY_IE) &&
      (map.hasListener(ol.render.EventType.PRECOMPOSE) ||
      map.hasListener(ol.render.EventType.POSTCOMPOSE))) {
    var canvas = this.context_.canvas;
    var pixelRatio = frameState.pixelRatio;
    canvas.width = frameState.size[0] * pixelRatio;
    canvas.height = frameState.size[1] * pixelRatio;
  }

  this.dispatchComposeEvent_(ol.render.EventType.PRECOMPOSE, frameState);

  var layerStatesArray = frameState.layerStatesArray;
  var i, ii, layer, layerRenderer, layerState;
  for (i = 0, ii = layerStatesArray.length; i < ii; ++i) {
    layerState = layerStatesArray[i];
    layer = layerState.layer;
    layerRenderer = /** @type {ol.renderer.dom.Layer} */ (
        this.getLayerRenderer(layer));
    goog.asserts.assertInstanceof(layerRenderer, ol.renderer.dom.Layer);
    addChild.call(this, layerRenderer.getTarget(), i);
    if (layerState.sourceState == ol.source.State.READY) {
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
      goog.asserts.assertInstanceof(layerRenderer, ol.renderer.dom.Layer);
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
