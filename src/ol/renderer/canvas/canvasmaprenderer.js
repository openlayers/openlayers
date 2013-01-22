// FIXME offset panning

goog.provide('ol.renderer.canvas.Map');

goog.require('goog.dom');
goog.require('goog.style');
goog.require('goog.vec.Mat4');
goog.require('ol.Size');
goog.require('ol.layer.TileLayer');
goog.require('ol.renderer.Map');
goog.require('ol.renderer.canvas.TileLayer');
goog.require('ol.renderer.canvas.VectorLayer');



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
   * @type {ol.Size}
   */
  this.canvasSize_ = new ol.Size(container.clientHeight, container.clientWidth);

  /**
   * @private
   * @type {Element}
   */
  this.canvas_ = goog.dom.createElement(goog.dom.TagName.CANVAS);
  this.canvas_.height = this.canvasSize_.height;
  this.canvas_.width = this.canvasSize_.width;
  this.canvas_.className = 'ol-unselectable';
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
  this.context_ = this.canvas_.getContext('2d');

};
goog.inherits(ol.renderer.canvas.Map, ol.renderer.Map);


/**
 * @inheritDoc
 */
ol.renderer.canvas.Map.prototype.createLayerRenderer = function(layer) {
  if (layer instanceof ol.layer.TileLayer) {
    return new ol.renderer.canvas.TileLayer(this, layer);
  } else if (layer instanceof ol.layer.Vector) {
    return new ol.renderer.canvas.VectorLayer(this, layer);
  } else {
    goog.asserts.assert(false);
    return null;
  }
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.Map.prototype.handleBackgroundColorChanged = function() {
  this.getMap().render();
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.Map.prototype.handleViewPropertyChanged = function() {
  goog.base(this, 'handleViewPropertyChanged');
  this.getMap().render();
};


/**
 * @param {goog.events.Event} event Event.
 * @protected
 */
ol.renderer.canvas.Map.prototype.handleLayerRendererChange = function(event) {
  this.getMap().render();
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.Map.prototype.handleSizeChanged = function() {
  goog.base(this, 'handleSizeChanged');
  this.getMap().render();
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.Map.prototype.handleViewChanged = function() {
  goog.base(this, 'handleViewChanged');
  this.getMap().render();
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.Map.prototype.renderFrame = function(frameState) {

  if (goog.isNull(frameState)) {
    if (this.renderedVisible_) {
      goog.style.showElement(this.canvas_, false);
      this.renderedVisible_ = false;
    }
    return;
  }

  var size = frameState.size;
  if (!this.canvasSize_.equals(size)) {
    this.canvas_.width = size.width;
    this.canvas_.height = size.height;
    this.canvasSize_ = size;
  }

  var context = this.context_;
  context.setTransform(1, 0, 0, 1, 0, 0);
  var backgroundColor = frameState.backgroundColor;
  context.fillStyle = 'rgb(' +
      backgroundColor.r.toFixed(0) + ',' +
      backgroundColor.g.toFixed(0) + ',' +
      backgroundColor.b.toFixed(0) + ')';
  context.globalAlpha = 1;
  context.fillRect(0, 0, size.width, size.height);

  this.calculateMatrices2D(frameState);

  goog.array.forEach(frameState.layersArray, function(layer) {

    var layerState = frameState.layerStates[goog.getUid(layer)];
    if (!layerState.visible) {
      return;
    } else if (!layerState.ready) {
      frameState.animate = true;
      return;
    }
    var layerRenderer = this.getLayerRenderer(layer);
    layerRenderer.renderFrame(frameState, layerState);

    var transform = layerRenderer.getTransform();
    context.setTransform(
        goog.vec.Mat4.getElement(transform, 0, 0),
        goog.vec.Mat4.getElement(transform, 1, 0),
        goog.vec.Mat4.getElement(transform, 0, 1),
        goog.vec.Mat4.getElement(transform, 1, 1),
        goog.vec.Mat4.getElement(transform, 0, 3),
        goog.vec.Mat4.getElement(transform, 1, 3));

    context.globalAlpha = layerState.opacity;
    context.drawImage(layerRenderer.getImage(), 0, 0);

  }, this);

  if (!this.renderedVisible_) {
    goog.style.showElement(this.canvas_, true);
    this.renderedVisible_ = true;
  }

};
