/**
 * @module ol/layer/Graticule
 */
import Collection from '../Collection.js';
import Feature from '../Feature.js';
import {degreesToStringHDMS} from '../coordinate.js';
import {
  applyTransform,
  approximatelyEquals,
  containsCoordinate,
  containsExtent,
  equals,
  getCenter,
  getIntersection,
  getWidth,
  intersects,
  isEmpty,
  wrapX as wrapExtentX,
} from '../extent.js';
import LineString from '../geom/LineString.js';
import Point from '../geom/Point.js';
import {meridian, parallel} from '../geom/flat/geodesic.js';
import {clamp} from '../math.js';
import {
  equivalent as equivalentProjection,
  get as getProjection,
  getTransform,
} from '../proj.js';
import EventType from '../render/EventType.js';
import {getVectorContext} from '../render.js';
import VectorSource from '../source/Vector.js';
import Fill from '../style/Fill.js';
import Stroke from '../style/Stroke.js';
import Style from '../style/Style.js';
import Text from '../style/Text.js';
import VectorLayer from './Vector.js';

/**
 * @type {Stroke}
 * @private
 * @const
 */
const DEFAULT_STROKE_STYLE = new Stroke({
  color: 'rgba(0,0,0,0.2)',
});

/**
 * @type {Array<number>}
 * @private
 */
const INTERVALS = [
  90,
  45,
  30,
  20,
  10,
  5,
  2,
  1,
  30 / 60,
  20 / 60,
  10 / 60,
  5 / 60,
  2 / 60,
  1 / 60,
  30 / 3600,
  20 / 3600,
  10 / 3600,
  5 / 3600,
  2 / 3600,
  1 / 3600,
];

/**
 * @typedef {Object} GraticuleLabelDataType
 * @property {Point} geom Geometry.
 * @property {string} text Text.
 */

/**
 * @typedef {Object} Options
 * @property {string} [className='ol-layer'] A CSS class name to set to the layer element.
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
 * @property {number} [minZoom] The minimum view zoom level (exclusive) above which this layer will be
 * visible.
 * @property {number} [maxZoom] The maximum view zoom level (inclusive) at which this layer will
 * be visible.
 * @property {number} [maxLines=100] The maximum number of meridians and
 * parallels from the center of the map. The default value of 100 means that at
 * most 200 meridians and 200 parallels will be displayed. The default value is
 * appropriate for conformal projections like Spherical Mercator. If you
 * increase the value, more lines will be drawn and the drawing performance will
 * decrease.
 * @property {Stroke} [strokeStyle] The
 * stroke style to use for drawing the graticule. If not provided, the following stroke will be used:
 * ```js
 * new Stroke({
 *   color: 'rgba(0, 0, 0, 0.2)' // a not fully opaque black
 * });
 * ```
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
 * @property {Array<number>} [intervals=[90, 45, 30, 20, 10, 5, 2, 1, 30/60, 20/60, 10/60, 5/60, 2/60, 1/60, 30/3600, 20/3600, 10/3600, 5/3600, 2/3600, 1/3600]]
 * Intervals (in degrees) for the graticule. Example to limit graticules to 30 and 10 degrees intervals:
 * ```js
 * [30, 10]
 * ```
 * @property {boolean} [wrapX=true] Whether to repeat the graticule horizontally.
 * @property {Object<string, *>} [properties] Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
 */

/**
 * @classdesc
 * Layer that renders a grid for a coordinate system (currently only EPSG:4326 is supported).
 * Note that the view projection must define both extent and worldExtent.
 *
 * @fires import("../render/Event.js").RenderEvent#prerender
 * @fires import("../render/Event.js").RenderEvent#postrender
 * @extends {VectorLayer<VectorSource<Feature>>}
 * @api
 */
class Graticule extends VectorLayer {
  /**
   * @param {Options} [options] Options.
   */
  constructor(options) {
    options = options ? options : {};

    const baseOptions = Object.assign(
      {
        updateWhileAnimating: true,
        updateWhileInteracting: true,
        renderBuffer: 0,
      },
      options,
    );

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
    this.maxX_ = Infinity;

    /**
     * @type {number}
     * @private
     */
    this.maxY_ = Infinity;

    /**
     * @type {number}
     * @private
     */
    this.minX_ = -Infinity;

    /**
     * @type {number}
     * @private
     */
    this.minY_ = -Infinity;

    /**
     * @type {number}
     * @private
     */
    this.targetSize_ =
      options.targetSize !== undefined ? options.targetSize : 100;

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
    this.strokeStyle_ =
      options.strokeStyle !== undefined
        ? options.strokeStyle
        : DEFAULT_STROKE_STYLE;

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
     * @type {import("../coordinate.js").Coordinate}
     * @private
     */
    this.bottomLeft_ = null;

    /**
     * @type {import("../coordinate.js").Coordinate}
     * @private
     */
    this.bottomRight_ = null;

    /**
     * @type {import("../coordinate.js").Coordinate}
     * @private
     */
    this.topLeft_ = null;

    /**
     * @type {import("../coordinate.js").Coordinate}
     * @private
     */
    this.topRight_ = null;

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
      this.lonLabelFormatter_ =
        options.lonLabelFormatter == undefined
          ? degreesToStringHDMS.bind(this, 'EW')
          : options.lonLabelFormatter;

      /**
       * @type {function(number):string}
       * @private
       */
      this.latLabelFormatter_ =
        options.latLabelFormatter == undefined
          ? degreesToStringHDMS.bind(this, 'NS')
          : options.latLabelFormatter;

      /**
       * Longitude label position in fractions (0..1) of view extent. 0 means
       * bottom, 1 means top.
       * @type {number}
       * @private
       */
      this.lonLabelPosition_ =
        options.lonLabelPosition == undefined ? 0 : options.lonLabelPosition;

      /**
       * Latitude Label position in fractions (0..1) of view extent. 0 means left, 1
       * means right.
       * @type {number}
       * @private
       */
      this.latLabelPosition_ =
        options.latLabelPosition == undefined ? 1 : options.latLabelPosition;

      /**
       * @type {Style}
       * @private
       */
      this.lonLabelStyleBase_ = new Style({
        text:
          options.lonLabelStyle !== undefined
            ? options.lonLabelStyle.clone()
            : new Text({
                font: '12px Calibri,sans-serif',
                textBaseline: 'bottom',
                fill: new Fill({
                  color: 'rgba(0,0,0,1)',
                }),
                stroke: new Stroke({
                  color: 'rgba(255,255,255,1)',
                  width: 3,
                }),
              }),
      });

      /**
       * @private
       * @param {import("../Feature").default} feature Feature
       * @return {Style} style
       */
      this.lonLabelStyle_ = (feature) => {
        const label = feature.get('graticule_label');
        this.lonLabelStyleBase_.getText().setText(label);
        return this.lonLabelStyleBase_;
      };

      /**
       * @type {Style}
       * @private
       */
      this.latLabelStyleBase_ = new Style({
        text:
          options.latLabelStyle !== undefined
            ? options.latLabelStyle.clone()
            : new Text({
                font: '12px Calibri,sans-serif',
                textAlign: 'right',
                fill: new Fill({
                  color: 'rgba(0,0,0,1)',
                }),
                stroke: new Stroke({
                  color: 'rgba(255,255,255,1)',
                  width: 3,
                }),
              }),
      });

      /**
       * @private
       * @param {import("../Feature").default} feature Feature
       * @return {Style} style
       */
      this.latLabelStyle_ = (feature) => {
        const label = feature.get('graticule_label');
        this.latLabelStyleBase_.getText().setText(label);
        return this.latLabelStyleBase_;
      };

      this.meridiansLabels_ = [];
      this.parallelsLabels_ = [];

      this.addEventListener(EventType.POSTRENDER, this.drawLabels_.bind(this));
    }

    /**
     * @type {Array<number>}
     * @private
     */
    this.intervals_ =
      options.intervals !== undefined ? options.intervals : INTERVALS;

    // use a source with a custom loader for lines & text
    this.setSource(
      new VectorSource({
        loader: this.loaderFunction.bind(this),
        strategy: this.strategyFunction.bind(this),
        features: new Collection(),
        overlaps: false,
        useSpatialIndex: false,
        wrapX: options.wrapX,
      }),
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
      stroke: this.strokeStyle_,
    });

    /**
     * @type {?import("../extent.js").Extent}
     * @private
     */
    this.loadedExtent_ = null;

    /**
     * @type {?import("../extent.js").Extent}
     * @private
     */
    this.renderedExtent_ = null;

    /**
     * @type {?number}
     * @private
     */
    this.renderedResolution_ = null;

    this.setRenderOrder(null);
  }

  /**
   * Strategy function for loading features based on the view's extent and
   * resolution.
   * @param {import("../extent.js").Extent} extent Extent.
   * @param {number} resolution Resolution.
   * @return {Array<import("../extent.js").Extent>} Extents.
   */
  strategyFunction(extent, resolution) {
    // extents may be passed in different worlds, to avoid endless loop we use only one
    let realWorldExtent = extent.slice();
    if (this.projection_ && this.getSource().getWrapX()) {
      wrapExtentX(realWorldExtent, this.projection_);
    }
    if (this.loadedExtent_) {
      if (
        approximatelyEquals(this.loadedExtent_, realWorldExtent, resolution)
      ) {
        // make sure result is exactly equal to previous extent
        realWorldExtent = this.loadedExtent_.slice();
      } else {
        // we should not keep track of loaded extents
        this.getSource().removeLoadedExtent(this.loadedExtent_);
      }
    }
    return [realWorldExtent];
  }

  /**
   * Update geometries in the source based on current view
   * @param {import("../extent").Extent} extent Extent
   * @param {number} resolution Resolution
   * @param {import("../proj/Projection.js").default} projection Projection
   */
  loaderFunction(extent, resolution, projection) {
    this.loadedExtent_ = extent;
    const source = this.getSource();

    // only consider the intersection between our own extent & the requested one
    const layerExtent = this.getExtent() || [
      -Infinity,
      -Infinity,
      Infinity,
      Infinity,
    ];
    const renderExtent = getIntersection(layerExtent, extent);

    if (
      this.renderedExtent_ &&
      equals(this.renderedExtent_, renderExtent) &&
      this.renderedResolution_ === resolution
    ) {
      return;
    }
    this.renderedExtent_ = renderExtent;
    this.renderedResolution_ = resolution;

    // bail out if nothing to render
    if (isEmpty(renderExtent)) {
      return;
    }

    // update projection info
    const center = getCenter(renderExtent);
    const squaredTolerance = (resolution * resolution) / 4;

    const updateProjectionInfo =
      !this.projection_ || !equivalentProjection(this.projection_, projection);

    if (updateProjectionInfo) {
      this.updateProjectionInfo_(projection);
    }

    this.createGraticule_(renderExtent, center, resolution, squaredTolerance);

    // first make sure we have enough features in the pool
    let featureCount = this.meridians_.length + this.parallels_.length;
    if (this.meridiansLabels_) {
      featureCount += this.meridians_.length;
    }
    if (this.parallelsLabels_) {
      featureCount += this.parallels_.length;
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
    const lineString = this.getMeridian_(
      lon,
      minLat,
      maxLat,
      squaredTolerance,
      index,
    );
    if (intersects(lineString.getExtent(), extent)) {
      if (this.meridiansLabels_) {
        const text = this.lonLabelFormatter_(lon);
        if (index in this.meridiansLabels_) {
          this.meridiansLabels_[index].text = text;
        } else {
          this.meridiansLabels_[index] = {
            geom: new Point([]),
            text: text,
          };
        }
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
    const lineString = this.getParallel_(
      lat,
      minLon,
      maxLon,
      squaredTolerance,
      index,
    );
    if (intersects(lineString.getExtent(), extent)) {
      if (this.parallelsLabels_) {
        const text = this.latLabelFormatter_(lat);
        if (index in this.parallelsLabels_) {
          this.parallelsLabels_[index].text = text;
        } else {
          this.parallelsLabels_[index] = {
            geom: new Point([]),
            text: text,
          };
        }
      }
      this.parallels_[index++] = lineString;
    }
    return index;
  }

  /**
   * @param {import("../render/Event.js").default} event Render event.
   * @private
   */
  drawLabels_(event) {
    const rotation = event.frameState.viewState.rotation;
    const resolution = event.frameState.viewState.resolution;
    const size = event.frameState.size;
    const extent = event.frameState.extent;
    const rotationCenter = getCenter(extent);
    let rotationExtent = extent;
    if (rotation) {
      const unrotatedWidth = size[0] * resolution;
      const unrotatedHeight = size[1] * resolution;
      rotationExtent = [
        rotationCenter[0] - unrotatedWidth / 2,
        rotationCenter[1] - unrotatedHeight / 2,
        rotationCenter[0] + unrotatedWidth / 2,
        rotationCenter[1] + unrotatedHeight / 2,
      ];
    }

    let startWorld = 0;
    let endWorld = 0;
    let labelsAtStart = this.latLabelPosition_ < 0.5;
    const projectionExtent = this.projection_.getExtent();
    const worldWidth = getWidth(projectionExtent);
    if (
      this.getSource().getWrapX() &&
      this.projection_.canWrapX() &&
      !containsExtent(projectionExtent, extent)
    ) {
      startWorld = Math.floor((extent[0] - projectionExtent[0]) / worldWidth);
      endWorld = Math.ceil((extent[2] - projectionExtent[2]) / worldWidth);
      const inverted = Math.abs(rotation) > Math.PI / 2;
      labelsAtStart = labelsAtStart !== inverted;
    }
    const vectorContext = getVectorContext(event);

    for (let world = startWorld; world <= endWorld; ++world) {
      let poolIndex = this.meridians_.length + this.parallels_.length;
      let feature, index, l, textPoint;

      if (this.meridiansLabels_) {
        for (index = 0, l = this.meridiansLabels_.length; index < l; ++index) {
          const lineString = this.meridians_[index];
          if (!rotation && world === 0) {
            textPoint = this.getMeridianPoint_(lineString, extent, index);
          } else {
            const clone = lineString.clone();
            clone.translate(world * worldWidth, 0);
            clone.rotate(-rotation, rotationCenter);
            textPoint = this.getMeridianPoint_(clone, rotationExtent, index);
            textPoint.rotate(rotation, rotationCenter);
          }
          feature = this.featurePool_[poolIndex++];
          feature.setGeometry(textPoint);
          feature.set('graticule_label', this.meridiansLabels_[index].text);
          vectorContext.drawFeature(feature, this.lonLabelStyle_(feature));
        }
      }
      if (this.parallelsLabels_) {
        if (
          (world === startWorld && labelsAtStart) ||
          (world === endWorld && !labelsAtStart)
        ) {
          for (index = 0, l = this.parallels_.length; index < l; ++index) {
            const lineString = this.parallels_[index];
            if (!rotation && world === 0) {
              textPoint = this.getParallelPoint_(lineString, extent, index);
            } else {
              const clone = lineString.clone();
              clone.translate(world * worldWidth, 0);
              clone.rotate(-rotation, rotationCenter);
              textPoint = this.getParallelPoint_(clone, rotationExtent, index);
              textPoint.rotate(rotation, rotationCenter);
            }
            feature = this.featurePool_[poolIndex++];
            feature.setGeometry(textPoint);
            feature.set('graticule_label', this.parallelsLabels_[index].text);
            vectorContext.drawFeature(feature, this.latLabelStyle_(feature));
          }
        }
      }
    }
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
      this.meridians_.length = 0;
      this.parallels_.length = 0;
      if (this.meridiansLabels_) {
        this.meridiansLabels_.length = 0;
      }
      if (this.parallelsLabels_) {
        this.parallelsLabels_.length = 0;
      }
      return;
    }

    let wrapX = false;
    const projectionExtent = this.projection_.getExtent();
    const worldWidth = getWidth(projectionExtent);
    if (
      this.getSource().getWrapX() &&
      this.projection_.canWrapX() &&
      !containsExtent(projectionExtent, extent)
    ) {
      if (getWidth(extent) >= worldWidth) {
        extent[0] = projectionExtent[0];
        extent[2] = projectionExtent[2];
      } else {
        wrapX = true;
      }
    }

    // Constrain the center to fit into the extent available to the graticule

    const validCenterP = [
      clamp(center[0], this.minX_, this.maxX_),
      clamp(center[1], this.minY_, this.maxY_),
    ];

    // Transform the center to lon lat
    // Some projections may have a void area at the poles
    // so replace any NaN latitudes with the min or max value closest to a pole

    const centerLonLat = this.toLonLatTransform_(validCenterP);
    if (isNaN(centerLonLat[1])) {
      centerLonLat[1] =
        Math.abs(this.maxLat_) >= Math.abs(this.minLat_)
          ? this.maxLat_
          : this.minLat_;
    }
    let centerLon = clamp(centerLonLat[0], this.minLon_, this.maxLon_);
    let centerLat = clamp(centerLonLat[1], this.minLat_, this.maxLat_);
    const maxLines = this.maxLines_;
    let cnt, idx, lat, lon;

    // Limit the extent to fit into the extent available to the graticule

    let validExtentP = extent;
    if (!wrapX) {
      validExtentP = [
        clamp(extent[0], this.minX_, this.maxX_),
        clamp(extent[1], this.minY_, this.maxY_),
        clamp(extent[2], this.minX_, this.maxX_),
        clamp(extent[3], this.minY_, this.maxY_),
      ];
    }

    // Transform the extent to get the lon lat ranges for the edges of the extent

    const validExtent = applyTransform(
      validExtentP,
      this.toLonLatTransform_,
      undefined,
      8,
    );

    let maxLat = validExtent[3];
    let maxLon = validExtent[2];
    let minLat = validExtent[1];
    let minLon = validExtent[0];

    if (!wrapX) {
      // Check if extremities of the world extent lie inside the extent
      // (for example the pole in a polar projection)
      // and extend the extent as appropriate

      if (containsCoordinate(validExtentP, this.bottomLeft_)) {
        minLon = this.minLon_;
        minLat = this.minLat_;
      }
      if (containsCoordinate(validExtentP, this.bottomRight_)) {
        maxLon = this.maxLon_;
        minLat = this.minLat_;
      }
      if (containsCoordinate(validExtentP, this.topLeft_)) {
        minLon = this.minLon_;
        maxLat = this.maxLat_;
      }
      if (containsCoordinate(validExtentP, this.topRight_)) {
        maxLon = this.maxLon_;
        maxLat = this.maxLat_;
      }

      // The transformed center may also extend the lon lat ranges used for rendering

      maxLat = clamp(maxLat, centerLat, this.maxLat_);
      maxLon = clamp(maxLon, centerLon, this.maxLon_);
      minLat = clamp(minLat, this.minLat_, centerLat);
      minLon = clamp(minLon, this.minLon_, centerLon);
    }

    // Create meridians

    centerLon = Math.floor(centerLon / interval) * interval;
    lon = clamp(centerLon, this.minLon_, this.maxLon_);

    idx = this.addMeridian_(lon, minLat, maxLat, squaredTolerance, extent, 0);

    cnt = 0;
    if (wrapX) {
      while ((lon -= interval) >= minLon && cnt++ < maxLines) {
        idx = this.addMeridian_(
          lon,
          minLat,
          maxLat,
          squaredTolerance,
          extent,
          idx,
        );
      }
    } else {
      while (lon != this.minLon_ && cnt++ < maxLines) {
        lon = Math.max(lon - interval, this.minLon_);
        idx = this.addMeridian_(
          lon,
          minLat,
          maxLat,
          squaredTolerance,
          extent,
          idx,
        );
      }
    }

    lon = clamp(centerLon, this.minLon_, this.maxLon_);

    cnt = 0;
    if (wrapX) {
      while ((lon += interval) <= maxLon && cnt++ < maxLines) {
        idx = this.addMeridian_(
          lon,
          minLat,
          maxLat,
          squaredTolerance,
          extent,
          idx,
        );
      }
    } else {
      while (lon != this.maxLon_ && cnt++ < maxLines) {
        lon = Math.min(lon + interval, this.maxLon_);
        idx = this.addMeridian_(
          lon,
          minLat,
          maxLat,
          squaredTolerance,
          extent,
          idx,
        );
      }
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
      idx = this.addParallel_(
        lat,
        minLon,
        maxLon,
        squaredTolerance,
        extent,
        idx,
      );
    }

    lat = clamp(centerLat, this.minLat_, this.maxLat_);

    cnt = 0;
    while (lat != this.maxLat_ && cnt++ < maxLines) {
      lat = Math.min(lat + interval, this.maxLat_);
      idx = this.addParallel_(
        lat,
        minLon,
        maxLon,
        squaredTolerance,
        extent,
        idx,
      );
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
      const delta = clamp(this.intervals_[i] / 2, 0, 90);
      // Don't attempt to transform latitudes beyond the poles!
      const clampedLat = clamp(centerLat, -90 + delta, 90 - delta);
      p1[0] = centerLon - delta;
      p1[1] = clampedLat - delta;
      p2[0] = centerLon + delta;
      p2[1] = clampedLat + delta;
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
    const flatCoordinates = meridian(
      lon,
      minLat,
      maxLat,
      this.projection_,
      squaredTolerance,
    );
    let lineString = this.meridians_[index];
    if (!lineString) {
      lineString = new LineString(flatCoordinates, 'XY');
      this.meridians_[index] = lineString;
    } else {
      lineString.setFlatCoordinates('XY', flatCoordinates);
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
    let bottom = 1;
    let top = flatCoordinates.length - 1;
    if (flatCoordinates[bottom] > flatCoordinates[top]) {
      bottom = top;
      top = 1;
    }
    const clampedBottom = Math.max(extent[1], flatCoordinates[bottom]);
    const clampedTop = Math.min(extent[3], flatCoordinates[top]);
    const lat = clamp(
      extent[1] + Math.abs(extent[1] - extent[3]) * this.lonLabelPosition_,
      clampedBottom,
      clampedTop,
    );
    const coordinate0 =
      flatCoordinates[bottom - 1] +
      ((flatCoordinates[top - 1] - flatCoordinates[bottom - 1]) *
        (lat - flatCoordinates[bottom])) /
        (flatCoordinates[top] - flatCoordinates[bottom]);
    const coordinate = [coordinate0, lat];
    const point = this.meridiansLabels_[index].geom;
    point.setCoordinates(coordinate);
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
    const flatCoordinates = parallel(
      lat,
      minLon,
      maxLon,
      this.projection_,
      squaredTolerance,
    );
    let lineString = this.parallels_[index];
    if (!lineString) {
      lineString = new LineString(flatCoordinates, 'XY');
    } else {
      lineString.setFlatCoordinates('XY', flatCoordinates);
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
    let left = 0;
    let right = flatCoordinates.length - 2;
    if (flatCoordinates[left] > flatCoordinates[right]) {
      left = right;
      right = 0;
    }
    const clampedLeft = Math.max(extent[0], flatCoordinates[left]);
    const clampedRight = Math.min(extent[2], flatCoordinates[right]);
    const lon = clamp(
      extent[0] + Math.abs(extent[0] - extent[2]) * this.latLabelPosition_,
      clampedLeft,
      clampedRight,
    );
    const coordinate1 =
      flatCoordinates[left + 1] +
      ((flatCoordinates[right + 1] - flatCoordinates[left + 1]) *
        (lon - flatCoordinates[left])) /
        (flatCoordinates[right] - flatCoordinates[left]);
    const coordinate = [lon, coordinate1];
    const point = this.parallelsLabels_[index].geom;
    point.setCoordinates(coordinate);
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

    this.maxLat_ = worldExtent[3];
    this.maxLon_ = worldExtent[2];
    this.minLat_ = worldExtent[1];
    this.minLon_ = worldExtent[0];

    // If the world extent crosses the dateline define a custom transform to
    // return longitudes which wrap the dateline

    const toLonLatTransform = getTransform(projection, epsg4326Projection);
    if (this.minLon_ < this.maxLon_) {
      this.toLonLatTransform_ = toLonLatTransform;
    } else {
      const split = this.minLon_ + this.maxLon_ / 2;
      this.maxLon_ += 360;
      this.toLonLatTransform_ = function (coordinates, output, dimension) {
        dimension = dimension || 2;
        const lonLatCoordinates = toLonLatTransform(
          coordinates,
          output,
          dimension,
        );
        for (let i = 0, l = lonLatCoordinates.length; i < l; i += dimension) {
          if (lonLatCoordinates[i] < split) {
            lonLatCoordinates[i] += 360;
          }
        }
        return lonLatCoordinates;
      };
    }

    // Transform the extent to get the limits of the view projection extent
    // which should be available to the graticule

    this.fromLonLatTransform_ = getTransform(epsg4326Projection, projection);
    const worldExtentP = applyTransform(
      [this.minLon_, this.minLat_, this.maxLon_, this.maxLat_],
      this.fromLonLatTransform_,
      undefined,
      8,
    );

    this.minX_ = worldExtentP[0];
    this.maxX_ = worldExtentP[2];
    this.minY_ = worldExtentP[1];
    this.maxY_ = worldExtentP[3];

    // Determine the view projection coordinates of the extremities of the world extent
    // as these may lie inside a view extent (for example the pole in a polar projection)

    this.bottomLeft_ = this.fromLonLatTransform_([this.minLon_, this.minLat_]);
    this.bottomRight_ = this.fromLonLatTransform_([this.maxLon_, this.minLat_]);
    this.topLeft_ = this.fromLonLatTransform_([this.minLon_, this.maxLat_]);
    this.topRight_ = this.fromLonLatTransform_([this.maxLon_, this.maxLat_]);

    // Transform the projection center to lon lat
    // Some projections may have a void area at the poles
    // so replace any NaN latitudes with the min or max value closest to a pole

    this.projectionCenterLonLat_ = this.toLonLatTransform_(
      getCenter(projection.getExtent()),
    );
    if (isNaN(this.projectionCenterLonLat_[1])) {
      this.projectionCenterLonLat_[1] =
        Math.abs(this.maxLat_) >= Math.abs(this.minLat_)
          ? this.maxLat_
          : this.minLat_;
    }

    this.projection_ = projection;
  }
}

export default Graticule;
