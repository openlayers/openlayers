/**
 * @module ol/format/GeoJSON
 */

import Feature from '../Feature.js';
import GeometryCollection from '../geom/GeometryCollection.js';
import JSONFeature from './JSONFeature.js';
import LineString from '../geom/LineString.js';
import MultiLineString from '../geom/MultiLineString.js';
import MultiPoint from '../geom/MultiPoint.js';
import MultiPolygon from '../geom/MultiPolygon.js';
import Point from '../geom/Point.js';
import Polygon from '../geom/Polygon.js';
import {assert} from '../asserts.js';
import {get as getProjection} from '../proj.js';
import {isEmpty} from '../obj.js';
import {transformGeometryWithOptions} from './Feature.js';

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
 * @typedef {Object} Options
 * @property {import("../proj.js").ProjectionLike} [dataProjection='EPSG:4326'] Default data projection.
 * @property {import("../proj.js").ProjectionLike} [featureProjection] Projection for features read or
 * written by the format.  Options passed to read or write methods will take precedence.
 * @property {string} [geometryName] Geometry name to use when creating features.
 * @property {boolean} [extractGeometryName=false] Certain GeoJSON providers include
 * the geometry_name field in the feature GeoJSON. If set to `true` the GeoJSON reader
 * will look for that field to set the geometry name. If both this field is set to `true`
 * and a `geometryName` is provided, the `geometryName` will take precedence.
 */

/**
 * @classdesc
 * Feature format for reading and writing data in the GeoJSON format.
 *
 * @api
 */
class GeoJSON extends JSONFeature {
  /**
   * @param {Options} [options] Options.
   */
  constructor(options) {
    options = options ? options : {};

    super();

    /**
     * @type {import("../proj/Projection.js").default}
     */
    this.dataProjection = getProjection(
      options.dataProjection ? options.dataProjection : 'EPSG:4326'
    );

    if (options.featureProjection) {
      /**
       * @type {import("../proj/Projection.js").default}
       */
      this.defaultFeatureProjection = getProjection(options.featureProjection);
    }

    /**
     * Name of the geometry attribute for features.
     * @type {string|undefined}
     * @private
     */
    this.geometryName_ = options.geometryName;

    /**
     * Look for the geometry name in the feature GeoJSON
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
   * @return {import("../Feature.js").default} Feature.
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

    const geometry = readGeometry(geoJSONFeature['geometry'], options);
    const feature = new Feature();
    if (this.geometryName_) {
      feature.setGeometryName(this.geometryName_);
    } else if (
      this.extractGeometryName_ &&
      'geometry_name' in geoJSONFeature !== undefined
    ) {
      feature.setGeometryName(geoJSONFeature['geometry_name']);
    }
    feature.setGeometry(geometry);

    if ('id' in geoJSONFeature) {
      feature.setId(geoJSONFeature['id']);
    }

    if (geoJSONFeature['properties']) {
      feature.setProperties(geoJSONFeature['properties'], true);
    }
    return feature;
  }

  /**
   * @param {Object} object Object.
   * @param {import("./Feature.js").ReadOptions} [options] Read options.
   * @protected
   * @return {Array<Feature>} Features.
   */
  readFeaturesFromObject(object, options) {
    const geoJSONObject = /** @type {GeoJSONObject} */ (object);
    /** @type {Array<import("../Feature.js").default>} */
    let features = null;
    if (geoJSONObject['type'] === 'FeatureCollection') {
      const geoJSONFeatureCollection = /** @type {GeoJSONFeatureCollection} */ (
        object
      );
      features = [];
      const geoJSONFeatures = geoJSONFeatureCollection['features'];
      for (let i = 0, ii = geoJSONFeatures.length; i < ii; ++i) {
        features.push(this.readFeatureFromObject(geoJSONFeatures[i], options));
      }
    } else {
      features = [this.readFeatureFromObject(object, options)];
    }
    return features;
  }

  /**
   * @param {GeoJSONGeometry} object Object.
   * @param {import("./Feature.js").ReadOptions} [options] Read options.
   * @protected
   * @return {import("../geom/Geometry.js").default} Geometry.
   */
  readGeometryFromObject(object, options) {
    return readGeometry(object, options);
  }

  /**
   * @param {Object} object Object.
   * @protected
   * @return {import("../proj/Projection.js").default} Projection.
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
        assert(false, 36); // Unknown SRS type
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
   */
  writeGeometryObject(geometry, options) {
    return writeGeometry(geometry, this.adaptOptions(options));
  }
}

/**
 * @param {GeoJSONGeometry|GeoJSONGeometryCollection} object Object.
 * @param {import("./Feature.js").ReadOptions} [options] Read options.
 * @return {import("../geom/Geometry.js").default} Geometry.
 */
function readGeometry(object, options) {
  if (!object) {
    return null;
  }

  /**
   * @type {import("../geom/Geometry.js").default}
   */
  let geometry;
  switch (object['type']) {
    case 'Point': {
      geometry = readPointGeometry(/** @type {GeoJSONPoint} */ (object));
      break;
    }
    case 'LineString': {
      geometry = readLineStringGeometry(
        /** @type {GeoJSONLineString} */ (object)
      );
      break;
    }
    case 'Polygon': {
      geometry = readPolygonGeometry(/** @type {GeoJSONPolygon} */ (object));
      break;
    }
    case 'MultiPoint': {
      geometry = readMultiPointGeometry(
        /** @type {GeoJSONMultiPoint} */ (object)
      );
      break;
    }
    case 'MultiLineString': {
      geometry = readMultiLineStringGeometry(
        /** @type {GeoJSONMultiLineString} */ (object)
      );
      break;
    }
    case 'MultiPolygon': {
      geometry = readMultiPolygonGeometry(
        /** @type {GeoJSONMultiPolygon} */ (object)
      );
      break;
    }
    case 'GeometryCollection': {
      geometry = readGeometryCollectionGeometry(
        /** @type {GeoJSONGeometryCollection} */ (object)
      );
      break;
    }
    default: {
      throw new Error('Unsupported GeoJSON type: ' + object['type']);
    }
  }
  return transformGeometryWithOptions(geometry, false, options);
}

/**
 * @param {GeoJSONGeometryCollection} object Object.
 * @param {import("./Feature.js").ReadOptions} [options] Read options.
 * @return {GeometryCollection} Geometry collection.
 */
function readGeometryCollectionGeometry(object, options) {
  const geometries = object['geometries'].map(
    /**
     * @param {GeoJSONGeometry} geometry Geometry.
     * @return {import("../geom/Geometry.js").default} geometry Geometry.
     */
    function (geometry) {
      return readGeometry(geometry, options);
    }
  );
  return new GeometryCollection(geometries);
}

/**
 * @param {GeoJSONPoint} object Object.
 * @return {Point} Point.
 */
function readPointGeometry(object) {
  return new Point(object['coordinates']);
}

/**
 * @param {GeoJSONLineString} object Object.
 * @return {LineString} LineString.
 */
function readLineStringGeometry(object) {
  return new LineString(object['coordinates']);
}

/**
 * @param {GeoJSONMultiLineString} object Object.
 * @return {MultiLineString} MultiLineString.
 */
function readMultiLineStringGeometry(object) {
  return new MultiLineString(object['coordinates']);
}

/**
 * @param {GeoJSONMultiPoint} object Object.
 * @return {MultiPoint} MultiPoint.
 */
function readMultiPointGeometry(object) {
  return new MultiPoint(object['coordinates']);
}

/**
 * @param {GeoJSONMultiPolygon} object Object.
 * @return {MultiPolygon} MultiPolygon.
 */
function readMultiPolygonGeometry(object) {
  return new MultiPolygon(object['coordinates']);
}

/**
 * @param {GeoJSONPolygon} object Object.
 * @return {Polygon} Polygon.
 */
function readPolygonGeometry(object) {
  return new Polygon(object['coordinates']);
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
      geoJSON = writePointGeometry(/** @type {Point} */ (geometry), options);
      break;
    }
    case 'LineString': {
      geoJSON = writeLineStringGeometry(
        /** @type {LineString} */ (geometry),
        options
      );
      break;
    }
    case 'Polygon': {
      geoJSON = writePolygonGeometry(
        /** @type {Polygon} */ (geometry),
        options
      );
      break;
    }
    case 'MultiPoint': {
      geoJSON = writeMultiPointGeometry(
        /** @type {MultiPoint} */ (geometry),
        options
      );
      break;
    }
    case 'MultiLineString': {
      geoJSON = writeMultiLineStringGeometry(
        /** @type {MultiLineString} */ (geometry),
        options
      );
      break;
    }
    case 'MultiPolygon': {
      geoJSON = writeMultiPolygonGeometry(
        /** @type {MultiPolygon} */ (geometry),
        options
      );
      break;
    }
    case 'GeometryCollection': {
      geoJSON = writeGeometryCollectionGeometry(
        /** @type {GeometryCollection} */ (geometry),
        options
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
 * @param {GeometryCollection} geometry Geometry.
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
 * @param {LineString} geometry Geometry.
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
 * @param {MultiLineString} geometry Geometry.
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
 * @param {MultiPoint} geometry Geometry.
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
 * @param {MultiPolygon} geometry Geometry.
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
 * @param {Point} geometry Geometry.
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
 * @param {Polygon} geometry Geometry.
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
