goog.provide('ol.renderer.canvas.VectorLayer2');

goog.require('goog.dom');
goog.require('goog.vec.Mat4');
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
   * @private
   * @type {!goog.vec.Mat4.Number}
   */
  this.transform_ = goog.vec.Mat4.createNumber();

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
ol.renderer.canvas.VectorLayer2.prototype.composeFrame =
    function(frameState, layerState, context) {

  var extent = frameState.extent;
  var view2DState = frameState.view2DState;
  var viewCenter = view2DState.center;
  var viewProjection = view2DState.projection;
  var viewResolution = view2DState.resolution;
  var viewRotation = view2DState.rotation;

  var vectorLayer = this.getVectorLayer();

  var features = vectorLayer.getFeaturesObjectForExtent(extent,
      viewProjection, this.requestMapRenderFrame_);

  if (goog.isNull(features)) {
    return;
  }

  var transform = this.transform_;
  goog.vec.Mat4.makeIdentity(transform);
  goog.vec.Mat4.translate(transform,
      frameState.size[0] / 2,
      frameState.size[1] / 2,
      0);
  goog.vec.Mat4.scale(transform,
      1 / viewResolution,
      -1 / viewResolution,
      1);
  goog.vec.Mat4.rotateZ(transform, -viewRotation);
  goog.vec.Mat4.translate(transform,
      -viewCenter[0],
      -viewCenter[1],
      0);
  var renderer = new ol.renderer.canvas.Vector(context, transform,
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

};


/**
 * @return {ol.layer.Vector} Vector layer.
 */
ol.renderer.canvas.VectorLayer2.prototype.getVectorLayer = function() {
  return /** @type {ol.layer.Vector} */ (this.getLayer());
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
ol.renderer.canvas.VectorLayer2.prototype.prepareFrame = goog.nullFunction;
