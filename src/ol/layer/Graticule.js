/**
 * @module ol/layer/Graticule
 */
import VectorLayer from './Vector.js';
import {assign} from '../obj.js';
import {degreesToStringHDMS} from "../coordinate";
import Text from "../style/Text";
import Fill from "../style/Fill";
import Stroke from "../style/Stroke";
import LineString from '../geom/LineString.js';


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

    const baseOptions = assign({}, options);

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

    if (options.showLabels == true) {

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
       * @type {Text}
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
       * @type {Text}
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

    /**
     * @type {Array<number>}
     * @private
     */
    this.intervals_ = options.intervals !== undefined ? options.intervals : INTERVALS;
  }
}


export default Graticule;
