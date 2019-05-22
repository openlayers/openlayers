/**
 * @module ol/format/Feature
 */
import {assign} from '../obj.js';
import {abstract} from '../util.js';
import {get as getProjection, equivalent as equivalentProjection, transformExtent} from '../proj.js';


/**
 * @typedef {Object} ReadOptions
 * @property {import("../proj.js").ProjectionLike} [dataProjection] Projection of the data we are reading.
 * If not provided, the projection will be derived from the data (where possible) or
 * the `dataProjection` of the format is assigned (where set). If the projection
 * can not be derived from the data and if no `dataProjection` is set for a format,
 * the features will not be reprojected.
 * @property {import("../extent.js").Extent} [extent] Tile extent of the tile being read. This is only used and
 * required for {@link module:ol/format/MVT}.
 * @property {import("../proj.js").ProjectionLike} [featureProjection] Projection of the feature geometries
 * created by the format reader. If not provided, features will be returned in the
 * `dataProjection`.
 */


/**
 * @typedef {Object} WriteOptions
 * @property {import("../proj.js").ProjectionLike} [dataProjection] Projection of the data we are writing.
 * If not provided, the `dataProjection` of the format is assigned (where set).
 * If no `dataProjection` is set for a format, the features will be returned
 * in the `featureProjection`.
 * @property {import("../proj.js").ProjectionLike} [featureProjection] Projection of the feature geometries
 * that will be serialized by the format writer. If not provided, geometries are assumed
 * to be in the `dataProjection` if that is set; in other words, they are not transformed.
 * @property {boolean} [rightHanded] When writing geometries, follow the right-hand
 * rule for linear ring orientation.  This means that polygons will have counter-clockwise
 * exterior rings and clockwise interior rings.  By default, coordinates are serialized
 * as they are provided at construction.  If `true`, the right-hand rule will
 * be applied.  If `false`, the left-hand rule will be applied (clockwise for
 * exterior and counter-clockwise for interior rings).  Note that not all
 * formats support this.  The GeoJSON format does use this property when writing
 * geometries.
 * @property {number} [decimals] Maximum number of decimal places for coordinates.
 * Coordinates are stored internally as floats, but floating-point arithmetic can create
 * coordinates with a large number of decimal places, not generally wanted on output.
 * Set a number here to round coordinates. Can also be used to ensure that
 * coordinates read in can be written back out with the same number of decimals.
 * Default is no rounding.
 */


/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for feature formats.
 * {FeatureFormat} subclasses provide the ability to decode and encode
 * {@link module:ol/Feature~Feature} objects from a variety of commonly used geospatial
 * file formats.  See the documentation for each format for more details.
 *
 * @abstract
 * @api
 */
class FeatureFormat {
  constructor() {

    /**
     * @protected
     * @type {import("../proj/Projection.js").default}
     */
    this.dataProjection = null;

    /**
     * @protected
     * @type {import("../proj/Projection.js").default}
     */
    this.defaultFeatureProjection = null;

  }

  /**
   * Adds the data projection to the read options.
   * @param {Document|Node|Object|string} source Source.
   * @param {ReadOptions=} opt_options Options.
   * @return {ReadOptions|undefined} Options.
   * @protected
   */
  getReadOptions(source, opt_options) {
    let options;
    if (opt_options) {
      options = {
        dataProjection: opt_options.dataProjection ?
          opt_options.dataProjection : this.readProjection(source),
        featureProjection: opt_options.featureProjection
      };
    }
    return this.adaptOptions(options);
  }

  /**
   * Sets the `dataProjection` on the options, if no `dataProjection`
   * is set.
   * @param {WriteOptions|ReadOptions|undefined} options
   *     Options.
   * @protected
   * @return {WriteOptions|ReadOptions|undefined}
   *     Updated options.
   */
  adaptOptions(options) {
    return assign({
      dataProjection: this.dataProjection,
      featureProjection: this.defaultFeatureProjection
    }, options);
  }

  /**
   * @abstract
   * @return {import("./FormatType.js").default} Format.
   */
  getType() {
    return abstract();
  }

  /**
   * Read a single feature from a source.
   *
   * @abstract
   * @param {Document|Node|Object|string} source Source.
   * @param {ReadOptions=} opt_options Read options.
   * @return {import("../Feature.js").FeatureLike} Feature.
   */
  readFeature(source, opt_options) {
    return abstract();
  }

  /**
   * Read all features from a source.
   *
   * @abstract
   * @param {Document|Node|ArrayBuffer|Object|string} source Source.
   * @param {ReadOptions=} opt_options Read options.
   * @return {Array<import("../Feature.js").FeatureLike>} Features.
   */
  readFeatures(source, opt_options) {
    return abstract();
  }

  /**
   * Read a single geometry from a source.
   *
   * @abstract
   * @param {Document|Node|Object|string} source Source.
   * @param {ReadOptions=} opt_options Read options.
   * @return {import("../geom/Geometry.js").default} Geometry.
   */
  readGeometry(source, opt_options) {
    return abstract();
  }

  /**
   * Read the projection from a source.
   *
   * @abstract
   * @param {Document|Node|Object|string} source Source.
   * @return {import("../proj/Projection.js").default} Projection.
   */
  readProjection(source) {
    return abstract();
  }

  /**
   * Encode a feature in this format.
   *
   * @abstract
   * @param {import("../Feature.js").default} feature Feature.
   * @param {WriteOptions=} opt_options Write options.
   * @return {string} Result.
   */
  writeFeature(feature, opt_options) {
    return abstract();
  }

  /**
   * Encode an array of features in this format.
   *
   * @abstract
   * @param {Array<import("../Feature.js").default>} features Features.
   * @param {WriteOptions=} opt_options Write options.
   * @return {string} Result.
   */
  writeFeatures(features, opt_options) {
    return abstract();
  }

  /**
   * Write a single geometry in this format.
   *
   * @abstract
   * @param {import("../geom/Geometry.js").default} geometry Geometry.
   * @param {WriteOptions=} opt_options Write options.
   * @return {string} Result.
   */
  writeGeometry(geometry, opt_options) {
    return abstract();
  }
}

export default FeatureFormat;

/**
 * @param {import("../geom/Geometry.js").default} geometry Geometry.
 * @param {boolean} write Set to true for writing, false for reading.
 * @param {(WriteOptions|ReadOptions)=} opt_options Options.
 * @return {import("../geom/Geometry.js").default} Transformed geometry.
 */
export function transformGeometryWithOptions(geometry, write, opt_options) {
  const featureProjection = opt_options ? getProjection(opt_options.featureProjection) : null;
  const dataProjection = opt_options ? getProjection(opt_options.dataProjection) : null;

  let transformed;
  if (featureProjection && dataProjection && !equivalentProjection(featureProjection, dataProjection)) {
    transformed = (write ? geometry.clone() : geometry).transform(
      write ? featureProjection : dataProjection,
      write ? dataProjection : featureProjection);
  } else {
    transformed = geometry;
  }
  if (write && opt_options && /** @type {WriteOptions} */ (opt_options).decimals !== undefined) {
    const power = Math.pow(10, /** @type {WriteOptions} */ (opt_options).decimals);
    // if decimals option on write, round each coordinate appropriately
    /**
     * @param {Array<number>} coordinates Coordinates.
     * @return {Array<number>} Transformed coordinates.
     */
    const transform = function(coordinates) {
      for (let i = 0, ii = coordinates.length; i < ii; ++i) {
        coordinates[i] = Math.round(coordinates[i] * power) / power;
      }
      return coordinates;
    };
    if (transformed === geometry) {
      transformed = geometry.clone();
    }
    transformed.applyTransform(transform);
  }
  return transformed;
}


/**
 * @param {import("../extent.js").Extent} extent Extent.
 * @param {ReadOptions=} opt_options Read options.
 * @return {import("../extent.js").Extent} Transformed extent.
 */
export function transformExtentWithOptions(extent, opt_options) {
  const featureProjection = opt_options ? getProjection(opt_options.featureProjection) : null;
  const dataProjection = opt_options ? getProjection(opt_options.dataProjection) : null;

  if (featureProjection && dataProjection && !equivalentProjection(featureProjection, dataProjection)) {
    return transformExtent(extent, dataProjection, featureProjection);
  } else {
    return extent;
  }
}
