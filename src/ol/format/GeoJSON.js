/**
 * @module ol/format/GeoJSON
 */

import Feature from '../Feature.js';
import {getLayoutForStride} from '../geom/SimpleGeometry.js';
import {
  deflateCoordinatesArray,
  deflateMultiCoordinatesArray,
} from '../geom/flat/deflate.js';
import {isEmpty} from '../obj.js';
import {get as getProjection} from '../proj.js';
import RenderFeature from '../render/Feature.js';
import {
  createGeometry,
  createRenderFeature,
  transformGeometryWithOptions,
} from './Feature.js';
import JSONFeature from './JSONFeature.js';

/**
 * @typedef {import("geojson").GeoJSON} GeoJSONObject
 * @typedef {import("geojson").Feature} GeoJSONFeature
 * @typedef {import("geojson").FeatureCollection} GeoJSONFeatureCollection
 * @typedef {import("geojson").Geometry} GeoJSONGeometry
 * @typedef {import("geojson").Point} GeoJSONPoint
 * @typedef {import("geojson").LineString} GeoJSONLineString
 * @typedef {import("geojson").Polygon} GeoJSONPolygon
 * @typedef {import("geojson").MultiPoint} GeoJSONMultiPoint
 * @typedef {import("geojson").MultiLineString} GeoJSONMultiLineString
 * @typedef {import("geojson").MultiPolygon} GeoJSONMultiPolygon
 * @typedef {import("geojson").GeometryCollection} GeoJSONGeometryCollection
 */

/**
 * @template {import("../Feature.js").FeatureLike} [FeatureType=import("../Feature.js").default]
 * @typedef {Object} Options
 *
 * @property {import("../proj.js").ProjectionLike} [dataProjection='EPSG:4326'] Default data projection.
 * @property {import("../proj.js").ProjectionLike} [featureProjection] Projection for features read or
 * written by the format.  Options passed to read or write methods will take precedence.
 * @property {string} [geometryName] Geometry name to use when creating features.
 * @property {boolean} [extractGeometryName=false] Certain GeoJSON providers include
 * the geometry_name field in the feature GeoJSON. If set to `true` the GeoJSON reader
 * will look for that field to set the geometry name. If both this field is set to `true`
 * and a `geometryName` is provided, the `geometryName` will take precedence.
 * @property {import('./Feature.js').FeatureToFeatureClass<FeatureType>} [featureClass] Feature class
 * to be used when reading features. The default is {@link module:ol/Feature~Feature}. If performance is
 * the primary concern, and features are not going to be modified or round-tripped through the format,
 * consider using {@link module:ol/render/Feature~RenderFeature}
 */

/**
 * @classdesc
 * Feature format for reading and writing data in the GeoJSON format.
 *
 * @template {import('../Feature.js').FeatureLike} [FeatureType=import("../Feature.js").default]
 * @extends {JSONFeature<FeatureType>}
 * @api
 */
class GeoJSON extends JSONFeature {
  /**
   * @param {Options<FeatureType>} [options] Options.
   */
  constructor(options) {
    options = options ? options : {};

    super();

    /**
     * @type {import("../proj/Projection.js").default}
     */
    this.dataProjection = getProjection(
      options.dataProjection ? options.dataProjection : 'EPSG:4326',
    );

    if (options.featureProjection) {
      /**
       * @type {import("../proj/Projection.js").default}
       */
      this.defaultFeatureProjection = getProjection(options.featureProjection);
    }

    if (options.featureClass) {
      this.featureClass = options.featureClass;
    }

    /**
     * Name of the geometry attribute for features.
     * @type {string|undefined}
     * @private
     */
    this.geometryName_ = options.geometryName;

    /**
     * Look for the `geometry_name` in the feature GeoJSON
     * @type {boolean|undefined}
     * @private
     */
    this.extractGeometryName_ = options.extractGeometryName;

    this.supportedMediaTypes = [
      'application/geo+json',
      'application/vnd.geo+json',
    ];
  }

  /**
   * @param {Object} object Object.
   * @param {import("./Feature.js").ReadOptions} [options] Read options.
   * @protected
   * @return {FeatureType|Array<FeatureType>} Feature.
   * @override
   */
  readFeatureFromObject(object, options) {
    /**
     * @type {GeoJSONFeature}
     */
    let geoJSONFeature = null;
    if (object['type'] === 'Feature') {
      geoJSONFeature = /** @type {GeoJSONFeature} */ (object);
    } else {
      geoJSONFeature = {
        'type': 'Feature',
        'geometry': /** @type {GeoJSONGeometry} */ (object),
        'properties': null,
      };
    }

    const geometry = readGeometryInternal(geoJSONFeature['geometry'], options);
    if (this.featureClass === RenderFeature) {
      return /** @type {FeatureType|Array<FeatureType>} */ (
        createRenderFeature(
          {
            geometry,
            id: geoJSONFeature['id'],
            properties: geoJSONFeature['properties'],
          },
          options,
        )
      );
    }

    const feature = new Feature();
    if (this.geometryName_) {
      feature.setGeometryName(this.geometryName_);
    } else if (this.extractGeometryName_ && geoJSONFeature['geometry_name']) {
      feature.setGeometryName(geoJSONFeature['geometry_name']);
    }
    feature.setGeometry(createGeometry(geometry, options));

    if ('id' in geoJSONFeature) {
      feature.setId(geoJSONFeature['id']);
    }

    if (geoJSONFeature['properties']) {
      feature.setProperties(geoJSONFeature['properties'], true);
    }
    return /** @type {FeatureType|Array<FeatureType>} */ (feature);
  }

  /**
   * @param {Object} object Object.
   * @param {import("./Feature.js").ReadOptions} [options] Read options.
   * @protected
   * @return {Array<FeatureType>} Features.
   * @override
   */
  readFeaturesFromObject(object, options) {
    const geoJSONObject = /** @type {GeoJSONObject} */ (object);
    let features = null;
    if (geoJSONObject['type'] === 'FeatureCollection') {
      const geoJSONFeatureCollection = /** @type {GeoJSONFeatureCollection} */ (
        object
      );
      features = [];
      const geoJSONFeatures = geoJSONFeatureCollection['features'];
      for (let i = 0, ii = geoJSONFeatures.length; i < ii; ++i) {
        const featureObject = this.readFeatureFromObject(
          geoJSONFeatures[i],
          options,
        );
        if (!featureObject) {
          continue;
        }
        features.push(featureObject);
      }
    } else {
      features = [this.readFeatureFromObject(object, options)];
    }
    return /** @type {Array<FeatureType>} */ (features.flat());
  }

  /**
   * @param {GeoJSONGeometry} object Object.
   * @param {import("./Feature.js").ReadOptions} [options] Read options.
   * @protected
   * @return {import("../geom/Geometry.js").default} Geometry.
   * @override
   */
  readGeometryFromObject(object, options) {
    return readGeometry(object, options);
  }

  /**
   * @param {Object} object Object.
   * @protected
   * @return {import("../proj/Projection.js").default} Projection.
   * @override
   */
  readProjectionFromObject(object) {
    const crs = object['crs'];
    let projection;
    if (crs) {
      if (crs['type'] == 'name') {
        projection = getProjection(crs['properties']['name']);
      } else if (crs['type'] === 'EPSG') {
        projection = getProjection('EPSG:' + crs['properties']['code']);
      } else {
        throw new Error('Unknown SRS type');
      }
    } else {
      projection = this.dataProjection;
    }
    return /** @type {import("../proj/Projection.js").default} */ (projection);
  }

  /**
   * Encode a feature as a GeoJSON Feature object.
   *
   * @param {import("../Feature.js").default} feature Feature.
   * @param {import("./Feature.js").WriteOptions} [options] Write options.
   * @return {GeoJSONFeature} Object.
   * @api
   * @override
   */
  writeFeatureObject(feature, options) {
    options = this.adaptOptions(options);

    /** @type {GeoJSONFeature} */
    const object = {
      'type': 'Feature',
      geometry: null,
      properties: null,
    };

    const id = feature.getId();
    if (id !== undefined) {
      object.id = id;
    }

    if (!feature.hasProperties()) {
      return object;
    }

    const properties = feature.getProperties();
    const geometry = feature.getGeometry();
    if (geometry) {
      object.geometry = writeGeometry(geometry, options);

      delete properties[feature.getGeometryName()];
    }

    if (!isEmpty(properties)) {
      object.properties = properties;
    }

    return object;
  }

  /**
   * Encode an array of features as a GeoJSON object.
   *
   * @param {Array<import("../Feature.js").default>} features Features.
   * @param {import("./Feature.js").WriteOptions} [options] Write options.
   * @return {GeoJSONFeatureCollection} GeoJSON Object.
   * @api
   * @override
   */
  writeFeaturesObject(features, options) {
    options = this.adaptOptions(options);
    const objects = [];
    for (let i = 0, ii = features.length; i < ii; ++i) {
      objects.push(this.writeFeatureObject(features[i], options));
    }
    return {
      type: 'FeatureCollection',
      features: objects,
    };
  }

  /**
   * Encode a geometry as a GeoJSON object.
   *
   * @param {import("../geom/Geometry.js").default} geometry Geometry.
   * @param {import("./Feature.js").WriteOptions} [options] Write options.
   * @return {GeoJSONGeometry|GeoJSONGeometryCollection} Object.
   * @api
   * @override
   */
  writeGeometryObject(geometry, options) {
    return writeGeometry(geometry, this.adaptOptions(options));
  }
}

/**
 * @param {GeoJSONGeometry|GeoJSONGeometryCollection} object Object.
 * @param {import("./Feature.js").ReadOptions} [options] Read options.
 * @return {import("./Feature.js").GeometryObject} Geometry.
 */
function readGeometryInternal(object, options) {
  if (!object) {
    return null;
  }

  /** @type {import("./Feature.js").GeometryObject} */
  let geometry;
  switch (object['type']) {
    case 'Point': {
      geometry = readPointGeometry(/** @type {GeoJSONPoint} */ (object));
      break;
    }
    case 'LineString': {
      geometry = readLineStringGeometry(
        /** @type {GeoJSONLineString} */ (object),
      );
      break;
    }
    case 'Polygon': {
      geometry = readPolygonGeometry(/** @type {GeoJSONPolygon} */ (object));
      break;
    }
    case 'MultiPoint': {
      geometry = readMultiPointGeometry(
        /** @type {GeoJSONMultiPoint} */ (object),
      );
      break;
    }
    case 'MultiLineString': {
      geometry = readMultiLineStringGeometry(
        /** @type {GeoJSONMultiLineString} */ (object),
      );
      break;
    }
    case 'MultiPolygon': {
      geometry = readMultiPolygonGeometry(
        /** @type {GeoJSONMultiPolygon} */ (object),
      );
      break;
    }
    case 'GeometryCollection': {
      geometry = readGeometryCollectionGeometry(
        /** @type {GeoJSONGeometryCollection} */ (object),
      );
      break;
    }
    default: {
      throw new Error('Unsupported GeoJSON type: ' + object['type']);
    }
  }
  return geometry;
}

/**
 * @param {GeoJSONGeometry|GeoJSONGeometryCollection} object Object.
 * @param {import("./Feature.js").ReadOptions} [options] Read options.
 * @return {import("../geom/Geometry.js").default} Geometry.
 */
function readGeometry(object, options) {
  const geometryObject = readGeometryInternal(object, options);
  return createGeometry(geometryObject, options);
}

/**
 * @param {GeoJSONGeometryCollection} object Object.
 * @param {import("./Feature.js").ReadOptions} [options] Read options.
 * @return {import("./Feature.js").GeometryCollectionObject} Geometry collection.
 */
function readGeometryCollectionGeometry(object, options) {
  const geometries = object['geometries'].map(
    /**
     * @param {GeoJSONGeometry} geometry Geometry.
     * @return {import("./Feature.js").GeometryObject} geometry Geometry.
     */
    function (geometry) {
      return readGeometryInternal(geometry, options);
    },
  );
  return geometries;
}

/**
 * @param {GeoJSONPoint} object Input object.
 * @return {import("./Feature.js").GeometryObject} Point geometry.
 */
function readPointGeometry(object) {
  const flatCoordinates = object['coordinates'];
  return {
    type: 'Point',
    flatCoordinates,
    layout: getLayoutForStride(flatCoordinates.length),
  };
}

/**
 * @param {GeoJSONLineString} object Object.
 * @return {import("./Feature.js").GeometryObject} LineString geometry.
 */
function readLineStringGeometry(object) {
  const coordinates = object['coordinates'];
  const flatCoordinates = coordinates.flat();
  return {
    type: 'LineString',
    flatCoordinates,
    ends: [flatCoordinates.length],
    layout: getLayoutForStride(coordinates[0]?.length || 2),
  };
}

/**
 * @param {GeoJSONMultiLineString} object Object.
 * @return {import("./Feature.js").GeometryObject} MultiLineString geometry.
 */
function readMultiLineStringGeometry(object) {
  const coordinates = object['coordinates'];
  const stride = coordinates[0]?.[0]?.length || 2;
  const flatCoordinates = [];
  const ends = deflateCoordinatesArray(flatCoordinates, 0, coordinates, stride);
  return {
    type: 'MultiLineString',
    flatCoordinates,
    ends,
    layout: getLayoutForStride(stride),
  };
}

/**
 * @param {GeoJSONMultiPoint} object Object.
 * @return {import("./Feature.js").GeometryObject} MultiPoint geometry.
 */
function readMultiPointGeometry(object) {
  const coordinates = object['coordinates'];
  return {
    type: 'MultiPoint',
    flatCoordinates: coordinates.flat(),
    layout: getLayoutForStride(coordinates[0]?.length || 2),
  };
}

/**
 * @param {GeoJSONMultiPolygon} object Object.
 * @return {import("./Feature.js").GeometryObject} MultiPolygon geometry.
 */
function readMultiPolygonGeometry(object) {
  const coordinates = object['coordinates'];
  const flatCoordinates = [];
  const stride = coordinates[0]?.[0]?.[0].length || 2;
  const endss = deflateMultiCoordinatesArray(
    flatCoordinates,
    0,
    coordinates,
    stride,
  );
  return {
    type: 'MultiPolygon',
    flatCoordinates,
    ends: endss,
    layout: getLayoutForStride(stride),
  };
}

/**
 * @param {GeoJSONPolygon} object Object.
 * @return {import("./Feature.js").GeometryObject} Polygon.
 */
function readPolygonGeometry(object) {
  const coordinates = object['coordinates'];
  const flatCoordinates = [];
  const stride = coordinates[0]?.[0]?.length;
  const ends = deflateCoordinatesArray(flatCoordinates, 0, coordinates, stride);
  return {
    type: 'Polygon',
    flatCoordinates,
    ends,
    layout: getLayoutForStride(stride),
  };
}

/**
 * @param {import("../geom/Geometry.js").default} geometry Geometry.
 * @param {import("./Feature.js").WriteOptions} [options] Write options.
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
function writeGeometry(geometry, options) {
  geometry = transformGeometryWithOptions(geometry, true, options);

  const type = geometry.getType();

  /** @type {GeoJSONGeometry} */
  let geoJSON;
  switch (type) {
    case 'Point': {
      geoJSON = writePointGeometry(
        /** @type {import("../geom/Point.js").default} */ (geometry),
        options,
      );
      break;
    }
    case 'LineString': {
      geoJSON = writeLineStringGeometry(
        /** @type {import("../geom/LineString.js").default} */ (geometry),
        options,
      );
      break;
    }
    case 'Polygon': {
      geoJSON = writePolygonGeometry(
        /** @type {import("../geom/Polygon.js").default} */ (geometry),
        options,
      );
      break;
    }
    case 'MultiPoint': {
      geoJSON = writeMultiPointGeometry(
        /** @type {import("../geom/MultiPoint.js").default} */ (geometry),
        options,
      );
      break;
    }
    case 'MultiLineString': {
      geoJSON = writeMultiLineStringGeometry(
        /** @type {import("../geom/MultiLineString.js").default} */ (geometry),
        options,
      );
      break;
    }
    case 'MultiPolygon': {
      geoJSON = writeMultiPolygonGeometry(
        /** @type {import("../geom/MultiPolygon.js").default} */ (geometry),
        options,
      );
      break;
    }
    case 'GeometryCollection': {
      geoJSON = writeGeometryCollectionGeometry(
        /** @type {import("../geom/GeometryCollection.js").default} */ (
          geometry
        ),
        options,
      );
      break;
    }
    case 'Circle': {
      geoJSON = {
        type: 'GeometryCollection',
        geometries: [],
      };
      break;
    }
    default: {
      throw new Error('Unsupported geometry type: ' + type);
    }
  }
  return geoJSON;
}

/**
 * @param {import("../geom/GeometryCollection.js").default} geometry Geometry.
 * @param {import("./Feature.js").WriteOptions} [options] Write options.
 * @return {GeoJSONGeometryCollection} GeoJSON geometry collection.
 */
function writeGeometryCollectionGeometry(geometry, options) {
  options = Object.assign({}, options);
  delete options.featureProjection;
  const geometries = geometry.getGeometriesArray().map(function (geometry) {
    return writeGeometry(geometry, options);
  });
  return {
    type: 'GeometryCollection',
    geometries: geometries,
  };
}

/**
 * @param {import("../geom/LineString.js").default} geometry Geometry.
 * @param {import("./Feature.js").WriteOptions} [options] Write options.
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
function writeLineStringGeometry(geometry, options) {
  return {
    type: 'LineString',
    coordinates: geometry.getCoordinates(),
  };
}

/**
 * @param {import("../geom/MultiLineString.js").default} geometry Geometry.
 * @param {import("./Feature.js").WriteOptions} [options] Write options.
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
function writeMultiLineStringGeometry(geometry, options) {
  return {
    type: 'MultiLineString',
    coordinates: geometry.getCoordinates(),
  };
}

/**
 * @param {import("../geom/MultiPoint.js").default} geometry Geometry.
 * @param {import("./Feature.js").WriteOptions} [options] Write options.
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
function writeMultiPointGeometry(geometry, options) {
  return {
    type: 'MultiPoint',
    coordinates: geometry.getCoordinates(),
  };
}

/**
 * @param {import("../geom/MultiPolygon.js").default} geometry Geometry.
 * @param {import("./Feature.js").WriteOptions} [options] Write options.
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
function writeMultiPolygonGeometry(geometry, options) {
  let right;
  if (options) {
    right = options.rightHanded;
  }
  return {
    type: 'MultiPolygon',
    coordinates: geometry.getCoordinates(right),
  };
}

/**
 * @param {import("../geom/Point.js").default} geometry Geometry.
 * @param {import("./Feature.js").WriteOptions} [options] Write options.
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
function writePointGeometry(geometry, options) {
  return {
    type: 'Point',
    coordinates: geometry.getCoordinates(),
  };
}

/**
 * @param {import("../geom/Polygon.js").default} geometry Geometry.
 * @param {import("./Feature.js").WriteOptions} [options] Write options.
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
function writePolygonGeometry(geometry, options) {
  let right;
  if (options) {
    right = options.rightHanded;
  }
  return {
    type: 'Polygon',
    coordinates: geometry.getCoordinates(right),
  };
}

export default GeoJSON;
