/**
 * @module ol/layer/Graticule
 */
import VectorLayer from './Vector.js';
import {assign} from '../obj.js';
import {degreesToStringHDMS} from '../coordinate';
import Text from '../style/Text';
import Fill from '../style/Fill';
import Stroke from '../style/Stroke';
import LineString from '../geom/LineString.js';
import VectorSource from '../source/Vector';
import {
  equivalent as equivalentProjection,
  get as getProjection,
  getTransform,
  transformExtent
} from '../proj';
import {getCenter, intersects, equals, getIntersection, isEmpty} from '../extent';
import {clamp} from '../math';
import Style from '../style/Style';
import Feature from '../Feature';
import {bbox} from '../loadingstrategy';
import {meridian, parallel} from '../geom/flat/geodesic';
import GeometryLayout from '../geom/GeometryLayout';
import Point from '../geom/Point';
import Collection from '../Collection';


/**
 * @type {Stroke}
 * @private
 * @const
 */
const DEFAULT_STROKE_STYLE = new Stroke({
  color: 'rgba(0,0,0,0.2)'
});

/**
 * @type {Array<number>}
 * @private
 */
const INTERVALS = [
  90, 45, 30, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.01, 0.005, 0.002, 0.001
];

/**
 * @typedef {Object} GraticuleLabelDataType
 * @property {Point} geom
 * @property {string} text
 */


/**
 * @typedef {Object} Options
 * @property {number} [opacity=1] Opacity (0, 1).
 * @property {boolean} [visible=true] Visibility.
 * @property {import("../extent.js").Extent} [extent] The bounding extent for layer rendering.  The layer will not be
 * rendered outside of this extent.
 * @property {number} [zIndex] The z-index for layer rendering.  At rendering time, the layers
 * will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
 * for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
 * method was used.
 * @property {number} [minResolution] The minimum resolution (inclusive) at which this layer will be
 * visible.
 * @property {number} [maxResolution] The maximum resolution (exclusive) below which this layer will
 * be visible.
 * @property {number} [maxLines=100] The maximum number of meridians and
 * parallels from the center of the map. The default value of 100 means that at
 * most 200 meridians and 200 parallels will be displayed. The default value is
 * appropriate for conformal projections like Spherical Mercator. If you
 * increase the value, more lines will be drawn and the drawing performance will
 * decrease.
 * @property {Stroke} [strokeStyle='rgba(0,0,0,0.2)'] The
 * stroke style to use for drawing the graticule. If not provided, a not fully
 * opaque black will be used.
 * @property {number} [targetSize=100] The target size of the graticule cells,
 * in pixels.
 * @property {boolean} [showLabels=false] Render a label with the respective
 * latitude/longitude for each graticule line.
 * @property {function(number):string} [lonLabelFormatter] Label formatter for
 * longitudes. This function is called with the longitude as argument, and
 * should return a formatted string representing the longitude. By default,
 * labels are formatted as degrees, minutes, seconds and hemisphere.
 * @property {function(number):string} [latLabelFormatter] Label formatter for
 * latitudes. This function is called with the latitude as argument, and
 * should return a formatted string representing the latitude. By default,
 * labels are formatted as degrees, minutes, seconds and hemisphere.
 * @property {number} [lonLabelPosition=0] Longitude label position in fractions
 * (0..1) of view extent. 0 means at the bottom of the viewport, 1 means at the
 * top.
 * @property {number} [latLabelPosition=1] Latitude label position in fractions
 * (0..1) of view extent. 0 means at the left of the viewport, 1 means at the
 * right.
 * @property {Text} [lonLabelStyle] Longitude label text
 * style. If not provided, the following style will be used:
 * ```js
 * new Text({
 *   font: '12px Calibri,sans-serif',
 *   textBaseline: 'bottom',
 *   fill: new Fill({
 *     color: 'rgba(0,0,0,1)'
 *   }),
 *   stroke: new Stroke({
 *     color: 'rgba(255,255,255,1)',
 *     width: 3
 *   })
 * });
 * ```
 * Note that the default's `textBaseline` configuration will not work well for
 * `lonLabelPosition` configurations that position labels close to the top of
 * the viewport.
 * @property {Text} [latLabelStyle] Latitude label text style.
 * If not provided, the following style will be used:
 * ```js
 * new Text({
 *   font: '12px Calibri,sans-serif',
 *   textAlign: 'end',
 *   fill: new Fill({
 *     color: 'rgba(0,0,0,1)'
 *   }),
 *   stroke: Stroke({
 *     color: 'rgba(255,255,255,1)',
 *     width: 3
 *   })
 * });
 * ```
 * Note that the default's `textAlign` configuration will not work well for
 * `latLabelPosition` configurations that position labels close to the left of
 * the viewport.
 * @property {Array<number>} [intervals=[90, 45, 30, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.01, 0.005, 0.002, 0.001]]
 * Intervals (in degrees) for the graticule. Example to limit graticules to 30 and 10 degrees intervals:
 * ```js
 * [30, 10]
 * ```
 * @property {boolean} [wrapX=true] Whether to repeat the graticule horizontally.
 */


/**
 * @classdesc
 * Layer that renders a grid for a coordinate system.
 *
 * @fires import("../render/Event.js").RenderEvent
 * @api
 */
class Graticule extends VectorLayer {
  /**
   * @param {Options=} opt_options Options.
   */
  constructor(opt_options) {
    const options = opt_options ? opt_options : {};

    const baseOptions = assign({
      updateWhileAnimating: true,
      updateWhileInteracting: true,
      renderBuffer: 0
    }, options);

    delete baseOptions.maxLines;
    delete baseOptions.strokeStyle;
    delete baseOptions.targetSize;
    delete baseOptions.showLabels;
    delete baseOptions.lonLabelFormatter;
    delete baseOptions.latLabelFormatter;
    delete baseOptions.lonLabelPosition;
    delete baseOptions.latLabelPosition;
    delete baseOptions.lonLabelStyle;
    delete baseOptions.latLabelStyle;
    delete baseOptions.intervals;
    super(baseOptions);

    /**
     * @type {import("../proj/Projection.js").default}
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
    this.targetSize_ = options.targetSize !== undefined ? options.targetSize : 100;

    /**
     * @type {number}
     * @private
     */
    this.maxLines_ = options.maxLines !== undefined ? options.maxLines : 100;

    /**
     * @type {Array<LineString>}
     * @private
     */
    this.meridians_ = [];

    /**
     * @type {Array<LineString>}
     * @private
     */
    this.parallels_ = [];

    /**
     * @type {Stroke}
     * @private
     */
    this.strokeStyle_ = options.strokeStyle !== undefined ? options.strokeStyle : DEFAULT_STROKE_STYLE;

    /**
     * @type {import("../proj.js").TransformFunction|undefined}
     * @private
     */
    this.fromLonLatTransform_ = undefined;

    /**
     * @type {import("../proj.js").TransformFunction|undefined}
     * @private
     */
    this.toLonLatTransform_ = undefined;

    /**
     * @type {import("../coordinate.js").Coordinate}
     * @private
     */
    this.projectionCenterLonLat_ = null;

    /**
     * @type {Array<GraticuleLabelDataType>}
     * @private
     */
    this.meridiansLabels_ = null;

    /**
     * @type {Array<GraticuleLabelDataType>}
     * @private
     */
    this.parallelsLabels_ = null;

    if (options.showLabels) {

      /**
       * @type {null|function(number):string}
       * @private
       */
      this.lonLabelFormatter_ = options.lonLabelFormatter == undefined ?
        degreesToStringHDMS.bind(this, 'EW') : options.lonLabelFormatter;

      /**
       * @type {function(number):string}
       * @private
       */
      this.latLabelFormatter_ = options.latLabelFormatter == undefined ?
        degreesToStringHDMS.bind(this, 'NS') : options.latLabelFormatter;

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
       * @type {Object.<string,Style>}
       * @private
       */
      this.lonLabelStyleCache_ = {};

      /**
       * @private
       * @param {import("../Feature").default} feature Feature
       * @return {Style} style
       */
      this.lonLabelStyle_ = function(feature) {
        const label = feature.get('graticule_label');
        if (!this.lonLabelStyleCache_[label]) {
          this.lonLabelStyleCache_[label] = new Style({
            text: options.lonLabelStyle !== undefined ? options.lonLabelStyle :
              new Text({
                text: label,
                font: '12px Calibri,sans-serif',
                textBaseline: 'bottom',
                fill: new Fill({
                  color: 'rgba(0,0,0,1)'
                }),
                stroke: new Stroke({
                  color: 'rgba(255,255,255,1)',
                  width: 3
                })
              })
          });
        }
        return this.lonLabelStyleCache_[label];
      }.bind(this);

      /**
       * @type {Object.<string,Style>}
       * @private
       */
      this.latLabelStyleCache_ = {};

      /**
       * @private
       * @param {import("../Feature").default} feature Feature
       * @return {Style} style
       */
      this.latLabelStyle_ = function(feature) {
        const label = feature.get('graticule_label');
        if (!this.latLabelStyleCache_[label]) {
          this.latLabelStyleCache_[label] = new Style({
            text: options.latLabelStyle !== undefined ? options.latLabelStyle :
              new Text({
                text: label,
                font: '12px Calibri,sans-serif',
                textAlign: 'right',
                fill: new Fill({
                  color: 'rgba(0,0,0,1)'
                }),
                stroke: new Stroke({
                  color: 'rgba(255,255,255,1)',
                  width: 3
                })
              })
          });
        }
        return this.latLabelStyleCache_[label];
      }.bind(this);

      this.meridiansLabels_ = [];
      this.parallelsLabels_ = [];
    }

    /**
     * @type {Array<number>}
     * @private
     */
    this.intervals_ = options.intervals !== undefined ? options.intervals : INTERVALS;

    // use a source with a custom loader for lines & text
    this.setSource(
      new VectorSource({
        loader: this.loaderFunction.bind(this),
        strategy: bbox,
        features: new Collection(),
        overlaps: false,
        useSpatialIndex: false,
        wrapX: options.wrapX
      })
    );

    /**
     * feature pool to use when updating graticule
     * @type {Array<Feature>}
     * @private
     */
    this.featurePool_ = [];

    /**
     * @type {Style}
     * @private
     */
    this.lineStyle_ = new Style({
      stroke: this.strokeStyle_
    });

    /**
     * @type {import("../extent.js").Extent}
     */
    this.renderedExtent_ = null;

    this.setRenderOrder(null);

    this.tmpExtent_ = null;
  }

  /**
   * Update geometries in the source based on current view
   * @param {import("../extent").Extent} extent Extent
   * @param {number} resolution Resolution
   * @param {import("../proj/Projection.js").default} projection Projection
   */
  loaderFunction(extent, resolution, projection) {
    const source = this.getSource();

    // only consider the intersection between our own extent & the requested one
    const layerExtent = this.getExtent() || [-Infinity, -Infinity, Infinity, Infinity];
    const renderExtent = getIntersection(layerExtent, extent, this.tmpExtent_);

    // we should not keep track of loaded extents
    setTimeout(function() {
      source.removeLoadedExtent(extent);
    }, 0);

    if (this.renderedExtent_ && equals(this.renderedExtent_, renderExtent)) {
      return;
    }
    this.renderedExtent_ = renderExtent;

    // bail out if nothing to render
    if (isEmpty(renderExtent)) {
      return;
    }

    // update projection info
    const center = getCenter(renderExtent);
    const squaredTolerance = resolution * resolution / 4;

    const updateProjectionInfo = !this.projection_ ||
      !equivalentProjection(this.projection_, projection);

    if (updateProjectionInfo) {
      this.updateProjectionInfo_(projection);
    }

    this.createGraticule_(renderExtent, center, resolution, squaredTolerance);

    // first make sure we have enough features in the pool
    let featureCount = this.meridians_.length + this.parallels_.length;
    if (this.meridiansLabels_) {
      featureCount += this.meridiansLabels_.length;
    }
    if (this.parallelsLabels_) {
      featureCount += this.parallelsLabels_.length;
    }

    let feature;
    while (featureCount > this.featurePool_.length) {
      feature = new Feature();
      this.featurePool_.push(feature);
    }

    const featuresColl = source.getFeaturesCollection();
    featuresColl.clear();
    let poolIndex = 0;

    // add features for the lines & labels
    let i, l;
    for (i = 0, l = this.meridians_.length; i < l; ++i) {
      feature = this.featurePool_[poolIndex++];
      feature.setGeometry(this.meridians_[i]);
      feature.setStyle(this.lineStyle_);
      featuresColl.push(feature);
    }
    for (i = 0, l = this.parallels_.length; i < l; ++i) {
      feature = this.featurePool_[poolIndex++];
      feature.setGeometry(this.parallels_[i]);
      feature.setStyle(this.lineStyle_);
      featuresColl.push(feature);
    }
    let labelData;
    if (this.meridiansLabels_) {
      for (i = 0, l = this.meridiansLabels_.length; i < l; ++i) {
        labelData = this.meridiansLabels_[i];
        feature = this.featurePool_[poolIndex++];
        feature.setGeometry(labelData.geom);
        feature.setStyle(this.lonLabelStyle_);
        feature.set('graticule_label', labelData.text);
        featuresColl.push(feature);
      }
    }
    if (this.parallelsLabels_) {
      for (i = 0, l = this.parallelsLabels_.length; i < l; ++i) {
        labelData = this.parallelsLabels_[i];
        feature = this.featurePool_[poolIndex++];
        feature.setGeometry(labelData.geom);
        feature.setStyle(this.latLabelStyle_);
        feature.set('graticule_label', labelData.text);
        featuresColl.push(feature);
      }
    }
  }

  /**
   * @param {number} lon Longitude.
   * @param {number} minLat Minimal latitude.
   * @param {number} maxLat Maximal latitude.
   * @param {number} squaredTolerance Squared tolerance.
   * @param {import("../extent.js").Extent} extent Extent.
   * @param {number} index Index.
   * @return {number} Index.
   * @private
   */
  addMeridian_(lon, minLat, maxLat, squaredTolerance, extent, index) {
    const lineString = this.getMeridian_(lon, minLat, maxLat, squaredTolerance, index);
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
  }

  /**
   * @param {number} lat Latitude.
   * @param {number} minLon Minimal longitude.
   * @param {number} maxLon Maximal longitude.
   * @param {number} squaredTolerance Squared tolerance.
   * @param {import("../extent.js").Extent} extent Extent.
   * @param {number} index Index.
   * @return {number} Index.
   * @private
   */
  addParallel_(lat, minLon, maxLon, squaredTolerance, extent, index) {
    const lineString = this.getParallel_(lat, minLon, maxLon, squaredTolerance, index);
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
  }

  /**
   * @param {import("../extent.js").Extent} extent Extent.
   * @param {import("../coordinate.js").Coordinate} center Center.
   * @param {number} resolution Resolution.
   * @param {number} squaredTolerance Squared tolerance.
   * @private
   */
  createGraticule_(extent, center, resolution, squaredTolerance) {
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

    validExtent = transformExtent(validExtent, this.projection_, 'EPSG:4326');
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

  }

  /**
   * @param {number} resolution Resolution.
   * @return {number} The interval in degrees.
   * @private
   */
  getInterval_(resolution) {
    const centerLon = this.projectionCenterLonLat_[0];
    const centerLat = this.projectionCenterLonLat_[1];
    let interval = -1;
    const target = Math.pow(this.targetSize_ * resolution, 2);
    /** @type {Array<number>} **/
    const p1 = [];
    /** @type {Array<number>} **/
    const p2 = [];
    for (let i = 0, ii = this.intervals_.length; i < ii; ++i) {
      const delta = this.intervals_[i] / 2;
      p1[0] = centerLon - delta;
      p1[1] = centerLat - delta;
      p2[0] = centerLon + delta;
      p2[1] = centerLat + delta;
      this.fromLonLatTransform_(p1, p1);
      this.fromLonLatTransform_(p2, p2);
      const dist = Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2);
      if (dist <= target) {
        break;
      }
      interval = this.intervals_[i];
    }
    return interval;
  }

  /**
   * @param {number} lon Longitude.
   * @param {number} minLat Minimal latitude.
   * @param {number} maxLat Maximal latitude.
   * @param {number} squaredTolerance Squared tolerance.
   * @return {LineString} The meridian line string.
   * @param {number} index Index.
   * @private
   */
  getMeridian_(lon, minLat, maxLat, squaredTolerance, index) {
    const flatCoordinates = meridian(lon, minLat, maxLat, this.projection_, squaredTolerance);
    let lineString = this.meridians_[index];
    if (!lineString) {
      lineString = this.meridians_[index] = new LineString(flatCoordinates, GeometryLayout.XY);
    } else {
      lineString.setFlatCoordinates(GeometryLayout.XY, flatCoordinates);
      lineString.changed();
    }
    return lineString;
  }

  /**
   * @param {LineString} lineString Meridian
   * @param {import("../extent.js").Extent} extent Extent.
   * @param {number} index Index.
   * @return {Point} Meridian point.
   * @private
   */
  getMeridianPoint_(lineString, extent, index) {
    const flatCoordinates = lineString.getFlatCoordinates();
    const clampedBottom = Math.max(extent[1], flatCoordinates[1]);
    const clampedTop = Math.min(extent[3], flatCoordinates[flatCoordinates.length - 1]);
    const lat = clamp(
      extent[1] + Math.abs(extent[1] - extent[3]) * this.lonLabelPosition_,
      clampedBottom, clampedTop);
    const coordinate = [flatCoordinates[0], lat];
    let point;
    if (index in this.meridiansLabels_) {
      point = this.meridiansLabels_[index].geom;
      point.setCoordinates(coordinate);
    } else {
      point = new Point(coordinate);
    }
    return point;
  }

  /**
   * Get the list of meridians.  Meridians are lines of equal longitude.
   * @return {Array<LineString>} The meridians.
   * @api
   */
  getMeridians() {
    return this.meridians_;
  }

  /**
   * @param {number} lat Latitude.
   * @param {number} minLon Minimal longitude.
   * @param {number} maxLon Maximal longitude.
   * @param {number} squaredTolerance Squared tolerance.
   * @return {LineString} The parallel line string.
   * @param {number} index Index.
   * @private
   */
  getParallel_(lat, minLon, maxLon, squaredTolerance, index) {
    const flatCoordinates = parallel(lat, minLon, maxLon, this.projection_, squaredTolerance);
    let lineString = this.parallels_[index];
    if (!lineString) {
      lineString = new LineString(flatCoordinates, GeometryLayout.XY);
    } else {
      lineString.setFlatCoordinates(GeometryLayout.XY, flatCoordinates);
      lineString.changed();
    }
    return lineString;
  }


  /**
   * @param {LineString} lineString Parallels.
   * @param {import("../extent.js").Extent} extent Extent.
   * @param {number} index Index.
   * @return {Point} Parallel point.
   * @private
   */
  getParallelPoint_(lineString, extent, index) {
    const flatCoordinates = lineString.getFlatCoordinates();
    const clampedLeft = Math.max(extent[0], flatCoordinates[0]);
    const clampedRight = Math.min(extent[2], flatCoordinates[flatCoordinates.length - 2]);
    const lon = clamp(
      extent[0] + Math.abs(extent[0] - extent[2]) * this.latLabelPosition_,
      clampedLeft, clampedRight);
    const coordinate = [lon, flatCoordinates[1]];
    let point;
    if (index in this.parallelsLabels_) {
      point = this.parallelsLabels_[index].geom;
      point.setCoordinates(coordinate);
    } else {
      point = new Point(coordinate);
    }
    return point;
  }

  /**
   * Get the list of parallels.  Parallels are lines of equal latitude.
   * @return {Array<LineString>} The parallels.
   * @api
   */
  getParallels() {
    return this.parallels_;
  }

  /**
   * @param {import("../proj/Projection.js").default} projection Projection.
   * @private
   */
  updateProjectionInfo_(projection) {
    const epsg4326Projection = getProjection('EPSG:4326');

    const worldExtent = projection.getWorldExtent();
    const worldExtentP = transformExtent(worldExtent, epsg4326Projection, projection);

    this.maxLat_ = worldExtent[3];
    this.maxLon_ = worldExtent[2];
    this.minLat_ = worldExtent[1];
    this.minLon_ = worldExtent[0];

    this.maxLatP_ = worldExtentP[3];
    this.maxLonP_ = worldExtentP[2];
    this.minLatP_ = worldExtentP[1];
    this.minLonP_ = worldExtentP[0];

    this.fromLonLatTransform_ = getTransform(epsg4326Projection, projection);

    this.toLonLatTransform_ = getTransform(projection, epsg4326Projection);

    this.projectionCenterLonLat_ = this.toLonLatTransform_(getCenter(projection.getExtent()));

    this.projection_ = projection;
  }
}


export default Graticule;
