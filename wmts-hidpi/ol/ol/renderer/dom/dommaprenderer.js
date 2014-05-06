goog.provide('ol.renderer.dom.Map');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.functions');
goog.require('goog.style');
goog.require('ol');
goog.require('ol.RendererType');
goog.require('ol.css');
goog.require('ol.layer.Image');
goog.require('ol.layer.Tile');
goog.require('ol.renderer.Map');
goog.require('ol.renderer.dom.ImageLayer');
goog.require('ol.renderer.dom.Layer');
goog.require('ol.renderer.dom.TileLayer');
goog.require('ol.source.State');



/**
 * @constructor
 * @extends {ol.renderer.Map}
 * @param {Element} container Container.
 * @param {ol.Map} map Map.
 */
ol.renderer.dom.Map = function(container, map) {

  goog.base(this, container, map);

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
ol.renderer.dom.Map.prototype.createLayerRenderer = function(layer) {
  var layerRenderer;
  if (ol.ENABLE_IMAGE && layer instanceof ol.layer.Image) {
    layerRenderer = new ol.renderer.dom.ImageLayer(this, layer);
  } else if (ol.ENABLE_TILE && layer instanceof ol.layer.Tile) {
    layerRenderer = new ol.renderer.dom.TileLayer(this, layer);
  } else {
    goog.asserts.fail();
    return null;
  }
  return layerRenderer;
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
      layerRenderer.prepareFrame(frameState, layerState);
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

};
