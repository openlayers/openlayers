// FIXME offset panning

goog.provide('ol.renderer.canvas.Map');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.style');
goog.require('goog.vec.Mat4');
goog.require('ol.Size');
goog.require('ol.css');
goog.require('ol.layer.ImageLayer');
goog.require('ol.layer.TileLayer');
goog.require('ol.layer.Vector');
goog.require('ol.renderer.Map');
goog.require('ol.renderer.canvas.ImageLayer');
goog.require('ol.renderer.canvas.TileLayer');
goog.require('ol.renderer.canvas.VectorLayer');
goog.require('ol.size');



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
   * @type {Element}
   */
  this.canvas_ = goog.dom.createElement(goog.dom.TagName.CANVAS);
  this.canvas_.height = container.clientHeight;
  this.canvas_.width = container.clientWidth;
  this.canvas_.className = ol.css.CLASS_UNSELECTABLE;
  goog.dom.insertChildAt(container, this.canvas_, 0);

  /**
   * @private
   * @type {boolean}
   */
  this.renderedVisible_ = true;

  /**
   * @private
   * @type {ol.Size}
   */
  this.canvasSize_ = [container.clientHeight, container.clientWidth];

  /**
   * @private
   * @type {CanvasRenderingContext2D}
   */
  this.context_ = this.canvas_.getContext('2d');

};
goog.inherits(ol.renderer.canvas.Map, ol.renderer.Map);


/**
 * @inheritDoc
 */
ol.renderer.canvas.Map.prototype.createLayerRenderer = function(layer) {
  if (layer instanceof ol.layer.ImageLayer) {
    return new ol.renderer.canvas.ImageLayer(this, layer);
  } else if (layer instanceof ol.layer.TileLayer) {
    return new ol.renderer.canvas.TileLayer(this, layer);
  } else if (layer instanceof ol.layer.Vector) {
    return new ol.renderer.canvas.VectorLayer(this, layer);
  } else {
    goog.asserts.fail();
    return null;
  }
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.Map.prototype.getCanvas = function() {
  return this.canvas_;
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

  var size = frameState.size;
  if (!ol.size.equals(this.canvasSize_, size)) {
    this.canvas_.width = size[0];
    this.canvas_.height = size[1];
    this.canvasSize_ = size;
  }

  var context = this.context_;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, size[0], size[1]);

  this.calculateMatrices2D(frameState);

  var layerStates = frameState.layerStates;
  var layersArray = frameState.layersArray;
  var i, ii, image, layer, layerRenderer, layerState, transform;
  for (i = 0, ii = layersArray.length; i < ii; ++i) {

    layer = layersArray[i];
    layerRenderer = this.getLayerRenderer(layer);
    layerState = layerStates[goog.getUid(layer)];
    if (!layerState.visible || !layerState.ready) {
      continue;
    }
    layerRenderer.renderFrame(frameState, layerState);

    image = layerRenderer.getImage();
    if (!goog.isNull(image)) {
      transform = layerRenderer.getTransform();
      context.globalAlpha = layerState.opacity;

      // for performance reasons, context.setTransform is only used
      // when the view is rotated. see http://jsperf.com/canvas-transform
      if (frameState.view2DState.rotation === 0) {
        var dx = goog.vec.Mat4.getElement(transform, 0, 3);
        var dy = goog.vec.Mat4.getElement(transform, 1, 3);
        var dw = image.width * goog.vec.Mat4.getElement(transform, 0, 0);
        var dh = image.height * goog.vec.Mat4.getElement(transform, 1, 1);
        context.drawImage(image, 0, 0, image.width, image.height,
            dx, dy, dw, dh);
      } else {
        context.setTransform(
            goog.vec.Mat4.getElement(transform, 0, 0),
            goog.vec.Mat4.getElement(transform, 1, 0),
            goog.vec.Mat4.getElement(transform, 0, 1),
            goog.vec.Mat4.getElement(transform, 1, 1),
            goog.vec.Mat4.getElement(transform, 0, 3),
            goog.vec.Mat4.getElement(transform, 1, 3));

        context.drawImage(image, 0, 0);
      }
    }

  }

  if (!this.renderedVisible_) {
    goog.style.setElementShown(this.canvas_, true);
    this.renderedVisible_ = true;
  }

  this.scheduleRemoveUnusedLayerRenderers(frameState);

};
