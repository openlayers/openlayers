/**
 * @module ol/format/GeoJSON
 */
// TODO: serialize dataProjection as crs member when writing
// see https://github.com/openlayers/openlayers/issues/2078

import {inherits} from '../util.js';
import {assert} from '../asserts.js';
import Feature from '../Feature.js';
import {transformWithOptions} from '../format/Feature.js';
import JSONFeature from '../format/JSONFeature.js';
import GeometryCollection from '../geom/GeometryCollection.js';
import LineString from '../geom/LineString.js';
import MultiLineString from '../geom/MultiLineString.js';
import MultiPoint from '../geom/MultiPoint.js';
import MultiPolygon from '../geom/MultiPolygon.js';
import Point from '../geom/Point.js';
import Polygon from '../geom/Polygon.js';
import {assign, isEmpty} from '../obj.js';
import {get as getProjection} from '../proj.js';


/**
 * @typedef {Object} Options
 * @property {module:ol/proj~ProjectionLike} [dataProjection='EPSG:4326'] Default data projection.
 * @property {module:ol/proj~ProjectionLike} [featureProjection] Projection for features read or
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
 * @constructor
 * @extends {module:ol/format/JSONFeature}
 * @param {module:ol/format/GeoJSON~Options=} opt_options Options.
 * @api
 */
const GeoJSON = function(opt_options) {

  const options = opt_options ? opt_options : {};

  JSONFeature.call(this);

  /**
   * @inheritDoc
   */
  this.dataProjection = getProjection(
    options.dataProjection ?
      options.dataProjection : 'EPSG:4326');

  if (options.featureProjection) {
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

};

inherits(GeoJSON, JSONFeature);


/**
 * @const
 * @type {Object.<string, function(GeoJSONObject): module:ol/geom/Geometry>}
 */
const GEOMETRY_READERS = {
  'Point': readPointGeometry,
  'LineString': readLineStringGeometry,
  'Polygon': readPolygonGeometry,
  'MultiPoint': readMultiPointGeometry,
  'MultiLineString': readMultiLineStringGeometry,
  'MultiPolygon': readMultiPolygonGeometry,
  'GeometryCollection': readGeometryCollectionGeometry
};


/**
 * @const
 * @type {Object.<string, function(module:ol/geom/Geometry, module:ol/format/Feature~WriteOptions=): (GeoJSONGeometry|GeoJSONGeometryCollection)>}
 */
const GEOMETRY_WRITERS = {
  'Point': writePointGeometry,
  'LineString': writeLineStringGeometry,
  'Polygon': writePolygonGeometry,
  'MultiPoint': writeMultiPointGeometry,
  'MultiLineString': writeMultiLineStringGeometry,
  'MultiPolygon': writeMultiPolygonGeometry,
  'GeometryCollection': writeGeometryCollectionGeometry,
  'Circle': writeEmptyGeometryCollectionGeometry
};


/**
 * @param {GeoJSONGeometry|GeoJSONGeometryCollection} object Object.
 * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
 * @return {module:ol/geom/Geometry} Geometry.
 */
function readGeometry(object, opt_options) {
  if (!object) {
    return null;
  }
  const geometryReader = GEOMETRY_READERS[object.type];
  return (
    /** @type {module:ol/geom/Geometry} */ (transformWithOptions(geometryReader(object), false, opt_options))
  );
}


/**
 * @param {GeoJSONGeometryCollection} object Object.
 * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
 * @return {module:ol/geom/GeometryCollection} Geometry collection.
 */
function readGeometryCollectionGeometry(object, opt_options) {
  const geometries = object.geometries.map(
    /**
     * @param {GeoJSONGeometry} geometry Geometry.
     * @return {module:ol/geom/Geometry} geometry Geometry.
     */
    function(geometry) {
      return readGeometry(geometry, opt_options);
    });
  return new GeometryCollection(geometries);
}


/**
 * @param {GeoJSONGeometry} object Object.
 * @return {module:ol/geom/Point} Point.
 */
function readPointGeometry(object) {
  return new Point(object.coordinates);
}


/**
 * @param {GeoJSONGeometry} object Object.
 * @return {module:ol/geom/LineString} LineString.
 */
function readLineStringGeometry(object) {
  return new LineString(object.coordinates);
}


/**
 * @param {GeoJSONGeometry} object Object.
 * @return {module:ol/geom/MultiLineString} MultiLineString.
 */
function readMultiLineStringGeometry(object) {
  return new MultiLineString(object.coordinates);
}


/**
 * @param {GeoJSONGeometry} object Object.
 * @return {module:ol/geom/MultiPoint} MultiPoint.
 */
function readMultiPointGeometry(object) {
  return new MultiPoint(object.coordinates);
}


/**
 * @param {GeoJSONGeometry} object Object.
 * @return {module:ol/geom/MultiPolygon} MultiPolygon.
 */
function readMultiPolygonGeometry(object) {
  return new MultiPolygon(object.coordinates);
}


/**
 * @param {GeoJSONGeometry} object Object.
 * @return {module:ol/geom/Polygon} Polygon.
 */
function readPolygonGeometry(object) {
  return new Polygon(object.coordinates);
}


/**
 * @param {module:ol/geom/Geometry} geometry Geometry.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @return {GeoJSONGeometry|GeoJSONGeometryCollection} GeoJSON geometry.
 */
function writeGeometry(geometry, opt_options) {
  const geometryWriter = GEOMETRY_WRITERS[geometry.getType()];
  return geometryWriter(/** @type {module:ol/geom/Geometry} */ (
    transformWithOptions(geometry, true, opt_options)), opt_options);
}


/**
 * @param {module:ol/geom/Geometry} geometry Geometry.
 * @return {GeoJSONGeometryCollection} Empty GeoJSON geometry collection.
 */
function writeEmptyGeometryCollectionGeometry(geometry) {
  return /** @type {GeoJSONGeometryCollection} */ ({
    type: 'GeometryCollection',
    geometries: []
  });
}


/**
 * @param {module:ol/geom/GeometryCollection} geometry Geometry.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @return {GeoJSONGeometryCollection} GeoJSON geometry collection.
 */
function writeGeometryCollectionGeometry(geometry, opt_options) {
  const geometries = geometry.getGeometriesArray().map(function(geometry) {
    const options = assign({}, opt_options);
    delete options.featureProjection;
    return writeGeometry(geometry, options);
  });
  return /** @type {GeoJSONGeometryCollection} */ ({
    type: 'GeometryCollection',
    geometries: geometries
  });
}


/**
 * @param {module:ol/geom/LineString} geometry Geometry.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
function writeLineStringGeometry(geometry, opt_options) {
  return /** @type {GeoJSONGeometry} */ ({
    type: 'LineString',
    coordinates: geometry.getCoordinates()
  });
}


/**
 * @param {module:ol/geom/MultiLineString} geometry Geometry.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
function writeMultiLineStringGeometry(geometry, opt_options) {
  return /** @type {GeoJSONGeometry} */ ({
    type: 'MultiLineString',
    coordinates: geometry.getCoordinates()
  });
}


/**
 * @param {module:ol/geom/MultiPoint} geometry Geometry.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
function writeMultiPointGeometry(geometry, opt_options) {
  return /** @type {GeoJSONGeometry} */ ({
    type: 'MultiPoint',
    coordinates: geometry.getCoordinates()
  });
}


/**
 * @param {module:ol/geom/MultiPolygon} geometry Geometry.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
function writeMultiPolygonGeometry(geometry, opt_options) {
  let right;
  if (opt_options) {
    right = opt_options.rightHanded;
  }
  return /** @type {GeoJSONGeometry} */ ({
    type: 'MultiPolygon',
    coordinates: geometry.getCoordinates(right)
  });
}


/**
 * @param {module:ol/geom/Point} geometry Geometry.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
function writePointGeometry(geometry, opt_options) {
  return /** @type {GeoJSONGeometry} */ ({
    type: 'Point',
    coordinates: geometry.getCoordinates()
  });
}


/**
 * @param {module:ol/geom/Polygon} geometry Geometry.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
function writePolygonGeometry(geometry, opt_options) {
  let right;
  if (opt_options) {
    right = opt_options.rightHanded;
  }
  return /** @type {GeoJSONGeometry} */ ({
    type: 'Polygon',
    coordinates: geometry.getCoordinates(right)
  });
}


/**
 * Read a feature from a GeoJSON Feature source.  Only works for Feature or
 * geometry types.  Use {@link module:ol/format/GeoJSON#readFeatures} to read
 * FeatureCollection source. If feature at source has an id, it will be used
 * as Feature id by calling {@link module:ol/Feature#setId} internally.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
 * @return {module:ol/Feature} Feature.
 * @api
 */
GeoJSON.prototype.readFeature;


/**
 * Read all features from a GeoJSON source.  Works for all GeoJSON types.
 * If the source includes only geometries, features will be created with those
 * geometries.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
 * @return {Array.<module:ol/Feature>} Features.
 * @api
 */
GeoJSON.prototype.readFeatures;


/**
 * @inheritDoc
 */
GeoJSON.prototype.readFeatureFromObject = function(object, opt_options) {
  /**
   * @type {GeoJSONFeature}
   */
  let geoJSONFeature = null;
  if (object.type === 'Feature') {
    geoJSONFeature = /** @type {GeoJSONFeature} */ (object);
  } else {
    geoJSONFeature = /** @type {GeoJSONFeature} */ ({
      type: 'Feature',
      geometry: /** @type {GeoJSONGeometry|GeoJSONGeometryCollection} */ (object)
    });
  }

  const geometry = readGeometry(geoJSONFeature.geometry, opt_options);
  const feature = new Feature();
  if (this.geometryName_) {
    feature.setGeometryName(this.geometryName_);
  } else if (this.extractGeometryName_ && geoJSONFeature.geometry_name !== undefined) {
    feature.setGeometryName(geoJSONFeature.geometry_name);
  }
  feature.setGeometry(geometry);
  if (geoJSONFeature.id !== undefined) {
    feature.setId(geoJSONFeature.id);
  }
  if (geoJSONFeature.properties) {
    feature.setProperties(geoJSONFeature.properties);
  }
  return feature;
};


/**
 * @inheritDoc
 */
GeoJSON.prototype.readFeaturesFromObject = function(object, opt_options) {
  const geoJSONObject = /** @type {GeoJSONObject} */ (object);
  /** @type {Array.<module:ol/Feature>} */
  let features = null;
  if (geoJSONObject.type === 'FeatureCollection') {
    const geoJSONFeatureCollection = /** @type {GeoJSONFeatureCollection} */ (object);
    features = [];
    const geoJSONFeatures = geoJSONFeatureCollection.features;
    for (let i = 0, ii = geoJSONFeatures.length; i < ii; ++i) {
      features.push(this.readFeatureFromObject(geoJSONFeatures[i], opt_options));
    }
  } else {
    features = [this.readFeatureFromObject(object, opt_options)];
  }
  return features;
};


/**
 * Read a geometry from a GeoJSON source.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
 * @return {module:ol/geom/Geometry} Geometry.
 * @api
 */
GeoJSON.prototype.readGeometry;


/**
 * @inheritDoc
 */
GeoJSON.prototype.readGeometryFromObject = function(object, opt_options) {
  return readGeometry(/** @type {GeoJSONGeometry} */ (object), opt_options);
};


/**
 * Read the projection from a GeoJSON source.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @return {module:ol/proj/Projection} Projection.
 * @api
 */
GeoJSON.prototype.readProjection;


/**
 * @inheritDoc
 */
GeoJSON.prototype.readProjectionFromObject = function(object) {
  const geoJSONObject = /** @type {GeoJSONObject} */ (object);
  const crs = geoJSONObject.crs;
  let projection;
  if (crs) {
    if (crs.type == 'name') {
      projection = getProjection(crs.properties.name);
    } else {
      assert(false, 36); // Unknown SRS type
    }
  } else {
    projection = this.dataProjection;
  }
  return (
    /** @type {module:ol/proj/Projection} */ (projection)
  );
};


/**
 * Encode a feature as a GeoJSON Feature string.
 *
 * @function
 * @param {module:ol/Feature} feature Feature.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @return {string} GeoJSON.
 * @override
 * @api
 */
GeoJSON.prototype.writeFeature;


/**
 * Encode a feature as a GeoJSON Feature object.
 *
 * @param {module:ol/Feature} feature Feature.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @return {GeoJSONFeature} Object.
 * @override
 * @api
 */
GeoJSON.prototype.writeFeatureObject = function(feature, opt_options) {
  opt_options = this.adaptOptions(opt_options);

  const object = /** @type {GeoJSONFeature} */ ({
    'type': 'Feature'
  });
  const id = feature.getId();
  if (id !== undefined) {
    object.id = id;
  }
  const geometry = feature.getGeometry();
  if (geometry) {
    object.geometry = writeGeometry(geometry, opt_options);
  } else {
    object.geometry = null;
  }
  const properties = feature.getProperties();
  delete properties[feature.getGeometryName()];
  if (!isEmpty(properties)) {
    object.properties = properties;
  } else {
    object.properties = null;
  }
  return object;
};


/**
 * Encode an array of features as GeoJSON.
 *
 * @function
 * @param {Array.<module:ol/Feature>} features Features.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @return {string} GeoJSON.
 * @api
 */
GeoJSON.prototype.writeFeatures;


/**
 * Encode an array of features as a GeoJSON object.
 *
 * @param {Array.<module:ol/Feature>} features Features.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @return {GeoJSONFeatureCollection} GeoJSON Object.
 * @override
 * @api
 */
GeoJSON.prototype.writeFeaturesObject = function(features, opt_options) {
  opt_options = this.adaptOptions(opt_options);
  const objects = [];
  for (let i = 0, ii = features.length; i < ii; ++i) {
    objects.push(this.writeFeatureObject(features[i], opt_options));
  }
  return /** @type {GeoJSONFeatureCollection} */ ({
    type: 'FeatureCollection',
    features: objects
  });
};


/**
 * Encode a geometry as a GeoJSON string.
 *
 * @function
 * @param {module:ol/geom/Geometry} geometry Geometry.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @return {string} GeoJSON.
 * @api
 */
GeoJSON.prototype.writeGeometry;


/**
 * Encode a geometry as a GeoJSON object.
 *
 * @param {module:ol/geom/Geometry} geometry Geometry.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @return {GeoJSONGeometry|GeoJSONGeometryCollection} Object.
 * @override
 * @api
 */
GeoJSON.prototype.writeGeometryObject = function(geometry, opt_options) {
  return writeGeometry(geometry, this.adaptOptions(opt_options));
};
export default GeoJSON;
