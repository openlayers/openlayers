goog.provide('ol.renderer.canvas.VectorLayer');

goog.require('goog.vec.Mat4');
goog.require('ol.ViewHint');
goog.require('ol.extent');
goog.require('ol.render.canvas.ReplayGroup');
goog.require('ol.renderer.canvas.Layer');
goog.require('ol.renderer.vector');
goog.require('ol.style.DefaultStyleFunction');



/**
 * @constructor
 * @extends {ol.renderer.canvas.Layer}
 * @param {ol.renderer.Map} mapRenderer Map renderer.
 * @param {ol.layer.Vector} vectorLayer Vector layer.
 */
ol.renderer.canvas.VectorLayer = function(mapRenderer, vectorLayer) {

  goog.base(this, mapRenderer, vectorLayer);

  /**
   * @private
   * @type {number}
   */
  this.renderedRevision_ = -1;

  /**
   * @private
   * @type {number}
   */
  this.renderedResolution_ = NaN;

  /**
   * @private
   * @type {ol.Extent}
   */
  this.renderedExtent_ = ol.extent.createEmpty();

  /**
   * @private
   * @type {ol.render.canvas.ReplayGroup}
   */
  this.replayGroup_ = null;

};
goog.inherits(ol.renderer.canvas.VectorLayer, ol.renderer.canvas.Layer);


/**
 * @inheritDoc
 */
ol.renderer.canvas.VectorLayer.prototype.composeFrame =
    function(frameState, layerState, context) {

  // FIXME should be able to avoid call to getTransform here if no postcompose
  // FIXME listeners or replay group
  var transform = this.getTransform(frameState);

  var replayGroup = this.replayGroup_;
  if (!goog.isNull(replayGroup)) {
    context.globalAlpha = layerState.opacity;
    replayGroup.draw(context, frameState.extent, transform);
  }

  this.dispatchPostComposeEvent(context, frameState.extent, transform);

};


/**
 * @return {ol.layer.Vector} Vector layer.
 */
ol.renderer.canvas.VectorLayer.prototype.getVectorLayer = function() {
  return /** @type {ol.layer.Vector} */ (this.getLayer());
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.VectorLayer.prototype.prepareFrame =
    function(frameState, layerState) {

  if (frameState.viewHints[ol.ViewHint.ANIMATING] ||
      frameState.viewHints[ol.ViewHint.INTERACTING]) {
    return;
  }

  var vectorLayer = this.getVectorLayer();
  var vectorSource = vectorLayer.getVectorSource();
  var frameStateExtent = frameState.extent;

  if (this.renderedResolution_ == frameState.view2DState.resolution &&
      this.renderedRevision_ == vectorSource.getRevision() &&
      ol.extent.containsExtent(this.renderedExtent_, frameStateExtent)) {
    return;
  }

  var extent = this.renderedExtent_;
  var xBuffer = ol.extent.getWidth(frameStateExtent) / 4;
  var yBuffer = ol.extent.getHeight(frameStateExtent) / 4;
  extent[0] = frameStateExtent[0] - xBuffer;
  extent[1] = frameStateExtent[1] - yBuffer;
  extent[2] = frameStateExtent[2] + xBuffer;
  extent[3] = frameStateExtent[3] + yBuffer;

  // FIXME dispose of old replayGroup in post render
  goog.dispose(this.replayGroup_);
  this.replayGroup_ = null;

  var styleFunction = vectorLayer.getStyleFunction();
  if (!goog.isDef(styleFunction)) {
    styleFunction = ol.style.DefaultStyleFunction;
  }
  var replayGroup = new ol.render.canvas.ReplayGroup();
  vectorSource.forEachFeatureInExtent(extent, function(feature) {
    var style = styleFunction(feature);
    ol.renderer.vector.renderFeature(replayGroup, feature, style);
  }, this);
  replayGroup.finish();

  this.renderedResolution_ = frameState.view2DState.resolution;
  this.renderedRevision_ = vectorSource.getRevision();
  if (!replayGroup.isEmpty()) {
    this.replayGroup_ = replayGroup;
  }

};
