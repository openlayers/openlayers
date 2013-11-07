goog.provide('ol.renderer.canvas.VectorLayer');

goog.require('goog.vec.Mat4');
goog.require('ol.extent');
goog.require('ol.renderer.canvas.Layer');
goog.require('ol.renderer.vector');
goog.require('ol.replay.canvas.BatchGroup');
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
   * @type {!goog.vec.Mat4.Number}
   */
  this.transform_ = goog.vec.Mat4.createNumber();

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
   * @type {ol.replay.canvas.BatchGroup}
   */
  this.batchGroup_ = null;

};
goog.inherits(ol.renderer.canvas.VectorLayer, ol.renderer.canvas.Layer);


/**
 * @inheritDoc
 */
ol.renderer.canvas.VectorLayer.prototype.composeFrame =
    function(frameState, layerState, context) {

  var batchGroup = this.batchGroup_;
  if (goog.isNull(batchGroup)) {
    return;
  }

  var view2DState = frameState.view2DState;
  var viewCenter = view2DState.center;
  var viewResolution = view2DState.resolution;
  var viewRotation = view2DState.rotation;

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

  batchGroup.draw(context, transform);

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

  var vectorLayer = this.getVectorLayer();
  var vectorSource = vectorLayer.getVectorSource();

  if (this.renderedResolution_ == frameState.view2DState.resolution &&
      this.renderedRevision_ == vectorSource.getRevision() &&
      ol.extent.containsExtent(this.renderedExtent_, frameState.extent)) {
    return;
  }

  // FIXME dispose of old batchGroup in post render
  goog.dispose(this.batchGroup_);
  this.batchGroup = null;

  var styleFunction = vectorLayer.getStyleFunction();
  if (!goog.isDef(styleFunction)) {
    styleFunction = ol.style.DefaultStyleFunction;
  }
  var batchGroup = new ol.replay.canvas.BatchGroup();
  vectorSource.forEachFeatureInExtent(frameState.extent, function(feature) {
    var style = styleFunction(feature);
    ol.renderer.vector.renderFeature(batchGroup, feature, style);
  }, this);

  this.renderedResolution_ = frameState.view2DState.resolution;
  this.renderedRevision_ = vectorSource.getRevision();
  this.renderedExtent_ = frameState.extent;
  if (!batchGroup.isEmpty()) {
    this.batchGroup_ = batchGroup;
  }

};
