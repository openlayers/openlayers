goog.provide('ol.Graticule');

goog.require('goog.asserts');
goog.require('goog.math');
goog.require('ol.extent');
goog.require('ol.geom.LineString');
goog.require('ol.geom.flat.geodesic');
goog.require('ol.proj');
goog.require('ol.render.EventType');
goog.require('ol.style.Stroke');



/**
 * @constructor
 * @param {olx.GraticuleOptions=} opt_options Options.
 * @api
 */
ol.Graticule = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @type {ol.Map}
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
  this.targetSize_ = goog.isDef(options.targetSize) ?
      options.targetSize : 100;

  /**
   * @type {number}
   * @private
   */
  this.maxLines_ = goog.isDef(options.maxLines) ? options.maxLines : 100;
  goog.asserts.assert(this.maxLines_ > 0);

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
  this.strokeStyle_ = goog.isDef(options.strokeStyle) ?
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

  this.setMap(goog.isDef(options.map) ? options.map : null);
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
 * @param {number} squaredTolerance Squared tolerance.
 * @param {ol.Extent} extent Extent.
 * @param {number} index Index.
 * @return {number} Index.
 * @private
 */
ol.Graticule.prototype.addMeridian_ =
    function(lon, squaredTolerance, extent, index) {
  var lineString = this.getMeridian_(lon, squaredTolerance, index);
  if (ol.extent.intersects(lineString.getExtent(), extent)) {
    this.meridians_[index++] = lineString;
  }
  return index;
};


/**
 * @param {number} lat Latitude.
 * @param {number} squaredTolerance Squared tolerance.
 * @param {ol.Extent} extent Extent.
 * @param {number} index Index.
 * @return {number} Index.
 * @private
 */
ol.Graticule.prototype.addParallel_ =
    function(lat, squaredTolerance, extent, index) {
  var lineString = this.getParallel_(lat, squaredTolerance, index);
  if (ol.extent.intersects(lineString.getExtent(), extent)) {
    this.parallels_[index++] = lineString;
  }
  return index;
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {ol.Coordinate} center Center.
 * @param {number} resolution Resolution.
 * @param {number} squaredTolerance Squared tolerance.
 * @private
 */
ol.Graticule.prototype.createGraticule_ =
    function(extent, center, resolution, squaredTolerance) {

  var interval = this.getInterval_(resolution);
  if (interval == -1) {
    this.meridians_.length = this.parallels_.length = 0;
    return;
  }

  var centerLonLat = this.toLonLatTransform_(center);
  var centerLon = centerLonLat[0];
  var centerLat = centerLonLat[1];
  var maxLines = this.maxLines_;
  var cnt, idx, lat, lon;

  // Create meridians

  centerLon = Math.floor(centerLon / interval) * interval;
  lon = goog.math.clamp(centerLon, this.minLon_, this.maxLon_);

  idx = this.addMeridian_(lon, squaredTolerance, extent, 0);

  cnt = 0;
  while (lon != this.minLon_ && cnt++ < maxLines) {
    lon = Math.max(lon - interval, this.minLon_);
    idx = this.addMeridian_(lon, squaredTolerance, extent, idx);
  }

  lon = goog.math.clamp(centerLon, this.minLon_, this.maxLon_);

  cnt = 0;
  while (lon != this.maxLon_ && cnt++ < maxLines) {
    lon = Math.min(lon + interval, this.maxLon_);
    idx = this.addMeridian_(lon, squaredTolerance, extent, idx);
  }

  this.meridians_.length = idx;

  // Create parallels

  centerLat = Math.floor(centerLat / interval) * interval;
  lat = goog.math.clamp(centerLat, this.minLat_, this.maxLat_);

  idx = this.addParallel_(lat, squaredTolerance, extent, 0);

  cnt = 0;
  while (lat != this.minLat_ && cnt++ < maxLines) {
    lat = Math.max(lat - interval, this.minLat_);
    idx = this.addParallel_(lat, squaredTolerance, extent, idx);
  }

  lat = goog.math.clamp(centerLat, this.minLat_, this.maxLat_);

  cnt = 0;
  while (lat != this.maxLat_ && cnt++ < maxLines) {
    lat = Math.min(lat + interval, this.maxLat_);
    idx = this.addParallel_(lat, squaredTolerance, extent, idx);
  }

  this.parallels_.length = idx;

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
 * @return {ol.Map} The map.
 * @api
 */
ol.Graticule.prototype.getMap = function() {
  return this.map_;
};


/**
 * @param {number} lon Longitude.
 * @param {number} squaredTolerance Squared tolerance.
 * @return {ol.geom.LineString} The meridian line string.
 * @param {number} index Index.
 * @private
 */
ol.Graticule.prototype.getMeridian_ = function(lon, squaredTolerance, index) {
  goog.asserts.assert(lon >= this.minLon_);
  goog.asserts.assert(lon <= this.maxLon_);
  var flatCoordinates = ol.geom.flat.geodesic.meridian(lon,
      this.minLat_, this.maxLat_, this.projection_, squaredTolerance);
  goog.asserts.assert(flatCoordinates.length > 0);
  var lineString = goog.isDef(this.meridians_[index]) ?
      this.meridians_[index] : new ol.geom.LineString(null);
  lineString.setFlatCoordinates(ol.geom.GeometryLayout.XY, flatCoordinates);
  return lineString;
};


/**
 * @return {Array.<ol.geom.LineString>} The meridians.
 * @api
 */
ol.Graticule.prototype.getMeridians = function() {
  return this.meridians_;
};


/**
 * @param {number} lat Latitude.
 * @param {number} squaredTolerance Squared tolerance.
 * @return {ol.geom.LineString} The parallel line string.
 * @param {number} index Index.
 * @private
 */
ol.Graticule.prototype.getParallel_ = function(lat, squaredTolerance, index) {
  goog.asserts.assert(lat >= this.minLat_);
  goog.asserts.assert(lat <= this.maxLat_);
  var flatCoordinates = ol.geom.flat.geodesic.parallel(lat,
      this.minLon_, this.maxLon_, this.projection_, squaredTolerance);
  goog.asserts.assert(flatCoordinates.length > 0);
  var lineString = goog.isDef(this.parallels_[index]) ?
      this.parallels_[index] : new ol.geom.LineString(null);
  lineString.setFlatCoordinates(ol.geom.GeometryLayout.XY, flatCoordinates);
  return lineString;
};


/**
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

  var updateProjectionInfo = goog.isNull(this.projection_) ||
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
    vectorContext.drawLineStringGeometry(line, null);
  }
  for (i = 0, l = this.parallels_.length; i < l; ++i) {
    line = this.parallels_[i];
    vectorContext.drawLineStringGeometry(line, null);
  }
};


/**
 * @param {ol.proj.Projection} projection Projection.
 * @private
 */
ol.Graticule.prototype.updateProjectionInfo_ = function(projection) {
  goog.asserts.assert(!goog.isNull(projection));

  var extent = projection.getExtent();
  var worldExtent = projection.getWorldExtent();
  var maxLat = worldExtent[3];
  var maxLon = worldExtent[2];
  var minLat = worldExtent[1];
  var minLon = worldExtent[0];

  goog.asserts.assert(!goog.isNull(extent));
  goog.asserts.assert(goog.isDef(maxLat));
  goog.asserts.assert(goog.isDef(maxLon));
  goog.asserts.assert(goog.isDef(minLat));
  goog.asserts.assert(goog.isDef(minLon));

  this.maxLat_ = maxLat;
  this.maxLon_ = maxLon;
  this.minLat_ = minLat;
  this.minLon_ = minLon;

  var epsg4326Projection = ol.proj.get('EPSG:4326');

  this.fromLonLatTransform_ = ol.proj.getTransform(
      epsg4326Projection, projection);

  this.toLonLatTransform_ = ol.proj.getTransform(
      projection, epsg4326Projection);

  this.projectionCenterLonLat_ = this.toLonLatTransform_(
      ol.extent.getCenter(extent));

  this.projection_ = projection;
};


/**
 * @param {ol.Map} map Map.
 * @api
 */
ol.Graticule.prototype.setMap = function(map) {
  if (!goog.isNull(this.map_)) {
    this.map_.un(ol.render.EventType.POSTCOMPOSE,
        this.handlePostCompose_, this);
    this.map_.render();
  }
  if (!goog.isNull(map)) {
    map.on(ol.render.EventType.POSTCOMPOSE,
        this.handlePostCompose_, this);
    map.render();
  }
  this.map_ = map;
};
