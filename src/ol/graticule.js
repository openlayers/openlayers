goog.provide('ol.Graticule');

goog.require('ol.coordinate');
goog.require('ol.extent');
goog.require('ol.geom.GeometryLayout');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.geom.flat.geodesic');
goog.require('ol.math');
goog.require('ol.proj');
goog.require('ol.render.EventType');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Text');


/**
 * Render a grid for a coordinate system on a map.
 * @constructor
 * @param {olx.GraticuleOptions=} opt_options Options.
 * @api
 */
ol.Graticule = function(opt_options) {
  var options = opt_options || {};

  /**
   * @type {ol.PluggableMap}
   * @private
   */
  this.map_ = null;

  /**
   * @type {ol.proj.Projection}
   * @private
   */
  this.projection_ = null;

  /**
   * @type {number}
   * @private
   */
  this.maxLat_ = Infinity;

  /**
   * @type {number}
   * @private
   */
  this.maxLon_ = Infinity;

  /**
   * @type {number}
   * @private
   */
  this.minLat_ = -Infinity;

  /**
   * @type {number}
   * @private
   */
  this.minLon_ = -Infinity;

  /**
   * @type {number}
   * @private
   */
  this.maxLatP_ = Infinity;

  /**
   * @type {number}
   * @private
   */
  this.maxLonP_ = Infinity;

  /**
   * @type {number}
   * @private
   */
  this.minLatP_ = -Infinity;

  /**
   * @type {number}
   * @private
   */
  this.minLonP_ = -Infinity;

  /**
   * @type {number}
   * @private
   */
  this.targetSize_ = options.targetSize !== undefined ?
    options.targetSize : 100;

  /**
   * @type {number}
   * @private
   */
  this.maxLines_ = options.maxLines !== undefined ? options.maxLines : 100;

  /**
   * @type {Array.<ol.geom.LineString>}
   * @private
   */
  this.meridians_ = [];

  /**
   * @type {Array.<ol.geom.LineString>}
   * @private
   */
  this.parallels_ = [];

  /**
   * @type {ol.style.Stroke}
   * @private
   */
  this.strokeStyle_ = options.strokeStyle !== undefined ?
    options.strokeStyle : ol.Graticule.DEFAULT_STROKE_STYLE_;

  /**
   * @type {ol.TransformFunction|undefined}
   * @private
   */
  this.fromLonLatTransform_ = undefined;

  /**
   * @type {ol.TransformFunction|undefined}
   * @private
   */
  this.toLonLatTransform_ = undefined;

  /**
   * @type {ol.Coordinate}
   * @private
   */
  this.projectionCenterLonLat_ = null;

  /**
   * @type {Array.<ol.GraticuleLabelDataType>}
   * @private
   */
  this.meridiansLabels_ = null;

  /**
   * @type {Array.<ol.GraticuleLabelDataType>}
   * @private
   */
  this.parallelsLabels_ = null;

  if (options.showLabels == true) {
    var degreesToString = ol.coordinate.degreesToStringHDMS;

    /**
     * @type {null|function(number):string}
     * @private
     */
    this.lonLabelFormatter_ = options.lonLabelFormatter == undefined ?
      degreesToString.bind(this, 'EW') : options.lonLabelFormatter;

    /**
     * @type {function(number):string}
     * @private
     */
    this.latLabelFormatter_ = options.latLabelFormatter == undefined ?
      degreesToString.bind(this, 'NS') : options.latLabelFormatter;

    /**
     * Longitude label position in fractions (0..1) of view extent. 0 means
     * bottom, 1 means top.
     * @type {number}
     * @private
     */
    this.lonLabelPosition_ = options.lonLabelPosition == undefined ? 0 :
      options.lonLabelPosition;

    /**
     * Latitude Label position in fractions (0..1) of view extent. 0 means left, 1
     * means right.
     * @type {number}
     * @private
     */
    this.latLabelPosition_ = options.latLabelPosition == undefined ? 1 :
      options.latLabelPosition;

    /**
     * @type {ol.style.Text}
     * @private
     */
    this.lonLabelStyle_ = options.lonLabelStyle !== undefined ? options.lonLabelStyle :
      new ol.style.Text({
        font: '12px Calibri,sans-serif',
        textBaseline: 'bottom',
        fill: new ol.style.Fill({
          color: 'rgba(0,0,0,1)'
        }),
        stroke: new ol.style.Stroke({
          color: 'rgba(255,255,255,1)',
          width: 3
        })
      });

    /**
     * @type {ol.style.Text}
     * @private
     */
    this.latLabelStyle_ = options.latLabelStyle !== undefined ? options.latLabelStyle :
      new ol.style.Text({
        font: '12px Calibri,sans-serif',
        textAlign: 'end',
        fill: new ol.style.Fill({
          color: 'rgba(0,0,0,1)'
        }),
        stroke: new ol.style.Stroke({
          color: 'rgba(255,255,255,1)',
          width: 3
        })
      });

    this.meridiansLabels_ = [];
    this.parallelsLabels_ = [];
  }

  this.setMap(options.map !== undefined ? options.map : null);
};


/**
 * @type {ol.style.Stroke}
 * @private
 * @const
 */
ol.Graticule.DEFAULT_STROKE_STYLE_ = new ol.style.Stroke({
  color: 'rgba(0,0,0,0.2)'
});


/**
 * TODO can be configurable
 * @type {Array.<number>}
 * @private
 */
ol.Graticule.intervals_ = [90, 45, 30, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05,
  0.01, 0.005, 0.002, 0.001];


/**
 * @param {number} lon Longitude.
 * @param {number} minLat Minimal latitude.
 * @param {number} maxLat Maximal latitude.
 * @param {number} squaredTolerance Squared tolerance.
 * @param {ol.Extent} extent Extent.
 * @param {number} index Index.
 * @return {number} Index.
 * @private
 */
ol.Graticule.prototype.addMeridian_ = function(lon, minLat, maxLat, squaredTolerance, extent, index) {
  var lineString = this.getMeridian_(lon, minLat, maxLat,
      squaredTolerance, index);
  if (ol.extent.intersects(lineString.getExtent(), extent)) {
    if (this.meridiansLabels_) {
      var textPoint = this.getMeridianPoint_(lineString, extent, index);
      this.meridiansLabels_[index] = {
        geom: textPoint,
        text: this.lonLabelFormatter_(lon)
      };
    }
    this.meridians_[index++] = lineString;
  }
  return index;
};

/**
 * @param {ol.geom.LineString} lineString Meridian
 * @param {ol.Extent} extent Extent.
 * @param {number} index Index.
 * @return {ol.geom.Point} Meridian point.
 * @private
 */
ol.Graticule.prototype.getMeridianPoint_ = function(lineString, extent, index) {
  var flatCoordinates = lineString.getFlatCoordinates();
  var clampedBottom = Math.max(extent[1], flatCoordinates[1]);
  var clampedTop = Math.min(extent[3], flatCoordinates[flatCoordinates.length - 1]);
  var lat = ol.math.clamp(
      extent[1] + Math.abs(extent[1] - extent[3]) * this.lonLabelPosition_,
      clampedBottom, clampedTop);
  var coordinate = [flatCoordinates[0], lat];
  var point = this.meridiansLabels_[index] !== undefined ?
    this.meridiansLabels_[index].geom : new ol.geom.Point(null);
  point.setCoordinates(coordinate);
  return point;
};


/**
 * @param {number} lat Latitude.
 * @param {number} minLon Minimal longitude.
 * @param {number} maxLon Maximal longitude.
 * @param {number} squaredTolerance Squared tolerance.
 * @param {ol.Extent} extent Extent.
 * @param {number} index Index.
 * @return {number} Index.
 * @private
 */
ol.Graticule.prototype.addParallel_ = function(lat, minLon, maxLon, squaredTolerance, extent, index) {
  var lineString = this.getParallel_(lat, minLon, maxLon, squaredTolerance,
      index);
  if (ol.extent.intersects(lineString.getExtent(), extent)) {
    if (this.parallelsLabels_) {
      var textPoint = this.getParallelPoint_(lineString, extent, index);
      this.parallelsLabels_[index] = {
        geom: textPoint,
        text: this.latLabelFormatter_(lat)
      };
    }
    this.parallels_[index++] = lineString;
  }
  return index;
};


/**
 * @param {ol.geom.LineString} lineString Parallels.
 * @param {ol.Extent} extent Extent.
 * @param {number} index Index.
 * @return {ol.geom.Point} Parallel point.
 * @private
 */
ol.Graticule.prototype.getParallelPoint_ = function(lineString, extent, index) {
  var flatCoordinates = lineString.getFlatCoordinates();
  var clampedLeft = Math.max(extent[0], flatCoordinates[0]);
  var clampedRight = Math.min(extent[2], flatCoordinates[flatCoordinates.length - 2]);
  var lon = ol.math.clamp(
      extent[0] + Math.abs(extent[0] - extent[2]) * this.latLabelPosition_,
      clampedLeft, clampedRight);
  var coordinate = [lon, flatCoordinates[1]];
  var point = this.parallelsLabels_[index] !== undefined ?
    this.parallelsLabels_[index].geom : new ol.geom.Point(null);
  point.setCoordinates(coordinate);
  return point;
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {ol.Coordinate} center Center.
 * @param {number} resolution Resolution.
 * @param {number} squaredTolerance Squared tolerance.
 * @private
 */
ol.Graticule.prototype.createGraticule_ = function(extent, center, resolution, squaredTolerance) {

  var interval = this.getInterval_(resolution);
  if (interval == -1) {
    this.meridians_.length = this.parallels_.length = 0;
    if (this.meridiansLabels_) {
      this.meridiansLabels_.length = 0;
    }
    if (this.parallelsLabels_) {
      this.parallelsLabels_.length = 0;
    }
    return;
  }

  var centerLonLat = this.toLonLatTransform_(center);
  var centerLon = centerLonLat[0];
  var centerLat = centerLonLat[1];
  var maxLines = this.maxLines_;
  var cnt, idx, lat, lon;

  var validExtent = [
    Math.max(extent[0], this.minLonP_),
    Math.max(extent[1], this.minLatP_),
    Math.min(extent[2], this.maxLonP_),
    Math.min(extent[3], this.maxLatP_)
  ];

  validExtent = ol.proj.transformExtent(validExtent, this.projection_,
      'EPSG:4326');
  var maxLat = validExtent[3];
  var maxLon = validExtent[2];
  var minLat = validExtent[1];
  var minLon = validExtent[0];

  // Create meridians

  centerLon = Math.floor(centerLon / interval) * interval;
  lon = ol.math.clamp(centerLon, this.minLon_, this.maxLon_);

  idx = this.addMeridian_(lon, minLat, maxLat, squaredTolerance, extent, 0);

  cnt = 0;
  while (lon != this.minLon_ && cnt++ < maxLines) {
    lon = Math.max(lon - interval, this.minLon_);
    idx = this.addMeridian_(lon, minLat, maxLat, squaredTolerance, extent, idx);
  }

  lon = ol.math.clamp(centerLon, this.minLon_, this.maxLon_);

  cnt = 0;
  while (lon != this.maxLon_ && cnt++ < maxLines) {
    lon = Math.min(lon + interval, this.maxLon_);
    idx = this.addMeridian_(lon, minLat, maxLat, squaredTolerance, extent, idx);
  }

  this.meridians_.length = idx;
  if (this.meridiansLabels_) {
    this.meridiansLabels_.length = idx;
  }

  // Create parallels

  centerLat = Math.floor(centerLat / interval) * interval;
  lat = ol.math.clamp(centerLat, this.minLat_, this.maxLat_);

  idx = this.addParallel_(lat, minLon, maxLon, squaredTolerance, extent, 0);

  cnt = 0;
  while (lat != this.minLat_ && cnt++ < maxLines) {
    lat = Math.max(lat - interval, this.minLat_);
    idx = this.addParallel_(lat, minLon, maxLon, squaredTolerance, extent, idx);
  }

  lat = ol.math.clamp(centerLat, this.minLat_, this.maxLat_);

  cnt = 0;
  while (lat != this.maxLat_ && cnt++ < maxLines) {
    lat = Math.min(lat + interval, this.maxLat_);
    idx = this.addParallel_(lat, minLon, maxLon, squaredTolerance, extent, idx);
  }

  this.parallels_.length = idx;
  if (this.parallelsLabels_) {
    this.parallelsLabels_.length = idx;
  }

};


/**
 * @param {number} resolution Resolution.
 * @return {number} The interval in degrees.
 * @private
 */
ol.Graticule.prototype.getInterval_ = function(resolution) {
  var centerLon = this.projectionCenterLonLat_[0];
  var centerLat = this.projectionCenterLonLat_[1];
  var interval = -1;
  var i, ii, delta, dist;
  var target = Math.pow(this.targetSize_ * resolution, 2);
  /** @type {Array.<number>} **/
  var p1 = [];
  /** @type {Array.<number>} **/
  var p2 = [];
  for (i = 0, ii = ol.Graticule.intervals_.length; i < ii; ++i) {
    delta = ol.Graticule.intervals_[i] / 2;
    p1[0] = centerLon - delta;
    p1[1] = centerLat - delta;
    p2[0] = centerLon + delta;
    p2[1] = centerLat + delta;
    this.fromLonLatTransform_(p1, p1);
    this.fromLonLatTransform_(p2, p2);
    dist = Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2);
    if (dist <= target) {
      break;
    }
    interval = ol.Graticule.intervals_[i];
  }
  return interval;
};


/**
 * Get the map associated with this graticule.
 * @return {ol.PluggableMap} The map.
 * @api
 */
ol.Graticule.prototype.getMap = function() {
  return this.map_;
};


/**
 * @param {number} lon Longitude.
 * @param {number} minLat Minimal latitude.
 * @param {number} maxLat Maximal latitude.
 * @param {number} squaredTolerance Squared tolerance.
 * @return {ol.geom.LineString} The meridian line string.
 * @param {number} index Index.
 * @private
 */
ol.Graticule.prototype.getMeridian_ = function(lon, minLat, maxLat,
    squaredTolerance, index) {
  var flatCoordinates = ol.geom.flat.geodesic.meridian(lon,
      minLat, maxLat, this.projection_, squaredTolerance);
  var lineString = this.meridians_[index] !== undefined ?
    this.meridians_[index] : new ol.geom.LineString(null);
  lineString.setFlatCoordinates(ol.geom.GeometryLayout.XY, flatCoordinates);
  return lineString;
};


/**
 * Get the list of meridians.  Meridians are lines of equal longitude.
 * @return {Array.<ol.geom.LineString>} The meridians.
 * @api
 */
ol.Graticule.prototype.getMeridians = function() {
  return this.meridians_;
};


/**
 * @param {number} lat Latitude.
 * @param {number} minLon Minimal longitude.
 * @param {number} maxLon Maximal longitude.
 * @param {number} squaredTolerance Squared tolerance.
 * @return {ol.geom.LineString} The parallel line string.
 * @param {number} index Index.
 * @private
 */
ol.Graticule.prototype.getParallel_ = function(lat, minLon, maxLon,
    squaredTolerance, index) {
  var flatCoordinates = ol.geom.flat.geodesic.parallel(lat,
      minLon, maxLon, this.projection_, squaredTolerance);
  var lineString = this.parallels_[index] !== undefined ?
    this.parallels_[index] : new ol.geom.LineString(null);
  lineString.setFlatCoordinates(ol.geom.GeometryLayout.XY, flatCoordinates);
  return lineString;
};


/**
 * Get the list of parallels.  Parallels are lines of equal latitude.
 * @return {Array.<ol.geom.LineString>} The parallels.
 * @api
 */
ol.Graticule.prototype.getParallels = function() {
  return this.parallels_;
};


/**
 * @param {ol.render.Event} e Event.
 * @private
 */
ol.Graticule.prototype.handlePostCompose_ = function(e) {
  var vectorContext = e.vectorContext;
  var frameState = e.frameState;
  var extent = frameState.extent;
  var viewState = frameState.viewState;
  var center = viewState.center;
  var projection = viewState.projection;
  var resolution = viewState.resolution;
  var pixelRatio = frameState.pixelRatio;
  var squaredTolerance =
      resolution * resolution / (4 * pixelRatio * pixelRatio);

  var updateProjectionInfo = !this.projection_ ||
      !ol.proj.equivalent(this.projection_, projection);

  if (updateProjectionInfo) {
    this.updateProjectionInfo_(projection);
  }

  this.createGraticule_(extent, center, resolution, squaredTolerance);

  // Draw the lines
  vectorContext.setFillStrokeStyle(null, this.strokeStyle_);
  var i, l, line;
  for (i = 0, l = this.meridians_.length; i < l; ++i) {
    line = this.meridians_[i];
    vectorContext.drawGeometry(line);
  }
  for (i = 0, l = this.parallels_.length; i < l; ++i) {
    line = this.parallels_[i];
    vectorContext.drawGeometry(line);
  }
  var labelData;
  if (this.meridiansLabels_) {
    for (i = 0, l = this.meridiansLabels_.length; i < l; ++i) {
      labelData = this.meridiansLabels_[i];
      this.lonLabelStyle_.setText(labelData.text);
      vectorContext.setTextStyle(this.lonLabelStyle_);
      vectorContext.drawGeometry(labelData.geom);
    }
  }
  if (this.parallelsLabels_) {
    for (i = 0, l = this.parallelsLabels_.length; i < l; ++i) {
      labelData = this.parallelsLabels_[i];
      this.latLabelStyle_.setText(labelData.text);
      vectorContext.setTextStyle(this.latLabelStyle_);
      vectorContext.drawGeometry(labelData.geom);
    }
  }
};


/**
 * @param {ol.proj.Projection} projection Projection.
 * @private
 */
ol.Graticule.prototype.updateProjectionInfo_ = function(projection) {
  var epsg4326Projection = ol.proj.get('EPSG:4326');

  var extent = projection.getExtent();
  var worldExtent = projection.getWorldExtent();
  var worldExtentP = ol.proj.transformExtent(worldExtent,
      epsg4326Projection, projection);

  var maxLat = worldExtent[3];
  var maxLon = worldExtent[2];
  var minLat = worldExtent[1];
  var minLon = worldExtent[0];

  var maxLatP = worldExtentP[3];
  var maxLonP = worldExtentP[2];
  var minLatP = worldExtentP[1];
  var minLonP = worldExtentP[0];

  this.maxLat_ = maxLat;
  this.maxLon_ = maxLon;
  this.minLat_ = minLat;
  this.minLon_ = minLon;

  this.maxLatP_ = maxLatP;
  this.maxLonP_ = maxLonP;
  this.minLatP_ = minLatP;
  this.minLonP_ = minLonP;


  this.fromLonLatTransform_ = ol.proj.getTransform(
      epsg4326Projection, projection);

  this.toLonLatTransform_ = ol.proj.getTransform(
      projection, epsg4326Projection);

  this.projectionCenterLonLat_ = this.toLonLatTransform_(
      ol.extent.getCenter(extent));

  this.projection_ = projection;
};


/**
 * Set the map for this graticule.  The graticule will be rendered on the
 * provided map.
 * @param {ol.PluggableMap} map Map.
 * @api
 */
ol.Graticule.prototype.setMap = function(map) {
  if (this.map_) {
    this.map_.un(ol.render.EventType.POSTCOMPOSE,
        this.handlePostCompose_, this);
    this.map_.render();
  }
  if (map) {
    map.on(ol.render.EventType.POSTCOMPOSE,
        this.handlePostCompose_, this);
    map.render();
  }
  this.map_ = map;
};
