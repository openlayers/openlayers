goog.provide('ol.renderer.dom.Map');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.style');
goog.require('ol.css');
goog.require('ol.layer.ImageLayer');
goog.require('ol.layer.TileLayer');
goog.require('ol.renderer.Map');
goog.require('ol.renderer.dom.ImageLayer');
goog.require('ol.renderer.dom.TileLayer');



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
  if (layer instanceof ol.layer.TileLayer) {
    layerRenderer = new ol.renderer.dom.TileLayer(this, layer);
  } else if (layer instanceof ol.layer.ImageLayer) {
    layerRenderer = new ol.renderer.dom.ImageLayer(this, layer);
  } else {
    goog.asserts.fail();
    return null;
  }
  goog.dom.appendChild(this.layersPane_, layerRenderer.getTarget());
  return layerRenderer;
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

  var layerStates = frameState.layerStates;
  var layersArray = frameState.layersArray;
  var i, ii, layer, layerRenderer, layerState;
  for (i = 0, ii = layersArray.length; i < ii; ++i) {
    layer = layersArray[i];
    layerRenderer = this.getLayerRenderer(layer);
    layerState = frameState.layerStates[goog.getUid(layer)];
    if (layerState.ready) {
      layerRenderer.renderFrame(frameState, layerState);
    }
  }

  var layerKey;
  for (layerKey in this.getLayerRenderers()) {
    if (!(layerKey in layerStates)) {
      layerRenderer = this.getLayerRendererByKey(layerKey);
      goog.dom.removeNode(layerRenderer.getTarget());
    }
  }

  if (!this.renderedVisible_) {
    goog.style.setElementShown(this.layersPane_, true);
    this.renderedVisible_ = true;
  }

  this.calculateMatrices2D(frameState);
  this.scheduleRemoveUnusedLayerRenderers(frameState);

};
