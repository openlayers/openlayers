goog.provide('ol.renderer.tile.Canvas');

goog.require('goog.style');
goog.require('ol.Coordinate');
goog.require('ol.Pixel');
goog.require('ol.Projection');



ol.renderer.tile.Canvas = function(layerRenderer) {
  
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
   * @type {CanvasContext}
   * @private
   */
  this.context_;
  
  /**
   * @type {CanvasImageData}
   * @private
   */
  this.pixelData_;

};

/**
 * @param size {Object|ol.Size}
 */
ol.renderer.tile.Canvas.prototype.setSize = function(size) {
  if (!(size instanceof ol.Size)) {
    size = new ol.Size(size.width, size.height);
  }
  this.size_ = size;
  if (!this.context_) {
    this.context_ = document.createElement('canvas').getContext('2d');
    this.pixelData_ = this.context_.createImageData(1,1).data;
    this.pixelData[3] = 1; // opacity
  }
  goog.style.setSize(this.canvas_, size);
};

/**
 * @param size {Object|ol.Coordinate}
 */
ol.renderer.tile.Canvas.prototype.setOrigin = function(origin) {
  if (!(origin instanceof ol.Coordinate)) {
    origin = new ol.Coordinate(origin.x, origin.y);
  }
  this.origin_ = origin;
  this.originPixel_ = this.layerRenderer_.getPixelFromCoordinate(origin);
};

/**
 * @param resolution {number}
 */
ol.renderer.tile.Canvas.prototype.setResolution = function(resolution) {
  this.resolution_ = resolution;
};

/*
 * @param geoJson {Object|Array} GeoJSON or an array of GeoJSON features 
 * @param projection {ol.Projection=}
 */
ol.renderer.tile.Canvas.prototype.render = function(geoJson, projection) {
  var map = this.map;
  this.projection_ = map.getProjection();
  this.resolution_ = map.getResolution();
  
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
    projection = projection || new ol.Projection('EPSG:4326');
    if (!(projection instanceof ol.Projection)) {
      projection = new ol.Projection(projection);
    }
    for (var i=0, ii=features.length; i<ii; ++i) {
      this.renderGeometry(features[i].geometry, projection);
    }
  }
};

ol.renderer.tile.Canvas.prototype.renderGeometry =
    function(geometry, projection) {
  var i, coordinates, hole = false;
  if (geometry.type === 'Point') {
    this.renderPosList([geometry.coordinates], projection, false, false, hole);
  } else if (geometry.type === 'MultiPoint') {
    this.renderPosList(geometry.coordinates, projection, false, false, hole);
  } else if (geometry.type === 'LineString') {
    this.renderPosList(geometry.coordinates, projection, true, false, hole);
  } else if (geometry.type === 'MultiLineString') {
    coordinates = geometry.coordinates;
    for (i=0, ii=coordinates.length; i<ii; ++i) {
      this.renderPosList(coordinates[i], projection, true, false, hole);
    }
  } else if (geometry.type === 'Polygon') {
    coordinates = geometry.coordinates;
    for (i=0, ii=coordinates.length; i<ii; ++i) {
      this.renderPosList(coordinates[i], projection, true, true, hole);
      hole = true;
    }
  }
};

ol.renderer.tileCanvas.prototype.renderPosList =
    function(posList, projection, connect, fill, hole) {
  var position, coordinate, pixel, localX, localY;
  if (connect === true) {
    this.context_.beginPath();
  }
  for (i=0, ii=posList.length; i<ii; ++i) {
    position = posList[i];
    coordinate = ol.Projection.transform(new ol.Coordinate(
        position[0], position[1]), projection, this.projection);
    pixel = this.layerRenderer_.getPixelFromCoordinate(coordinate);
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
