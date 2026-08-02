/**
 * @module ol/format/Feature
 */
import Feature from '../Feature.js';
import GeometryCollection from '../geom/GeometryCollection.js';
import LineString from '../geom/LineString.js';
import MultiLineString from '../geom/MultiLineString.js';
import MultiPoint from '../geom/MultiPoint.js';
import MultiPolygon from '../geom/MultiPolygon.js';
import Point from '../geom/Point.js';
import Polygon from '../geom/Polygon.js';
import {
  linearRingsAreOriented,
  linearRingssAreOriented,
  orientLinearRings,
  orientLinearRingsArray,
} from '../geom/flat/orient.js';
import {
  equivalent as equivalentProjection,
  get as getProjection,
  getTransform,
  transformExtent,
} from '../proj.js';
import RenderFeature from '../render/Feature.js';
import {abstract} from '../util.js';

/**
 * @typedef {Object} ReadOptions
 * @property {import("../proj.js").ProjectionLike} [dataProjection] Projection of the data we are reading.
 * If not provided, the projection will be derived from the data (where possible) or
 * the `dataProjection` of the format is assigned (where set). If the projection
 * can not be derived from the data and if no `dataProjection` is set for a format,
 * the features will not be reprojected.
 * @property {import("../extent.js").Extent} [extent] Tile extent in map units of the tile being read.
 * This is only required when reading data with tile pixels as geometry units. When configured,
 * a `dataProjection` with `TILE_PIXELS` as `units` and the tile's pixel extent as `extent` needs to be
 * provided.
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
 * @typedef {'arraybuffer' | 'json' | 'text' | 'xml'} Type
 */

/**
 * @typedef {Object} SimpleGeometryObject
 * @property {import('../geom/Geometry.js').Type} type Type.
 * @property {Array<number>} flatCoordinates Flat coordinates.
 * @property {Array<number>|Array<Array<number>>} [ends] Ends or endss.
 * @property {import('../geom/Geometry.js').GeometryLayout} [layout] Layout.
 */

/**
 * @typedef {Array<GeometryObject>} GeometryCollectionObject
 */

/**
 * @typedef {SimpleGeometryObject|GeometryCollectionObject} GeometryObject
 */

/**
 * @typedef {Object} FeatureObject
 * @property {string|number} [id] Id.
 * @property {GeometryObject} [geometry] Geometry.
 * @property {Object<string, *>} [properties] Properties.
 */

/***
 * @template {import('../Feature.js').FeatureLike} T
 * @typedef {T extends RenderFeature ? typeof RenderFeature : typeof Feature} FeatureToFeatureClass
 */

/***
 * @template {import("../Feature.js").FeatureClass} T
 * @typedef {T[keyof T] extends RenderFeature ? RenderFeature : Feature} FeatureClassToFeature
 */

/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for feature formats.
 * {@link module:ol/format/Feature~FeatureFormat} subclasses provide the ability to decode and encode
 * {@link module:ol/Feature~Feature} objects from a variety of commonly used geospatial
 * file formats.  See the documentation for each format for more details.
 *
 * @template {import('../Feature.js').FeatureLike} [FeatureType=import("../Feature.js").default]
 * @abstract
 * @api
 */
class FeatureFormat {
  constructor() {
    /**
     * @protected
     * @type {import("../proj/Projection.js").default|undefined}
     */
    this.dataProjection = undefined;

    /**
     * @protected
     * @type {import("../proj/Projection.js").default|undefined}
     */
    this.defaultFeatureProjection = undefined;

    /**
     * @protected
     * @type {FeatureToFeatureClass<FeatureType>}
     */
    this.featureClass = /** @type {FeatureToFeatureClass<FeatureType>} */ (
      Feature
    );

    /**
     * A list media types supported by the format in descending order of preference.
     * @type {Array<string>|undefined}
     */
    this.supportedMediaTypes = undefined;
  }

  /**
   * Adds the data projection to the read options.
   * @param {Document|Element|Object|string} source Source.
   * @param {ReadOptions} [options] Options.
   * @return {ReadOptions|undefined} Options.
   * @protected
   */
  getReadOptions(source, options) {
    if (options) {
      let dataProjection = options.dataProjection
        ? getProjection(options.dataProjection)
        : this.readProjection(source);
      if (
        options.extent &&
        dataProjection &&
        dataProjection.getUnits() === 'tile-pixels'
      ) {
        const tileProjection = getProjection(dataProjection);
        if (tileProjection) {
          tileProjection.setWorldExtent(options.extent);
          dataProjection = tileProjection;
        }
      }
      options = {
        dataProjection: dataProjection ?? undefined,
        featureProjection: options.featureProjection,
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
    return Object.assign(
      {
        dataProjection: this.dataProjection,
        featureProjection: this.defaultFeatureProjection,
        featureClass: this.featureClass,
      },
      options,
    );
  }

  /**
   * @abstract
   * @return {Type} The format type.
   */
  getType() {
    return abstract();
  }

  /**
   * Read a single feature from a source.
   *
   * @abstract
   * @param {Document|Element|Object|string} source Source.
   * @param {ReadOptions} [options] Read options.
   * @return {FeatureType|Array<FeatureType>|null} Feature.
   */
  readFeature(source, options) {
    return abstract();
  }

  /**
   * Read all features from a source.
   *
   * @abstract
   * @param {Document|Element|ArrayBuffer|Object|string} source Source.
   * @param {ReadOptions} [options] Read options.
   * @return {Array<FeatureType>} Features.
   */
  readFeatures(source, options) {
    return abstract();
  }

  /**
   * Read a single geometry from a source.
   *
   * @abstract
   * @param {Document|Element|Object|string} source Source.
   * @param {ReadOptions} [options] Read options.
   * @return {import("../geom/Geometry.js").default|null} Geometry.
   */
  readGeometry(source, options) {
    return abstract();
  }

  /**
   * Read the projection from a source.
   *
   * @abstract
   * @param {Document|Element|Object|string} source Source.
   * @return {import("../proj/Projection.js").default|undefined} Projection.
   */
  readProjection(source) {
    return abstract();
  }

  /**
   * Encode a feature in this format.
   *
   * @abstract
   * @param {Feature} feature Feature.
   * @param {WriteOptions} [options] Write options.
   * @return {string|ArrayBuffer} Result.
   */
  writeFeature(feature, options) {
    return abstract();
  }

  /**
   * Encode an array of features in this format.
   *
   * @abstract
   * @param {Array<Feature>} features Features.
   * @param {WriteOptions} [options] Write options.
   * @return {string|ArrayBuffer} Result.
   */
  writeFeatures(features, options) {
    return abstract();
  }

  /**
   * Write a single geometry in this format.
   *
   * @abstract
   * @param {import("../geom/Geometry.js").default} geometry Geometry.
   * @param {WriteOptions} [options] Write options.
   * @return {string|ArrayBuffer} Result.
   */
  writeGeometry(geometry, options) {
    return abstract();
  }
}

export default FeatureFormat;

/**
 * @template {import("../geom/Geometry.js").default|RenderFeature} T
 * @param {T} geometry Geometry.
 * @param {boolean} write Set to true for writing, false for reading.
 * @param {WriteOptions|ReadOptions} [options] Options.
 * @return {T} Transformed geometry.
 */
export function transformGeometryWithOptions(geometry, write, options) {
  const featureProjection = options
    ? getProjection(options.featureProjection)
    : null;
  const dataProjection = options ? getProjection(options.dataProjection) : null;

  let transformed = geometry;
  if (
    featureProjection &&
    dataProjection &&
    !equivalentProjection(featureProjection, dataProjection)
  ) {
    if (write) {
      transformed = /** @type {T} */ (geometry.clone());
    }
    const fromProjection = write ? featureProjection : dataProjection;
    const toProjection = write ? dataProjection : featureProjection;
    if (fromProjection.getUnits() === 'tile-pixels') {
      transformed.transform(fromProjection, toProjection);
    } else {
      const transformFn = getTransform(fromProjection, toProjection);
      if (transformFn) {
        transformed.applyTransform(transformFn);
      }
    }
  }
  if (
    write &&
    options &&
    /** @type {WriteOptions} */ (options).decimals !== undefined
  ) {
    const power = Math.pow(10, /** @type {WriteOptions} */ (options).decimals);
    // if decimals option on write, round each coordinate appropriately
    /**
     * @param {Array<number>} coordinates Coordinates.
     * @return {Array<number>} Transformed coordinates.
     */
    const transform = function (coordinates) {
      for (let i = 0, ii = coordinates.length; i < ii; ++i) {
        coordinates[i] = Math.round(coordinates[i] * power) / power;
      }
      return coordinates;
    };
    if (transformed === geometry) {
      transformed = /** @type {T} */ (geometry.clone());
    }
    transformed.applyTransform(transform);
  }
  return transformed;
}

/**
 * @param {import("../extent.js").Extent} extent Extent.
 * @param {ReadOptions} [options] Read options.
 * @return {import("../extent.js").Extent} Transformed extent.
 */
export function transformExtentWithOptions(extent, options) {
  const featureProjection = options
    ? getProjection(options.featureProjection)
    : null;
  const dataProjection = options ? getProjection(options.dataProjection) : null;

  if (
    featureProjection &&
    dataProjection &&
    !equivalentProjection(featureProjection, dataProjection)
  ) {
    return transformExtent(extent, dataProjection, featureProjection);
  }
  return extent;
}

/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {Array<number>|Array<Array<number>>} ends Ends or endss.
 * @param {number} stride Stride.
 * @return {Array<number>} Oriented flat coordinates.
 */
function orientFlatCoordinates(flatCoordinates, ends, stride) {
  if (Array.isArray(ends[0])) {
    const endss = /** @type {Array<Array<number>>} */ (ends);
    if (!linearRingssAreOriented(flatCoordinates, 0, endss, stride)) {
      flatCoordinates = flatCoordinates.slice();
      orientLinearRingsArray(flatCoordinates, 0, endss, stride);
    }
    return flatCoordinates;
  }
  const endsArray = /** @type {Array<number>} */ (ends);
  if (!linearRingsAreOriented(flatCoordinates, 0, endsArray, stride)) {
    flatCoordinates = flatCoordinates.slice();
    orientLinearRings(flatCoordinates, 0, endsArray, stride);
  }
  return flatCoordinates;
}

/**
 * @param {FeatureObject} object Feature object.
 * @param {WriteOptions|ReadOptions} [options] Options.
 * @return {RenderFeature|Array<RenderFeature>} Render feature.
 */
export function createRenderFeature(object, options) {
  const geometry = object.geometry;
  if (!geometry) {
    return [];
  }
  if (Array.isArray(geometry)) {
    return geometry
      .map((geometry) => createRenderFeature({...object, geometry}))
      .flat();
  }

  const geometryType =
    geometry.type === 'MultiPolygon' ? 'Polygon' : geometry.type;
  if (geometryType === 'GeometryCollection' || geometryType === 'Circle') {
    throw new Error('Unsupported geometry type: ' + geometryType);
  }

  const stride = (geometry.layout ?? 'XY').length;
  return transformGeometryWithOptions(
    new RenderFeature(
      geometryType,
      geometryType === 'Polygon'
        ? orientFlatCoordinates(
            geometry.flatCoordinates,
            /** @type {Array<number>} */ (geometry.ends),
            stride,
          )
        : geometry.flatCoordinates,
      geometry.ends?.flat() ?? [],
      stride,
      object.properties || {},
      object.id,
    ).enableSimplifyTransformed(),
    false,
    options,
  );
}

/**
 * @param {GeometryObject|null} object Geometry object.
 * @param {WriteOptions|ReadOptions} [options] Options.
 * @return {import("../geom/Geometry.js").default|null} Geometry.
 */
export function createGeometry(object, options) {
  if (!object) {
    return null;
  }
  if (Array.isArray(object)) {
    const geometries = object.map((geometry) =>
      createGeometry(geometry, options),
    );
    return new GeometryCollection(
      /** @type {Array<import("../geom/Geometry.js").default>} */ (geometries),
    );
  }
  const type =
    /** @type {'Point'|'LineString'|'Polygon'|'MultiPoint'|'MultiLineString'|'MultiPolygon'} */ (
      object.type
    );
  const layout = object.layout || 'XY';
  /** @type {import("../geom/Geometry.js").default} */
  let geometry;
  switch (type) {
    case 'Point':
      geometry = new Point(object.flatCoordinates, layout);
      break;
    case 'LineString':
      geometry = new LineString(object.flatCoordinates, layout);
      break;
    case 'Polygon':
      geometry = new Polygon(
        object.flatCoordinates,
        layout,
        /** @type {Array<number>} */ (object.ends),
      );
      break;
    case 'MultiPoint':
      geometry = new MultiPoint(object.flatCoordinates, layout);
      break;
    case 'MultiLineString':
      geometry = new MultiLineString(
        object.flatCoordinates,
        layout,
        /** @type {Array<number>} */ (object.ends),
      );
      break;
    case 'MultiPolygon':
      geometry = new MultiPolygon(
        object.flatCoordinates,
        layout,
        /** @type {Array<Array<number>>} */ (object.ends),
      );
      break;
    default:
      throw new Error('Unsupported geometry type: ' + type);
  }
  return transformGeometryWithOptions(geometry, false, options);
}
