goog.provide('ol.renderer.canvas.VectorLayer');

goog.require('goog.asserts');
goog.require('goog.functions');
goog.require('ol.ViewHint');
goog.require('ol.extent');
goog.require('ol.render.canvas.ReplayGroup');
goog.require('ol.renderer.canvas.Layer');
goog.require('ol.renderer.vector');



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

  var transform = this.getTransform(frameState);

  this.dispatchPreComposeEvent(context, frameState, transform);

  var replayGroup = this.replayGroup_;
  if (!goog.isNull(replayGroup)) {
    var vectorLayer = this.getVectorLayer();
    var renderGeometryFunction = vectorLayer.getRenderGeometryFunction();
    if (!goog.isDef(renderGeometryFunction)) {
      renderGeometryFunction = goog.functions.TRUE;
    }
    goog.asserts.assert(goog.isFunction(renderGeometryFunction));
    context.globalAlpha = layerState.opacity;
    replayGroup.replay(
        context, frameState.extent, transform, renderGeometryFunction);
  }

  this.dispatchPostComposeEvent(context, frameState, transform);

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
  var replayGroup = new ol.render.canvas.ReplayGroup();
  vectorSource.forEachFeatureInExtent(extent,
      /**
       * @param {ol.Feature} feature Feature.
       */
      function(feature) {
        var styles = styleFunction(feature);
        var i, ii = styles.length;
        for (i = 0; i < ii; ++i) {
          ol.renderer.vector.renderFeature(replayGroup, feature, styles[i]);
        }
      }, this);
  replayGroup.finish();

  this.renderedResolution_ = frameState.view2DState.resolution;
  this.renderedRevision_ = vectorSource.getRevision();
  if (!replayGroup.isEmpty()) {
    this.replayGroup_ = replayGroup;
  }

};
