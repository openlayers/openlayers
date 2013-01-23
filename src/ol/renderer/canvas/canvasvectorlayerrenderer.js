goog.provide('ol.renderer.canvas.VectorLayer');

goog.require('goog.vec.Mat4');
goog.require('ol.filter.Geometry');
goog.require('ol.geom.GeometryType');
goog.require('ol.layer.Vector');
goog.require('ol.tilegrid.TileGrid');



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
   * @type {HTMLCanvasElement}
   */
  this.sketchCanvas_ = null;

  /**
   * @private
   * @type {Object.<string, HTMLCanvasElement>}
   */
  this.tileCache_ = {};

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

  var layer = this.getVectorLayer();
  var source = layer.getVectorSource();
  var extent = frameState.extent;
  var view2DState = frameState.view2DState;
  var tileGrid = source.getTileGrid();

  if (goog.isNull(tileGrid)) {
    // lazy tile source creation to match the view projection
    tileGrid = ol.tilegrid.createForProjection(
        view2DState.projection, 22);
    source.setTileGrid(tileGrid);
  }

  var tileSize = tileGrid.getTileSize();
  var z = tileGrid.getZForResolution(view2DState.resolution);
  var tileResolution = tileGrid.getResolution(z);
  var tileRange = tileGrid.getTileRangeForExtentAndResolution(
      frameState.extent, tileResolution);

  var canvasSize = new ol.Size(
      tileSize.width * tileRange.getWidth(),
      tileSize.height * tileRange.getHeight());

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
    this.sketchCanvas_ = /** @type {HTMLCanvasElement} */
        canvas.cloneNode(false);
  } else {
    canvas = this.canvas_;
    context = this.context_;
    // force clear the canvas
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    this.canvasSize_ = canvasSize;
  }

  // TODO: implement layer.setStyle(style) where style is a set of rules
  // and a rule has a filter and array of symbolizers
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

  var sketchCanvas = this.sketchCanvas_;
  // clear the sketch canvas
  sketchCanvas.width = canvasSize.width;
  sketchCanvas.height = canvasSize.height;
  // TODO: Use transform for tile resolution, not frameState resolution
  var sketchCanvasRenderer = new ol.renderer.canvas.Renderer(
      sketchCanvas, frameState.coordinateToPixelMatrix);
  var renderedFeatures = {};
  var tile, tileContext, tileCoord, key, tileExtent, tileState, x, y;
  // render features by geometry type
  var filters = this.geometryFilters_,
      numFilters = filters.length,
      i, filter, type, features, symbolizer;
  for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
    for (y = tileRange.minY; y <= tileRange.maxY; ++y) {
      tileCoord = new ol.TileCoord(z, x, y);
      key = tileCoord.toString();
      if (key in this.tileCache_) {
        tile = this.tileCache_[key];
      } else {
        tileExtent = tileGrid.getTileCoordExtent(tileCoord);
        // TODO: instead of filtering here, do this on the source and maintain
        // a spatial index
        function filterFn(feature) {
          var id = goog.getUid(feature);
          var include = !(id in renderedFeatures) &&
              feature.getGeometry().getBounds().intersects(tileExtent);
          if (include === true) {
            renderedFeatures[id] = true;
          }
          return include;
        }
        for (i = 0; i < numFilters; ++i) {
          filter = filters[i];
          type = filter.getType();
          features = source.getFeatures(filter);
          // TODO: spatial indes of tiles - see filterFn above
          features = goog.array.filter(features, filterFn);
          if (features.length) {
            // TODO: layer.getSymbolizerLiterals(features) or similar
            symbolizer = symbolizers[type];
            sketchCanvasRenderer.renderFeaturesByGeometryType(
                type, features, symbolizer);
          }
        }
        tile = /** @type {HTMLCanvasElement} */
            goog.dom.createElement(goog.dom.TagName.CANVAS);
        tile.width = tileSize.width;
        tile.height = tileSize.height;
        tileContext = tile.getContext('2d');
        tileContext.drawImage(sketchCanvas,
            x * tileSize.width, (tileRange.maxY - y) * tileSize.height,
            tileSize.width, tileSize.height,
            0, 0, tileSize.width, tileSize.height);
        this.tileCache_[key] = tile;
      }
      // TODO: transform (scale, offset)
      context.drawImage(tile,
          0, 0,
          tileSize.width, tileSize.height,
          x * tileSize.width, (tileRange.maxY - y) * tileSize.height,
          tileSize.width, tileSize.height);
    }
  }

};
