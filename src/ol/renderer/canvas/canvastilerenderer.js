goog.provide('ol.renderer.tile.Canvas');

goog.require('goog.style');
goog.require('ol.Coordinate');
goog.require('ol.Pixel');
goog.require('ol.Projection');


/**
 * TODO(tschaub): get rid of this
 * @typedef {{coordinates: (Array)}}
 */
ol.GeoJSONGeometry;


/**
 * TODO(tschaub): get rid of this
 * @typedef {{geometry: (ol.GeoJSONGeometry)}}
 */
ol.GeoJSONFeature;



/**
 * @constructor
 * @param {ol.renderer.Layer} layerRenderer Layer renderer.
 */
ol.renderer.tile.Canvas = function(layerRenderer) {

  /**
   * @type {ol.renderer.Layer}
   * @private
   */
  this.layerRenderer_ = layerRenderer;

  /**
   * @type {ol.Projection}
   * @private
   */
  this.projection_;

  /**
   * @type {number}
   * @private
   */
  this.resolution_;

  /**
   * @type {ol.Coordinate}
   * @private
   */
  this.origin_ = new ol.Coordinate(0, 0);

  /**
   * @type {ol.Pixel}
   * @private
   */
  this.originPixel_;

  /**
   * @type {Object|ol.Size}
   * @private
   */
  this.size_;

  /**
   * @type {Element}
   * @private
   */
  this.canvas_;

  /**
   * @type {CanvasRenderingContext2D}
   * @private
   */
  this.context_;

  /**
   * @type {ImageData}
   * @private
   */
  this.pixelData_;

};


/**
 * @param {Object|ol.Size} size Tile size.
 */
ol.renderer.tile.Canvas.prototype.setSize = function(size) {
  if (!(size instanceof ol.Size)) {
    size = new ol.Size(size.width, size.height);
  }
  this.size_ = size;
  if (!this.context_) {
    this.canvas_ = goog.dom.createElement(goog.dom.TagName.CANVAS);
    this.context_ = this.canvas_.getContext('2d');
    this.pixelData_ = this.context_.createImageData(1, 1).data;
    this.pixelData_[3] = 1; // opacity
  }
  goog.style.setSize(this.canvas_, size);
};


/**
 * @param {Object|ol.Coordinate} origin Tile origin.
 */
ol.renderer.tile.Canvas.prototype.setOrigin = function(origin) {
  if (!(origin instanceof ol.Coordinate)) {
    origin = new ol.Coordinate(origin.x, origin.y);
  }
  this.origin_ = origin;
  var mapRenderer = this.layerRenderer_.getMapRenderer();
  this.originPixel_ = mapRenderer.getPixelFromCoordinate(origin);
};


/**
 * @param {number} resolution Tile resolution.
 */
ol.renderer.tile.Canvas.prototype.setResolution = function(resolution) {
  this.resolution_ = resolution;
};


/**
 * @param {Object|Array} geoJson GeoJSON or an array of GeoJSON features.
 * @param {ol.Projection=} opt_projection Projection.
 */
ol.renderer.tile.Canvas.prototype.render = function(geoJson, opt_projection) {
  var map = this.layerRenderer_.getMap();
  // TODO(tschaub): make it so this isn't required everywhere
  this.projection_ = /** @type {ol.Projection} */ map.getProjection();
  this.resolution_ = /** @type {number} */ map.getResolution();

  var features;
  if (goog.isArray(geoJson)) {
    features = geoJson;
  } else if (geoJson.type === 'FeatureCollection') {
    features = geoJson.features;
  } else if (geoJson.type === 'Feature') {
    features = [geoJson];
  }

  if (features) {
    //FIXME Support geometry level projections
    /** @type {ol.Projection} */
    var projection;
    if (goog.isDef(opt_projection)) {
      projection = opt_projection;
    } else {
      projection = ol.Projection.getFromCode('EPSG:4326');
    }
    for (var i = 0, ii = features.length; i < ii; ++i) {
      this.renderGeometry(features[i].geometry, projection);
    }
  }
};


/**
 * @param {Object} geometry GeoJSON geometry.
 * @param {ol.Projection} projection Projection.
 */
ol.renderer.tile.Canvas.prototype.renderGeometry =
    function(geometry, projection) {
  var i, ii, coordinates, hole = false;
  if (geometry.type === 'Point') {
    this.renderPosList([geometry.coordinates],
        projection, false, false, hole);
  } else if (geometry.type === 'MultiPoint') {
    this.renderPosList(geometry.coordinates,
        projection, false, false, hole);
  } else if (geometry.type === 'LineString') {
    this.renderPosList(geometry.coordinates, projection, true, false, hole);
  } else if (geometry.type === 'MultiLineString') {
    coordinates = geometry.coordinates;
    for (i = 0, ii = coordinates.length; i < ii; ++i) {
      this.renderPosList(coordinates[i], projection, true, false, hole);
    }
  } else if (geometry.type === 'Polygon') {
    coordinates = geometry.coordinates;
    for (i = 0, ii = coordinates.length; i < ii; ++i) {
      this.renderPosList(coordinates[i], projection, true, true, hole);
      hole = true;
    }
  }
};


/**
 * @param {Array} posList Coordinates.
 * @param {ol.Projection} projection Projection.
 * @param {boolean} connect Connect endpoints.
 * @param {boolean} fill Fill.
 * @param {boolean} hole Treat as hole.
 */
ol.renderer.tile.Canvas.prototype.renderPosList =
    function(posList, projection, connect, fill, hole) {
  var i, ii, position, coordinate, pixel, localX, localY;
  if (connect === true) {
    this.context_.beginPath();
  }
  for (i = 0, ii = posList.length; i < ii; ++i) {
    position = posList[i];
    coordinate = ol.Projection.transform(new ol.Coordinate(
        position[0], position[1]), projection, this.projection_);
    var mapRenderer = this.layerRenderer_.getMapRenderer();
    pixel = mapRenderer.getPixelFromCoordinate(coordinate);
    localX = pixel.x - this.originPixel_.x;
    localY = pixel.y - this.originPixel_.y + this.size_.height;
    if (connect === false && fill === false) {
      //FIXME Draw more than just a black pixel for points
      this.context_.putImageData(this.pixelData_, localX, localY);
    } else {
      this.context_[i === 0 ? 'moveTo' : 'pathTo'](localX, localY);
    }
  }
  if (connect === true) {
    this.context_.closePath();
    this.context_.stroke();
  }
  if (fill === true) {
    //FIXME deal with holes
    this.context_.fill();
  }

};
