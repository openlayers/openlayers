goog.provide('ol.renderer.canvas.VectorLayer2');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.vec.Mat4');
goog.require('ol.ViewHint');
goog.require('ol.extent');
goog.require('ol.layer.Vector');
goog.require('ol.renderer.canvas.Layer');
goog.require('ol.renderer.canvas.Vector');



/**
 * @constructor
 * @extends {ol.renderer.canvas.Layer}
 * @param {ol.renderer.Map} mapRenderer Map renderer.
 * @param {ol.layer.Vector} layer Vector layer.
 */
ol.renderer.canvas.VectorLayer2 = function(mapRenderer, layer) {

  goog.base(this, mapRenderer, layer);

  /**
   * Final canvas made available to the map renderer.
   * @private
   * @type {HTMLCanvasElement}
   */
  this.canvas_ = /** @type {HTMLCanvasElement} */
      (goog.dom.createElement(goog.dom.TagName.CANVAS));

  /**
   * @private
   * @type {!goog.vec.Mat4.Number}
   */
  this.coordsTransform_ = goog.vec.Mat4.createNumber();

  /**
   * @private
   * @type {!goog.vec.Mat4.Number}
   */
  this.transform_ = goog.vec.Mat4.createNumber();

  /**
   * @private
   * @type {number}
   */
  this.renderedResolution_ = 0;

  /**
   * @private
   * @type {ol.Extent}
   */
  this.renderedExtent_ = null;

  /**
   * @private
   * @type {function()}
   */
  this.requestMapRenderFrame_ = goog.bind(function() {
    mapRenderer.getMap().requestRenderFrame();
  }, this);

};
goog.inherits(ol.renderer.canvas.VectorLayer2, ol.renderer.canvas.Layer);


/**
 * @inheritDoc
 */
ol.renderer.canvas.VectorLayer2.prototype.getImage = function() {
  return this.canvas_;
};


/**
 * @return {ol.layer.Vector} Vector layer.
 */
ol.renderer.canvas.VectorLayer2.prototype.getVectorLayer = function() {
  return /** @type {ol.layer.Vector} */ (this.getLayer());
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.VectorLayer2.prototype.getTransform = function() {
  return this.transform_;
};


/**
 * @param {ol.layer.VectorEvent} event Vector layer event.
 * @private
 */
ol.renderer.canvas.VectorLayer2.prototype.handleLayerChange_ = function(event) {
  this.requestMapRenderFrame_();
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.VectorLayer2.prototype.prepareFrame =
    function(frameState, layerState) {

  var extent = frameState.extent;
  var view2DState = frameState.view2DState;
  var viewCenter = view2DState.center;
  var viewProjection = view2DState.projection;
  var viewResolution = view2DState.resolution;
  var viewRotation = view2DState.rotation;

  var vectorLayer = this.getVectorLayer();

  var hints = frameState.viewHints;

  if (this.renderedResolution_ === 0 ||
      (!hints[ol.ViewHint.ANIMATING] && !hints[ol.ViewHint.INTERACTING])) {

    var features = vectorLayer.getFeaturesObjectForExtent(extent,
        viewProjection, this.requestMapRenderFrame_);

    if (goog.isNull(features)) {
      return;
    }

    this.renderedResolution_ = viewResolution;
    this.renderedExtent_ = extent;

    var canvasWidth = ol.extent.getWidth(extent) / viewResolution;
    var canvasHeight = ol.extent.getHeight(extent) / viewResolution;

    var canvas = this.canvas_;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    var halfWidth = canvasWidth;
    var halfHeight = canvasHeight;

    // transform for map coords to sketch canvas pixel coords
    var coordsTransform = this.coordsTransform_;
    var origin = ol.extent.getTopLeft(extent);
    goog.vec.Mat4.makeIdentity(coordsTransform);
    goog.vec.Mat4.translate(coordsTransform,
        halfWidth, halfHeight, 0);
    goog.vec.Mat4.scale(coordsTransform,
        1 / viewResolution, -1 / viewResolution, 1);
    goog.vec.Mat4.translate(coordsTransform,
        -(origin[0] + halfWidth * viewResolution),
        -(origin[1] - halfHeight * viewResolution),
        0);
    var renderer = new ol.renderer.canvas.Vector(canvas, coordsTransform,
        this.requestMapRenderFrame_);

    var groups = vectorLayer.groupFeaturesBySymbolizerLiteral(features,
        viewResolution);

    var i, ii, group, deferred;

    ii = groups.length;
    for (i = 0; i < ii; ++i) {
      group = groups[i];
      deferred = renderer.renderFeatures(group[0], group[1], group[2]);
      if (deferred) {
        break;
      }
    }
  }

  var transform = this.transform_;
  goog.vec.Mat4.makeIdentity(transform);
  goog.vec.Mat4.translate(transform,
      frameState.size[0] / 2,
      frameState.size[1] / 2,
      0);
  goog.vec.Mat4.scale(transform,
      this.renderedResolution_ / viewResolution,
      this.renderedResolution_ / viewResolution,
      1);
  goog.vec.Mat4.rotateZ(transform, viewRotation);
  goog.vec.Mat4.translate(transform,
      (this.renderedExtent_[0] - viewCenter[0]) / this.renderedResolution_,
      (viewCenter[1] - this.renderedExtent_[3]) / this.renderedResolution_,
      0);

};
