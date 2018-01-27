/**
 * @module ol/Graticule
 */
import _ol_coordinate_ from './coordinate.js';
import {intersects, getCenter} from './extent.js';
import GeometryLayout from './geom/GeometryLayout.js';
import LineString from './geom/LineString.js';
import Point from './geom/Point.js';
import {meridian, parallel} from './geom/flat/geodesic.js';
import {clamp} from './math.js';
import {get as getProjection, equivalent as equivalentProjection, getTransform, transformExtent} from './proj.js';
import RenderEventType from './render/EventType.js';
import Fill from './style/Fill.js';
import Stroke from './style/Stroke.js';
import Text from './style/Text.js';


/**
 * @type {ol.style.Stroke}
 * @private
 * @const
 */
const DEFAULT_STROKE_STYLE = new Stroke({
  color: 'rgba(0,0,0,0.2)'
});

/**
 * TODO can be configurable
 * @type {Array.<number>}
 * @private
 */
const INTERVALS = [
  90, 45, 30, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.01, 0.005, 0.002, 0.001
];


/**
 * @typedef {{map: (ol.PluggableMap|undefined),
 *     maxLines: (number|undefined),
 *     strokeStyle: (ol.style.Stroke|undefined),
 *     targetSize: (number|undefined),
 *     showLabels: (boolean|undefined),
 *     lonLabelFormatter: (undefined|function(number):string),
 *     latLabelFormatter: (undefined|function(number):string),
 *     lonLabelPosition: (number|undefined),
 *     latLabelPosition: (number|undefined),
 *     lonLabelStyle: (ol.style.Text|undefined),
 *     latLabelStyle: (ol.style.Text|undefined)}}
 */
export let GraticuleOptions;


/**
 * Render a grid for a coordinate system on a map.
 * @constructor
 * @param {GraticuleOptions=} opt_options Options.
 * @param {ol.PluggableMap|undefined} opt_options.map Reference to an `ol.Map`
 *     object.
 * @param {number|undefined} opt_options.maxLines The maximum number of
 *     meridians and parallels from the center of the
 *     map. The default value is 100, which means that at most 200 meridians
 *     and 200 parallels will be displayed. The default value is appropriate
 *     for conformal projections like Spherical Mercator. If you increase
 *     the value more lines will be drawn and the drawing performance will
 *     decrease.
 * @param {ol.style.Stroke|undefined} opt_options.strokeStyle The stroke style
 *     to use for drawing the graticule. If not provided, the
 *     lines will be drawn with `rgba(0,0,0,0.2)`, a not fully opaque black.
 * @param {number|undefined} opt_options.targetSize The target size of the
 *     graticule cells, in pixels. Default value is 100 pixels.
 * @param {boolean|undefined} opt_options.showLabels Render a label with the
 *     respective latitude/longitude for each graticule line. Default is false.
 * @param {undefined|function(number):string} opt_options.lonLabelFormatter
 *     Label formatter for longitudes. This function is called with the
 *     longitude as argument, and should return a formatted string representing
 *     the longitude. By default, labels are formatted as degrees, minutes,
 *     seconds and hemisphere.
 * @param {number|undefined} opt_options.lonLabelPosition Longitude label
 *     position in fractions (0..1) of view extent. 0 means at the bottom of the
 *     viewport, 1 means at the top. Default is 0.
 * @param {number|undefined} opt_options.latLabelPosition Latitude label
 *     position in fractions (0..1) of view extent. 0 means at the left of the
 *     viewport, 1 means at the right. Default is 1.
 * @param {ol.style.Text|undefined} options.lonLabelStyle Longitude label text
 *     style. The default is
 *     ```js
 *     new ol.style.Text({
 *       font: '12px Calibri,sans-serif',
 *       textBaseline: 'bottom',
 *       fill: new ol.style.Fill({
 *         color: 'rgba(0,0,0,1)'
 *       }),
 *       stroke: new ol.style.Stroke({
 *         color: 'rgba(255,255,255,1)',
 *         width: 3
 *       })
 *     });
 *     ```
 *     Note that the default's `textBaseline` configuration will not work well
 *     for `lonLabelPosition` configurations that position labels close to the
 *     top of the viewport.
 * @param {ol.style.Text|undefined} opt_options.latLabelStyle Latitude label
 *     text style. The default is
 *     ```js
 *     new ol.style.Text({
 *       font: '12px Calibri,sans-serif',
 *       textAlign: 'end',
 *       fill: new ol.style.Fill({
 *         color: 'rgba(0,0,0,1)'
 *       }),
 *       stroke: new ol.style.Stroke({
 *         color: 'rgba(255,255,255,1)',
 *         width: 3
 *       })
 *     });
 *     ```
 *     Note that the default's `textAlign` configuration will not work well for
 *     `latLabelPosition` configurations that position labels close to the left
 *     of the viewport.
 * @api
 */
const Graticule = function(opt_options) {
  const options = opt_options || {};

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
  this.strokeStyle_ = options.strokeStyle !== undefined ? options.strokeStyle : DEFAULT_STROKE_STYLE;

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
    const degreesToString = _ol_coordinate_.degreesToStringHDMS;

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
      new Text({
        font: '12px Calibri,sans-serif',
        textBaseline: 'bottom',
        fill: new Fill({
          color: 'rgba(0,0,0,1)'
        }),
        stroke: new Stroke({
          color: 'rgba(255,255,255,1)',
          width: 3
        })
      });

    /**
     * @type {ol.style.Text}
     * @private
     */
    this.latLabelStyle_ = options.latLabelStyle !== undefined ? options.latLabelStyle :
      new Text({
        font: '12px Calibri,sans-serif',
        textAlign: 'end',
        fill: new Fill({
          color: 'rgba(0,0,0,1)'
        }),
        stroke: new Stroke({
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
 * @param {number} lon Longitude.
 * @param {number} minLat Minimal latitude.
 * @param {number} maxLat Maximal latitude.
 * @param {number} squaredTolerance Squared tolerance.
 * @param {ol.Extent} extent Extent.
 * @param {number} index Index.
 * @return {number} Index.
 * @private
 */
Graticule.prototype.addMeridian_ = function(lon, minLat, maxLat, squaredTolerance, extent, index) {
  const lineString = this.getMeridian_(lon, minLat, maxLat,
    squaredTolerance, index);
  if (intersects(lineString.getExtent(), extent)) {
    if (this.meridiansLabels_) {
      const textPoint = this.getMeridianPoint_(lineString, extent, index);
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
Graticule.prototype.getMeridianPoint_ = function(lineString, extent, index) {
  const flatCoordinates = lineString.getFlatCoordinates();
  const clampedBottom = Math.max(extent[1], flatCoordinates[1]);
  const clampedTop = Math.min(extent[3], flatCoordinates[flatCoordinates.length - 1]);
  const lat = clamp(
    extent[1] + Math.abs(extent[1] - extent[3]) * this.lonLabelPosition_,
    clampedBottom, clampedTop);
  const coordinate = [flatCoordinates[0], lat];
  const point = this.meridiansLabels_[index] !== undefined ?
    this.meridiansLabels_[index].geom : new Point(null);
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
Graticule.prototype.addParallel_ = function(lat, minLon, maxLon, squaredTolerance, extent, index) {
  const lineString = this.getParallel_(lat, minLon, maxLon, squaredTolerance,
    index);
  if (intersects(lineString.getExtent(), extent)) {
    if (this.parallelsLabels_) {
      const textPoint = this.getParallelPoint_(lineString, extent, index);
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
Graticule.prototype.getParallelPoint_ = function(lineString, extent, index) {
  const flatCoordinates = lineString.getFlatCoordinates();
  const clampedLeft = Math.max(extent[0], flatCoordinates[0]);
  const clampedRight = Math.min(extent[2], flatCoordinates[flatCoordinates.length - 2]);
  const lon = clamp(
    extent[0] + Math.abs(extent[0] - extent[2]) * this.latLabelPosition_,
    clampedLeft, clampedRight);
  const coordinate = [lon, flatCoordinates[1]];
  const point = this.parallelsLabels_[index] !== undefined ?
    this.parallelsLabels_[index].geom : new Point(null);
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
Graticule.prototype.createGraticule_ = function(extent, center, resolution, squaredTolerance) {

  const interval = this.getInterval_(resolution);
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

  const centerLonLat = this.toLonLatTransform_(center);
  let centerLon = centerLonLat[0];
  let centerLat = centerLonLat[1];
  const maxLines = this.maxLines_;
  let cnt, idx, lat, lon;

  let validExtent = [
    Math.max(extent[0], this.minLonP_),
    Math.max(extent[1], this.minLatP_),
    Math.min(extent[2], this.maxLonP_),
    Math.min(extent[3], this.maxLatP_)
  ];

  validExtent = transformExtent(validExtent, this.projection_,
    'EPSG:4326');
  const maxLat = validExtent[3];
  const maxLon = validExtent[2];
  const minLat = validExtent[1];
  const minLon = validExtent[0];

  // Create meridians

  centerLon = Math.floor(centerLon / interval) * interval;
  lon = clamp(centerLon, this.minLon_, this.maxLon_);

  idx = this.addMeridian_(lon, minLat, maxLat, squaredTolerance, extent, 0);

  cnt = 0;
  while (lon != this.minLon_ && cnt++ < maxLines) {
    lon = Math.max(lon - interval, this.minLon_);
    idx = this.addMeridian_(lon, minLat, maxLat, squaredTolerance, extent, idx);
  }

  lon = clamp(centerLon, this.minLon_, this.maxLon_);

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
  lat = clamp(centerLat, this.minLat_, this.maxLat_);

  idx = this.addParallel_(lat, minLon, maxLon, squaredTolerance, extent, 0);

  cnt = 0;
  while (lat != this.minLat_ && cnt++ < maxLines) {
    lat = Math.max(lat - interval, this.minLat_);
    idx = this.addParallel_(lat, minLon, maxLon, squaredTolerance, extent, idx);
  }

  lat = clamp(centerLat, this.minLat_, this.maxLat_);

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
Graticule.prototype.getInterval_ = function(resolution) {
  const centerLon = this.projectionCenterLonLat_[0];
  const centerLat = this.projectionCenterLonLat_[1];
  let interval = -1;
  let i, ii, delta, dist;
  const target = Math.pow(this.targetSize_ * resolution, 2);
  /** @type {Array.<number>} **/
  const p1 = [];
  /** @type {Array.<number>} **/
  const p2 = [];
  for (i = 0, ii = INTERVALS.length; i < ii; ++i) {
    delta = INTERVALS[i] / 2;
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
    interval = INTERVALS[i];
  }
  return interval;
};


/**
 * Get the map associated with this graticule.
 * @return {ol.PluggableMap} The map.
 * @api
 */
Graticule.prototype.getMap = function() {
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
Graticule.prototype.getMeridian_ = function(lon, minLat, maxLat, squaredTolerance, index) {
  const flatCoordinates = meridian(lon,
    minLat, maxLat, this.projection_, squaredTolerance);
  const lineString = this.meridians_[index] !== undefined ?
    this.meridians_[index] : new LineString(null);
  lineString.setFlatCoordinates(GeometryLayout.XY, flatCoordinates);
  return lineString;
};


/**
 * Get the list of meridians.  Meridians are lines of equal longitude.
 * @return {Array.<ol.geom.LineString>} The meridians.
 * @api
 */
Graticule.prototype.getMeridians = function() {
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
Graticule.prototype.getParallel_ = function(lat, minLon, maxLon, squaredTolerance, index) {
  const flatCoordinates = parallel(lat,
    minLon, maxLon, this.projection_, squaredTolerance);
  const lineString = this.parallels_[index] !== undefined ?
    this.parallels_[index] : new LineString(null);
  lineString.setFlatCoordinates(GeometryLayout.XY, flatCoordinates);
  return lineString;
};


/**
 * Get the list of parallels.  Parallels are lines of equal latitude.
 * @return {Array.<ol.geom.LineString>} The parallels.
 * @api
 */
Graticule.prototype.getParallels = function() {
  return this.parallels_;
};


/**
 * @param {ol.render.Event} e Event.
 * @private
 */
Graticule.prototype.handlePostCompose_ = function(e) {
  const vectorContext = e.vectorContext;
  const frameState = e.frameState;
  const extent = frameState.extent;
  const viewState = frameState.viewState;
  const center = viewState.center;
  const projection = viewState.projection;
  const resolution = viewState.resolution;
  const pixelRatio = frameState.pixelRatio;
  const squaredTolerance =
      resolution * resolution / (4 * pixelRatio * pixelRatio);

  const updateProjectionInfo = !this.projection_ ||
      !equivalentProjection(this.projection_, projection);

  if (updateProjectionInfo) {
    this.updateProjectionInfo_(projection);
  }

  this.createGraticule_(extent, center, resolution, squaredTolerance);

  // Draw the lines
  vectorContext.setFillStrokeStyle(null, this.strokeStyle_);
  let i, l, line;
  for (i = 0, l = this.meridians_.length; i < l; ++i) {
    line = this.meridians_[i];
    vectorContext.drawGeometry(line);
  }
  for (i = 0, l = this.parallels_.length; i < l; ++i) {
    line = this.parallels_[i];
    vectorContext.drawGeometry(line);
  }
  let labelData;
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
Graticule.prototype.updateProjectionInfo_ = function(projection) {
  const epsg4326Projection = getProjection('EPSG:4326');

  const extent = projection.getExtent();
  const worldExtent = projection.getWorldExtent();
  const worldExtentP = transformExtent(worldExtent,
    epsg4326Projection, projection);

  const maxLat = worldExtent[3];
  const maxLon = worldExtent[2];
  const minLat = worldExtent[1];
  const minLon = worldExtent[0];

  const maxLatP = worldExtentP[3];
  const maxLonP = worldExtentP[2];
  const minLatP = worldExtentP[1];
  const minLonP = worldExtentP[0];

  this.maxLat_ = maxLat;
  this.maxLon_ = maxLon;
  this.minLat_ = minLat;
  this.minLon_ = minLon;

  this.maxLatP_ = maxLatP;
  this.maxLonP_ = maxLonP;
  this.minLatP_ = minLatP;
  this.minLonP_ = minLonP;


  this.fromLonLatTransform_ = getTransform(epsg4326Projection, projection);

  this.toLonLatTransform_ = getTransform(projection, epsg4326Projection);

  this.projectionCenterLonLat_ = this.toLonLatTransform_(getCenter(extent));

  this.projection_ = projection;
};


/**
 * Set the map for this graticule.  The graticule will be rendered on the
 * provided map.
 * @param {ol.PluggableMap} map Map.
 * @api
 */
Graticule.prototype.setMap = function(map) {
  if (this.map_) {
    this.map_.un(RenderEventType.POSTCOMPOSE, this.handlePostCompose_, this);
    this.map_.render();
  }
  if (map) {
    map.on(RenderEventType.POSTCOMPOSE, this.handlePostCompose_, this);
    map.render();
  }
  this.map_ = map;
};
export default Graticule;
