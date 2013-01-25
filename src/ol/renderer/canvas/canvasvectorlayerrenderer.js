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
   * Final canvas made available to the map renderer.
   * @private
   * @type {HTMLCanvasElement}
   */
  this.canvas_ = /** @type {HTMLCanvasElement} */
      (goog.dom.createElement(goog.dom.TagName.CANVAS));

  /**
   * @private
   * @type {CanvasRenderingContext2D}
   */
  this.context_ =  /** @type {CanvasRenderingContext2D} */
      this.canvas_.getContext('2d');

  /**
   * @private
   * @type {!goog.vec.Mat4.Number}
   */
  this.transform_ = goog.vec.Mat4.createNumber();

  /**
   * Interim canvas for drawing newly visible features.
   * @private
   * @type {HTMLCanvasElement}
   */
  this.sketchCanvas_ = /** @type {HTMLCanvasElement} */
      (goog.dom.createElement(goog.dom.TagName.CANVAS));

  /**
   * @private
   * @type {!goog.vec.Mat4.Number}
   */
  this.sketchTransform_ = goog.vec.Mat4.createNumber();

  /**
   * @private
   * @type {Object.<string, HTMLCanvasElement>}
   */
  this.tileCache_ = {};

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

  /**
   * @private
   * @type {number}
   */
  this.renderedResolution_;

  /**
   * @private
   * @type {boolean}
   */
  this.layerChanged_ = false;


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
  // TODO: remove this
  this.symbolizers_ = symbolizers;

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

  var view2DState = frameState.view2DState,
      resolution = view2DState.resolution,
      extent = frameState.extent;

  var layer = this.getVectorLayer();
  var source = layer.getVectorSource();
  var tileGrid = source.getTileGrid();

  if (goog.isNull(tileGrid)) {
    // lazy tile source creation to match the view projection
    tileGrid = ol.tilegrid.createForProjection(
        view2DState.projection, /** TODO: get this elsewhere */ 22);
    source.setTileGrid(tileGrid);
  }

  var tileSize = tileGrid.getTileSize();
  var z = tileGrid.getZForResolution(resolution);
  var tileResolution = tileGrid.getResolution(z);
  var tileRange = tileGrid.getTileRangeForExtentAndResolution(
      extent, tileResolution);
  var tileRangeExtent = tileGrid.getTileRangeExtent(z, tileRange);

  // clear tiles at alt-z
  if (this.renderedResolution_ != tileResolution) {
    this.tileCache_ = {};
  }

  /**
   * Prepare the sketch canvas.  This covers the currently visible tile range
   * and will have rendered all newly visible features.
   */
  var sketchCanvas = this.sketchCanvas_;
  var sketchSize = new ol.Size(
      tileSize.width * tileRange.getWidth(),
      tileSize.height * tileRange.getHeight());

  sketchCanvas.width = sketchSize.width;
  sketchCanvas.height = sketchSize.height;

  // clear/resize final canvas
  var finalCanvas = this.canvas_;
  finalCanvas.width = sketchSize.width;
  finalCanvas.height = sketchSize.height;
  var finalContext = this.context_;

  var sketchOrigin = tileRangeExtent.getTopLeft();
  var frameOrigin = extent.getTopLeft();
  var transform = this.transform_;
  goog.vec.Mat4.makeIdentity(transform);
  goog.vec.Mat4.translate(transform,
      frameState.size.width / 2, frameState.size.height / 2, 0);
  goog.vec.Mat4.rotateZ(transform, view2DState.rotation);
  goog.vec.Mat4.scale(
      transform,
      tileResolution / view2DState.resolution,
      tileResolution / view2DState.resolution,
      1);
  goog.vec.Mat4.translate(
      transform,
      (frameOrigin.x - view2DState.center.x) / tileResolution,
      (view2DState.center.y - frameOrigin.y) / tileResolution,
      0);

  var sketchTransform = this.sketchTransform_;
  goog.vec.Mat4.makeIdentity(sketchTransform);
  goog.vec.Mat4.scale(
      sketchTransform,
      1 / tileResolution,
      -1 / tileResolution,
      1);
  goog.vec.Mat4.translate(
      sketchTransform,
      -sketchOrigin.x,
      -sketchOrigin.y,
      0);

  var sketchCanvasRenderer = new ol.renderer.canvas.Renderer(
      sketchCanvas, sketchTransform);
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
      tile = this.tileCache_[key];
      tileExtent = tileGrid.getTileCoordExtent(tileCoord);
      if (tile === undefined) {
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
          // TODO: spatial index of tiles - see filterFn above
          features = goog.array.filter(features, filterFn);
          if (features.length) {
            // TODO: layer.getSymbolizerLiterals(features) or similar
            symbolizer = this.symbolizers_[type];
            sketchCanvasRenderer.renderFeaturesByGeometryType(
                type, features, symbolizer);
          }
        }
        tile = /** @type {HTMLCanvasElement} */
            goog.dom.createElement(goog.dom.TagName.CANVAS);
        tile.width = tileSize.width;
        tile.height = tileSize.height;
        tileContext = tile.getContext('2d');

        // TODO: remove me
        if (goog.DEBUG) {
          tileContext.strokeStyle = '#999999';
          tileContext.fillStyle = '#999999';
          tileContext.textAlign = 'center';
          tileContext.textBaseline = 'middle';
          tileContext.font = '24px sans-serif';
          tileContext.strokeRect(0.5, 0.5, tileSize.width - 1,
              tileSize.height - 1);
          tileContext.fillText(tileCoord.toString(), tileSize.width / 2,
              tileSize.height / 2);
        }

        tileContext.drawImage(sketchCanvas,
            -x * tileSize.width, -(tileRange.maxY - y) * tileSize.height);
        this.tileCache_[key] = tile;
      }
      finalContext.drawImage(tile,
          (tileExtent.minX - frameOrigin.x) / tileResolution,
          (frameOrigin.y - tileExtent.maxY) / tileResolution);
    }
  }

  this.renderedResolution_ = tileResolution;

};
