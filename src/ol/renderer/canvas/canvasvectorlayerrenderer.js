goog.provide('ol.renderer.canvas.VectorLayer');

goog.require('goog.vec.Mat4');
goog.require('ol.filter.Geometry');
goog.require('ol.geom.GeometryType');
goog.require('ol.layer.Vector');



/**
 * @constructor
 * @extends {ol.renderer.canvas.Layer}
 * @param {ol.renderer.Map} mapRenderer Map renderer.
 * @param {ol.layer.Vector} layer Vector layer.
 */
ol.renderer.canvas.VectorLayer = function(mapRenderer, layer) {

  goog.base(this, mapRenderer, layer);

  /**
   * @private
   * @type {HTMLCanvasElement}
   */
  this.canvas_ = null;

  /**
   * @private
   * @type {ol.Size}
   */
  this.canvasSize_ = null;

  /**
   * @private
   * @type {CanvasRenderingContext2D}
   */
  this.context_ = null;

  /**
   * @private
   * @type {!goog.vec.Mat4.Number}
   */
  this.transform_ = goog.vec.Mat4.createNumber();
  goog.vec.Mat4.makeIdentity(this.transform_);

  /**
   * Geometry filters in rendering order.
   * @private
   * @type {Array.<ol.filter.Geometry>}
   * TODO: deal with multis
   */
  this.geometryFilters_ = [
    new ol.filter.Geometry(ol.geom.GeometryType.POLYGON),
    new ol.filter.Geometry(ol.geom.GeometryType.LINESTRING),
    new ol.filter.Geometry(ol.geom.GeometryType.POINT)
  ];

};
goog.inherits(ol.renderer.canvas.VectorLayer, ol.renderer.canvas.Layer);


/**
 * @inheritDoc
 */
ol.renderer.canvas.VectorLayer.prototype.getImage = function() {
  return this.canvas_;
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
ol.renderer.canvas.VectorLayer.prototype.getTransform = function() {
  return this.transform_;
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.VectorLayer.prototype.renderFrame =
    function(frameState, layerState) {

  var view2DState = frameState.view2DState;

  var layer = this.getVectorLayer();
  var source = layer.getVectorSource();
  var extent = frameState.extent;

  var canvasSize = frameState.size;

  var canvas, context;
  if (goog.isNull(this.canvas_)) {
    canvas = /** @type {HTMLCanvasElement} */
        (goog.dom.createElement(goog.dom.TagName.CANVAS));
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    context = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
    this.canvas_ = canvas;
    this.canvasSize_ = canvasSize;
    this.context_ = context;
  } else {
    canvas = this.canvas_;
    context = this.context_;
    // force clear the canvas
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    this.canvasSize_ = canvasSize;
  }

  /**
   * For now, we create a canvas renderer and have it render all features with
   * every call to renderFrame.
   * TODO: only render newly visible/dirty areas
   */
  var canvasRenderer = new ol.renderer.canvas.Renderer(
      canvas, frameState.coordinateToPixelMatrix);

  // TODO: get these elsewhere
  var symbolizers = {};
  symbolizers[ol.geom.GeometryType.POINT] = new ol.style.LiteralShape({
    type: ol.style.ShapeType.CIRCLE,
    size: 10,
    fillStyle: '#ffcc99',
    strokeStyle: '#ff9933',
    strokeWidth: 2,
    opacity: 0.75
  });
  symbolizers[ol.geom.GeometryType.LINESTRING] = new ol.style.LiteralLine({
    strokeStyle: '#ff9933',
    strokeWidth: 2,
    opacity: 1
  });
  symbolizers[ol.geom.GeometryType.POLYGON] = new ol.style.LiteralPolygon({
    fillStyle: '#ffcc99',
    strokeStyle: '#ff9933',
    strokeWidth: 2,
    opacity: 0.5
  });

  // render features by geometry type
  var filters = this.geometryFilters_,
      numFilters = filters.length,
      i, filter, type, features, symbolizer;

  for (i = 0; i < numFilters; ++i) {
    filter = filters[i];
    type = filter.getType();
    features = source.getFeatures(filter);
    if (features.length) {
      symbolizer = symbolizers[type];
      canvasRenderer.renderFeaturesByGeometryType(type, features, symbolizer);
    }
  }

};
