/**
 * @module ol/format/GeoJSON
 */
// TODO: serialize dataProjection as crs member when writing
// see https://github.com/openlayers/openlayers/issues/2078

import {inherits} from '../index.js';
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
 * @classdesc
 * Feature format for reading and writing data in the GeoJSON format.
 *
 * @constructor
 * @extends {ol.format.JSONFeature}
 * @param {olx.format.GeoJSONOptions=} opt_options Options.
 * @api
 */
const GeoJSON = function(opt_options) {

  const options = opt_options ? opt_options : {};

  JSONFeature.call(this);

  /**
   * @inheritDoc
   */
  this.defaultDataProjection = getProjection(
    options.defaultDataProjection ?
      options.defaultDataProjection : 'EPSG:4326');


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
 * @type {Object.<string, function(GeoJSONObject): ol.geom.Geometry>}
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
 * @type {Object.<string, function(ol.geom.Geometry, olx.format.WriteOptions=): (GeoJSONGeometry|GeoJSONGeometryCollection)>}
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
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {ol.geom.Geometry} Geometry.
 */
function readGeometry(object, opt_options) {
  if (!object) {
    return null;
  }
  const geometryReader = GEOMETRY_READERS[object.type];
  return (
    /** @type {ol.geom.Geometry} */ transformWithOptions(
      geometryReader(object), false, opt_options)
  );
}


/**
 * @param {GeoJSONGeometryCollection} object Object.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {ol.geom.GeometryCollection} Geometry collection.
 */
function readGeometryCollectionGeometry(object, opt_options) {
  const geometries = object.geometries.map(
    /**
       * @param {GeoJSONGeometry} geometry Geometry.
       * @return {ol.geom.Geometry} geometry Geometry.
       */
    function(geometry) {
      return readGeometry(geometry, opt_options);
    });
  return new GeometryCollection(geometries);
}


/**
 * @param {GeoJSONGeometry} object Object.
 * @return {ol.geom.Point} Point.
 */
function readPointGeometry(object) {
  return new Point(object.coordinates);
}


/**
 * @param {GeoJSONGeometry} object Object.
 * @return {ol.geom.LineString} LineString.
 */
function readLineStringGeometry(object) {
  return new LineString(object.coordinates);
}


/**
 * @param {GeoJSONGeometry} object Object.
 * @return {ol.geom.MultiLineString} MultiLineString.
 */
function readMultiLineStringGeometry(object) {
  return new MultiLineString(object.coordinates);
}


/**
 * @param {GeoJSONGeometry} object Object.
 * @return {ol.geom.MultiPoint} MultiPoint.
 */
function readMultiPointGeometry(object) {
  return new MultiPoint(object.coordinates);
}


/**
 * @param {GeoJSONGeometry} object Object.
 * @return {ol.geom.MultiPolygon} MultiPolygon.
 */
function readMultiPolygonGeometry(object) {
  return new MultiPolygon(object.coordinates);
}


/**
 * @param {GeoJSONGeometry} object Object.
 * @return {ol.geom.Polygon} Polygon.
 */
function readPolygonGeometry(object) {
  return new Polygon(object.coordinates);
}


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {GeoJSONGeometry|GeoJSONGeometryCollection} GeoJSON geometry.
 */
function writeGeometry(geometry, opt_options) {
  const geometryWriter = GEOMETRY_WRITERS[geometry.getType()];
  return geometryWriter(/** @type {ol.geom.Geometry} */ (
    transformWithOptions(geometry, true, opt_options)), opt_options);
}


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @return {GeoJSONGeometryCollection} Empty GeoJSON geometry collection.
 */
function writeEmptyGeometryCollectionGeometry(geometry) {
  return /** @type {GeoJSONGeometryCollection} */ ({
    type: 'GeometryCollection',
    geometries: []
  });
}


/**
 * @param {ol.geom.GeometryCollection} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
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
 * @param {ol.geom.LineString} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
function writeLineStringGeometry(geometry, opt_options) {
  return /** @type {GeoJSONGeometry} */ ({
    type: 'LineString',
    coordinates: geometry.getCoordinates()
  });
}


/**
 * @param {ol.geom.MultiLineString} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
function writeMultiLineStringGeometry(geometry, opt_options) {
  return /** @type {GeoJSONGeometry} */ ({
    type: 'MultiLineString',
    coordinates: geometry.getCoordinates()
  });
}


/**
 * @param {ol.geom.MultiPoint} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
function writeMultiPointGeometry(geometry, opt_options) {
  return /** @type {GeoJSONGeometry} */ ({
    type: 'MultiPoint',
    coordinates: geometry.getCoordinates()
  });
}


/**
 * @param {ol.geom.MultiPolygon} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
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
 * @param {ol.geom.Point} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
function writePointGeometry(geometry, opt_options) {
  return /** @type {GeoJSONGeometry} */ ({
    type: 'Point',
    coordinates: geometry.getCoordinates()
  });
}


/**
 * @param {ol.geom.Polygon} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
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
 * geometry types.  Use {@link ol.format.GeoJSON#readFeatures} to read
 * FeatureCollection source. If feature at source has an id, it will be used
 * as Feature id by calling {@link ol.Feature#setId} internally.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {ol.Feature} Feature.
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
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {Array.<ol.Feature>} Features.
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
  /** @type {Array.<ol.Feature>} */
  let features = null;
  if (geoJSONObject.type === 'FeatureCollection') {
    const geoJSONFeatureCollection = /** @type {GeoJSONFeatureCollection} */
        (object);
    features = [];
    const geoJSONFeatures = geoJSONFeatureCollection.features;
    let i, ii;
    for (i = 0, ii = geoJSONFeatures.length; i < ii; ++i) {
      features.push(this.readFeatureFromObject(geoJSONFeatures[i],
        opt_options));
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
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {ol.geom.Geometry} Geometry.
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
 * @return {ol.proj.Projection} Projection.
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
    projection = this.defaultDataProjection;
  }
  return /** @type {ol.proj.Projection} */ (projection);
};


/**
 * Encode a feature as a GeoJSON Feature string.
 *
 * @function
 * @param {ol.Feature} feature Feature.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {string} GeoJSON.
 * @override
 * @api
 */
GeoJSON.prototype.writeFeature;


/**
 * Encode a feature as a GeoJSON Feature object.
 *
 * @param {ol.Feature} feature Feature.
 * @param {olx.format.WriteOptions=} opt_options Write options.
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
 * @param {Array.<ol.Feature>} features Features.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {string} GeoJSON.
 * @api
 */
GeoJSON.prototype.writeFeatures;


/**
 * Encode an array of features as a GeoJSON object.
 *
 * @param {Array.<ol.Feature>} features Features.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {GeoJSONFeatureCollection} GeoJSON Object.
 * @override
 * @api
 */
GeoJSON.prototype.writeFeaturesObject = function(features, opt_options) {
  opt_options = this.adaptOptions(opt_options);
  const objects = [];
  let i, ii;
  for (i = 0, ii = features.length; i < ii; ++i) {
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
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {string} GeoJSON.
 * @api
 */
GeoJSON.prototype.writeGeometry;


/**
 * Encode a geometry as a GeoJSON object.
 *
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {GeoJSONGeometry|GeoJSONGeometryCollection} Object.
 * @override
 * @api
 */
GeoJSON.prototype.writeGeometryObject = function(geometry, opt_options) {
  return writeGeometry(geometry, this.adaptOptions(opt_options));
};
export default GeoJSON;
