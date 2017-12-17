/**
 * @module ol/format/GeoJSON
 */
// TODO: serialize dataProjection as crs member when writing
// see https://github.com/openlayers/openlayers/issues/2078

import {inherits} from '../index.js';
import _ol_asserts_ from '../asserts.js';
import _ol_Feature_ from '../Feature.js';
import FeatureFormat from '../format/Feature.js';
import JSONFeature from '../format/JSONFeature.js';
import GeometryCollection from '../geom/GeometryCollection.js';
import LineString from '../geom/LineString.js';
import MultiLineString from '../geom/MultiLineString.js';
import MultiPoint from '../geom/MultiPoint.js';
import MultiPolygon from '../geom/MultiPolygon.js';
import Point from '../geom/Point.js';
import Polygon from '../geom/Polygon.js';
import _ol_obj_ from '../obj.js';
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
var GeoJSON = function(opt_options) {

  var options = opt_options ? opt_options : {};

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
 * @param {GeoJSONGeometry|GeoJSONGeometryCollection} object Object.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @private
 * @return {ol.geom.Geometry} Geometry.
 */
GeoJSON.readGeometry_ = function(object, opt_options) {
  if (!object) {
    return null;
  }
  var geometryReader = GeoJSON.GEOMETRY_READERS_[object.type];
  return (
    /** @type {ol.geom.Geometry} */ FeatureFormat.transformWithOptions(
        geometryReader(object), false, opt_options)
  );
};


/**
 * @param {GeoJSONGeometryCollection} object Object.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @private
 * @return {ol.geom.GeometryCollection} Geometry collection.
 */
GeoJSON.readGeometryCollectionGeometry_ = function(
    object, opt_options) {
  var geometries = object.geometries.map(
      /**
       * @param {GeoJSONGeometry} geometry Geometry.
       * @return {ol.geom.Geometry} geometry Geometry.
       */
      function(geometry) {
        return GeoJSON.readGeometry_(geometry, opt_options);
      });
  return new GeometryCollection(geometries);
};


/**
 * @param {GeoJSONGeometry} object Object.
 * @private
 * @return {ol.geom.Point} Point.
 */
GeoJSON.readPointGeometry_ = function(object) {
  return new Point(object.coordinates);
};


/**
 * @param {GeoJSONGeometry} object Object.
 * @private
 * @return {ol.geom.LineString} LineString.
 */
GeoJSON.readLineStringGeometry_ = function(object) {
  return new LineString(object.coordinates);
};


/**
 * @param {GeoJSONGeometry} object Object.
 * @private
 * @return {ol.geom.MultiLineString} MultiLineString.
 */
GeoJSON.readMultiLineStringGeometry_ = function(object) {
  return new MultiLineString(object.coordinates);
};


/**
 * @param {GeoJSONGeometry} object Object.
 * @private
 * @return {ol.geom.MultiPoint} MultiPoint.
 */
GeoJSON.readMultiPointGeometry_ = function(object) {
  return new MultiPoint(object.coordinates);
};


/**
 * @param {GeoJSONGeometry} object Object.
 * @private
 * @return {ol.geom.MultiPolygon} MultiPolygon.
 */
GeoJSON.readMultiPolygonGeometry_ = function(object) {
  return new MultiPolygon(object.coordinates);
};


/**
 * @param {GeoJSONGeometry} object Object.
 * @private
 * @return {ol.geom.Polygon} Polygon.
 */
GeoJSON.readPolygonGeometry_ = function(object) {
  return new Polygon(object.coordinates);
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @private
 * @return {GeoJSONGeometry|GeoJSONGeometryCollection} GeoJSON geometry.
 */
GeoJSON.writeGeometry_ = function(geometry, opt_options) {
  var geometryWriter = GeoJSON.GEOMETRY_WRITERS_[geometry.getType()];
  return geometryWriter(/** @type {ol.geom.Geometry} */ (
    FeatureFormat.transformWithOptions(geometry, true, opt_options)),
  opt_options);
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @private
 * @return {GeoJSONGeometryCollection} Empty GeoJSON geometry collection.
 */
GeoJSON.writeEmptyGeometryCollectionGeometry_ = function(geometry) {
  return /** @type {GeoJSONGeometryCollection} */ ({
    type: 'GeometryCollection',
    geometries: []
  });
};


/**
 * @param {ol.geom.GeometryCollection} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @private
 * @return {GeoJSONGeometryCollection} GeoJSON geometry collection.
 */
GeoJSON.writeGeometryCollectionGeometry_ = function(
    geometry, opt_options) {
  var geometries = geometry.getGeometriesArray().map(function(geometry) {
    var options = _ol_obj_.assign({}, opt_options);
    delete options.featureProjection;
    return GeoJSON.writeGeometry_(geometry, options);
  });
  return /** @type {GeoJSONGeometryCollection} */ ({
    type: 'GeometryCollection',
    geometries: geometries
  });
};


/**
 * @param {ol.geom.LineString} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @private
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
GeoJSON.writeLineStringGeometry_ = function(geometry, opt_options) {
  return /** @type {GeoJSONGeometry} */ ({
    type: 'LineString',
    coordinates: geometry.getCoordinates()
  });
};


/**
 * @param {ol.geom.MultiLineString} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @private
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
GeoJSON.writeMultiLineStringGeometry_ = function(geometry, opt_options) {
  return /** @type {GeoJSONGeometry} */ ({
    type: 'MultiLineString',
    coordinates: geometry.getCoordinates()
  });
};


/**
 * @param {ol.geom.MultiPoint} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @private
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
GeoJSON.writeMultiPointGeometry_ = function(geometry, opt_options) {
  return /** @type {GeoJSONGeometry} */ ({
    type: 'MultiPoint',
    coordinates: geometry.getCoordinates()
  });
};


/**
 * @param {ol.geom.MultiPolygon} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @private
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
GeoJSON.writeMultiPolygonGeometry_ = function(geometry, opt_options) {
  var right;
  if (opt_options) {
    right = opt_options.rightHanded;
  }
  return /** @type {GeoJSONGeometry} */ ({
    type: 'MultiPolygon',
    coordinates: geometry.getCoordinates(right)
  });
};


/**
 * @param {ol.geom.Point} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @private
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
GeoJSON.writePointGeometry_ = function(geometry, opt_options) {
  return /** @type {GeoJSONGeometry} */ ({
    type: 'Point',
    coordinates: geometry.getCoordinates()
  });
};


/**
 * @param {ol.geom.Polygon} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @private
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
GeoJSON.writePolygonGeometry_ = function(geometry, opt_options) {
  var right;
  if (opt_options) {
    right = opt_options.rightHanded;
  }
  return /** @type {GeoJSONGeometry} */ ({
    type: 'Polygon',
    coordinates: geometry.getCoordinates(right)
  });
};


/**
 * @const
 * @private
 * @type {Object.<string, function(GeoJSONObject): ol.geom.Geometry>}
 */
GeoJSON.GEOMETRY_READERS_ = {
  'Point': GeoJSON.readPointGeometry_,
  'LineString': GeoJSON.readLineStringGeometry_,
  'Polygon': GeoJSON.readPolygonGeometry_,
  'MultiPoint': GeoJSON.readMultiPointGeometry_,
  'MultiLineString': GeoJSON.readMultiLineStringGeometry_,
  'MultiPolygon': GeoJSON.readMultiPolygonGeometry_,
  'GeometryCollection': GeoJSON.readGeometryCollectionGeometry_
};


/**
 * @const
 * @private
 * @type {Object.<string, function(ol.geom.Geometry, olx.format.WriteOptions=): (GeoJSONGeometry|GeoJSONGeometryCollection)>}
 */
GeoJSON.GEOMETRY_WRITERS_ = {
  'Point': GeoJSON.writePointGeometry_,
  'LineString': GeoJSON.writeLineStringGeometry_,
  'Polygon': GeoJSON.writePolygonGeometry_,
  'MultiPoint': GeoJSON.writeMultiPointGeometry_,
  'MultiLineString': GeoJSON.writeMultiLineStringGeometry_,
  'MultiPolygon': GeoJSON.writeMultiPolygonGeometry_,
  'GeometryCollection': GeoJSON.writeGeometryCollectionGeometry_,
  'Circle': GeoJSON.writeEmptyGeometryCollectionGeometry_
};


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
GeoJSON.prototype.readFeatureFromObject = function(
    object, opt_options) {
  /**
   * @type {GeoJSONFeature}
   */
  var geoJSONFeature = null;
  if (object.type === 'Feature') {
    geoJSONFeature = /** @type {GeoJSONFeature} */ (object);
  } else {
    geoJSONFeature = /** @type {GeoJSONFeature} */ ({
      type: 'Feature',
      geometry: /** @type {GeoJSONGeometry|GeoJSONGeometryCollection} */ (object)
    });
  }

  var geometry = GeoJSON.readGeometry_(geoJSONFeature.geometry, opt_options);
  var feature = new _ol_Feature_();
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
GeoJSON.prototype.readFeaturesFromObject = function(
    object, opt_options) {
  var geoJSONObject = /** @type {GeoJSONObject} */ (object);
  /** @type {Array.<ol.Feature>} */
  var features = null;
  if (geoJSONObject.type === 'FeatureCollection') {
    var geoJSONFeatureCollection = /** @type {GeoJSONFeatureCollection} */
        (object);
    features = [];
    var geoJSONFeatures = geoJSONFeatureCollection.features;
    var i, ii;
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
GeoJSON.prototype.readGeometryFromObject = function(
    object, opt_options) {
  return GeoJSON.readGeometry_(
      /** @type {GeoJSONGeometry} */ (object), opt_options);
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
  var geoJSONObject = /** @type {GeoJSONObject} */ (object);
  var crs = geoJSONObject.crs;
  var projection;
  if (crs) {
    if (crs.type == 'name') {
      projection = getProjection(crs.properties.name);
    } else {
      _ol_asserts_.assert(false, 36); // Unknown SRS type
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

  var object = /** @type {GeoJSONFeature} */ ({
    'type': 'Feature'
  });
  var id = feature.getId();
  if (id !== undefined) {
    object.id = id;
  }
  var geometry = feature.getGeometry();
  if (geometry) {
    object.geometry =
        GeoJSON.writeGeometry_(geometry, opt_options);
  } else {
    object.geometry = null;
  }
  var properties = feature.getProperties();
  delete properties[feature.getGeometryName()];
  if (!_ol_obj_.isEmpty(properties)) {
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
  var objects = [];
  var i, ii;
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
GeoJSON.prototype.writeGeometryObject = function(geometry,
    opt_options) {
  return GeoJSON.writeGeometry_(geometry,
      this.adaptOptions(opt_options));
};
export default GeoJSON;
