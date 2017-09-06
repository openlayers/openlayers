// TODO: serialize dataProjection as crs member when writing
// see https://github.com/openlayers/openlayers/issues/2078

import _ol_ from '../index';
import _ol_asserts_ from '../asserts';
import _ol_Feature_ from '../feature';
import _ol_format_Feature_ from '../format/feature';
import _ol_format_JSONFeature_ from '../format/jsonfeature';
import _ol_geom_GeometryCollection_ from '../geom/geometrycollection';
import _ol_geom_LineString_ from '../geom/linestring';
import _ol_geom_MultiLineString_ from '../geom/multilinestring';
import _ol_geom_MultiPoint_ from '../geom/multipoint';
import _ol_geom_MultiPolygon_ from '../geom/multipolygon';
import _ol_geom_Point_ from '../geom/point';
import _ol_geom_Polygon_ from '../geom/polygon';
import _ol_obj_ from '../obj';
import _ol_proj_ from '../proj';

/**
 * @classdesc
 * Feature format for reading and writing data in the GeoJSON format.
 *
 * @constructor
 * @extends {ol.format.JSONFeature}
 * @param {olx.format.GeoJSONOptions=} opt_options Options.
 * @api
 */
var _ol_format_GeoJSON_ = function(opt_options) {

  var options = opt_options ? opt_options : {};

  _ol_format_JSONFeature_.call(this);

  /**
   * @inheritDoc
   */
  this.defaultDataProjection = _ol_proj_.get(
      options.defaultDataProjection ?
        options.defaultDataProjection : 'EPSG:4326');


  if (options.featureProjection) {
    this.defaultFeatureProjection = _ol_proj_.get(options.featureProjection);
  }

  /**
   * Name of the geometry attribute for features.
   * @type {string|undefined}
   * @private
   */
  this.geometryName_ = options.geometryName;

};

_ol_.inherits(_ol_format_GeoJSON_, _ol_format_JSONFeature_);


/**
 * @param {GeoJSONGeometry|GeoJSONGeometryCollection} object Object.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @private
 * @return {ol.geom.Geometry} Geometry.
 */
_ol_format_GeoJSON_.readGeometry_ = function(object, opt_options) {
  if (!object) {
    return null;
  }
  var geometryReader = _ol_format_GeoJSON_.GEOMETRY_READERS_[object.type];
  return (
    /** @type {ol.geom.Geometry} */ _ol_format_Feature_.transformWithOptions(
        geometryReader(object), false, opt_options)
  );
};


/**
 * @param {GeoJSONGeometryCollection} object Object.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @private
 * @return {ol.geom.GeometryCollection} Geometry collection.
 */
_ol_format_GeoJSON_.readGeometryCollectionGeometry_ = function(
    object, opt_options) {
  var geometries = object.geometries.map(
      /**
       * @param {GeoJSONGeometry} geometry Geometry.
       * @return {ol.geom.Geometry} geometry Geometry.
       */
      function(geometry) {
        return _ol_format_GeoJSON_.readGeometry_(geometry, opt_options);
      });
  return new _ol_geom_GeometryCollection_(geometries);
};


/**
 * @param {GeoJSONGeometry} object Object.
 * @private
 * @return {ol.geom.Point} Point.
 */
_ol_format_GeoJSON_.readPointGeometry_ = function(object) {
  return new _ol_geom_Point_(object.coordinates);
};


/**
 * @param {GeoJSONGeometry} object Object.
 * @private
 * @return {ol.geom.LineString} LineString.
 */
_ol_format_GeoJSON_.readLineStringGeometry_ = function(object) {
  return new _ol_geom_LineString_(object.coordinates);
};


/**
 * @param {GeoJSONGeometry} object Object.
 * @private
 * @return {ol.geom.MultiLineString} MultiLineString.
 */
_ol_format_GeoJSON_.readMultiLineStringGeometry_ = function(object) {
  return new _ol_geom_MultiLineString_(object.coordinates);
};


/**
 * @param {GeoJSONGeometry} object Object.
 * @private
 * @return {ol.geom.MultiPoint} MultiPoint.
 */
_ol_format_GeoJSON_.readMultiPointGeometry_ = function(object) {
  return new _ol_geom_MultiPoint_(object.coordinates);
};


/**
 * @param {GeoJSONGeometry} object Object.
 * @private
 * @return {ol.geom.MultiPolygon} MultiPolygon.
 */
_ol_format_GeoJSON_.readMultiPolygonGeometry_ = function(object) {
  return new _ol_geom_MultiPolygon_(object.coordinates);
};


/**
 * @param {GeoJSONGeometry} object Object.
 * @private
 * @return {ol.geom.Polygon} Polygon.
 */
_ol_format_GeoJSON_.readPolygonGeometry_ = function(object) {
  return new _ol_geom_Polygon_(object.coordinates);
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @private
 * @return {GeoJSONGeometry|GeoJSONGeometryCollection} GeoJSON geometry.
 */
_ol_format_GeoJSON_.writeGeometry_ = function(geometry, opt_options) {
  var geometryWriter = _ol_format_GeoJSON_.GEOMETRY_WRITERS_[geometry.getType()];
  return geometryWriter(/** @type {ol.geom.Geometry} */ (
    _ol_format_Feature_.transformWithOptions(geometry, true, opt_options)),
  opt_options);
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @private
 * @return {GeoJSONGeometryCollection} Empty GeoJSON geometry collection.
 */
_ol_format_GeoJSON_.writeEmptyGeometryCollectionGeometry_ = function(geometry) {
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
_ol_format_GeoJSON_.writeGeometryCollectionGeometry_ = function(
    geometry, opt_options) {
  var geometries = geometry.getGeometriesArray().map(function(geometry) {
    var options = _ol_obj_.assign({}, opt_options);
    delete options.featureProjection;
    return _ol_format_GeoJSON_.writeGeometry_(geometry, options);
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
_ol_format_GeoJSON_.writeLineStringGeometry_ = function(geometry, opt_options) {
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
_ol_format_GeoJSON_.writeMultiLineStringGeometry_ = function(geometry, opt_options) {
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
_ol_format_GeoJSON_.writeMultiPointGeometry_ = function(geometry, opt_options) {
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
_ol_format_GeoJSON_.writeMultiPolygonGeometry_ = function(geometry, opt_options) {
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
_ol_format_GeoJSON_.writePointGeometry_ = function(geometry, opt_options) {
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
_ol_format_GeoJSON_.writePolygonGeometry_ = function(geometry, opt_options) {
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
_ol_format_GeoJSON_.GEOMETRY_READERS_ = {
  'Point': _ol_format_GeoJSON_.readPointGeometry_,
  'LineString': _ol_format_GeoJSON_.readLineStringGeometry_,
  'Polygon': _ol_format_GeoJSON_.readPolygonGeometry_,
  'MultiPoint': _ol_format_GeoJSON_.readMultiPointGeometry_,
  'MultiLineString': _ol_format_GeoJSON_.readMultiLineStringGeometry_,
  'MultiPolygon': _ol_format_GeoJSON_.readMultiPolygonGeometry_,
  'GeometryCollection': _ol_format_GeoJSON_.readGeometryCollectionGeometry_
};


/**
 * @const
 * @private
 * @type {Object.<string, function(ol.geom.Geometry, olx.format.WriteOptions=): (GeoJSONGeometry|GeoJSONGeometryCollection)>}
 */
_ol_format_GeoJSON_.GEOMETRY_WRITERS_ = {
  'Point': _ol_format_GeoJSON_.writePointGeometry_,
  'LineString': _ol_format_GeoJSON_.writeLineStringGeometry_,
  'Polygon': _ol_format_GeoJSON_.writePolygonGeometry_,
  'MultiPoint': _ol_format_GeoJSON_.writeMultiPointGeometry_,
  'MultiLineString': _ol_format_GeoJSON_.writeMultiLineStringGeometry_,
  'MultiPolygon': _ol_format_GeoJSON_.writeMultiPolygonGeometry_,
  'GeometryCollection': _ol_format_GeoJSON_.writeGeometryCollectionGeometry_,
  'Circle': _ol_format_GeoJSON_.writeEmptyGeometryCollectionGeometry_
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
_ol_format_GeoJSON_.prototype.readFeature;


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
_ol_format_GeoJSON_.prototype.readFeatures;


/**
 * @inheritDoc
 */
_ol_format_GeoJSON_.prototype.readFeatureFromObject = function(
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

  var geometry = _ol_format_GeoJSON_.readGeometry_(geoJSONFeature.geometry, opt_options);
  var feature = new _ol_Feature_();
  if (this.geometryName_) {
    feature.setGeometryName(this.geometryName_);
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
_ol_format_GeoJSON_.prototype.readFeaturesFromObject = function(
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
_ol_format_GeoJSON_.prototype.readGeometry;


/**
 * @inheritDoc
 */
_ol_format_GeoJSON_.prototype.readGeometryFromObject = function(
    object, opt_options) {
  return _ol_format_GeoJSON_.readGeometry_(
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
_ol_format_GeoJSON_.prototype.readProjection;


/**
 * @inheritDoc
 */
_ol_format_GeoJSON_.prototype.readProjectionFromObject = function(object) {
  var geoJSONObject = /** @type {GeoJSONObject} */ (object);
  var crs = geoJSONObject.crs;
  var projection;
  if (crs) {
    if (crs.type == 'name') {
      projection = _ol_proj_.get(crs.properties.name);
    } else if (crs.type == 'EPSG') {
      // 'EPSG' is not part of the GeoJSON specification, but is generated by
      // GeoServer.
      // TODO: remove this when http://jira.codehaus.org/browse/GEOS-5996
      // is fixed and widely deployed.
      projection = _ol_proj_.get('EPSG:' + crs.properties.code);
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
_ol_format_GeoJSON_.prototype.writeFeature;


/**
 * Encode a feature as a GeoJSON Feature object.
 *
 * @param {ol.Feature} feature Feature.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {GeoJSONFeature} Object.
 * @override
 * @api
 */
_ol_format_GeoJSON_.prototype.writeFeatureObject = function(feature, opt_options) {
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
        _ol_format_GeoJSON_.writeGeometry_(geometry, opt_options);
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
_ol_format_GeoJSON_.prototype.writeFeatures;


/**
 * Encode an array of features as a GeoJSON object.
 *
 * @param {Array.<ol.Feature>} features Features.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {GeoJSONFeatureCollection} GeoJSON Object.
 * @override
 * @api
 */
_ol_format_GeoJSON_.prototype.writeFeaturesObject = function(features, opt_options) {
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
_ol_format_GeoJSON_.prototype.writeGeometry;


/**
 * Encode a geometry as a GeoJSON object.
 *
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {GeoJSONGeometry|GeoJSONGeometryCollection} Object.
 * @override
 * @api
 */
_ol_format_GeoJSON_.prototype.writeGeometryObject = function(geometry,
    opt_options) {
  return _ol_format_GeoJSON_.writeGeometry_(geometry,
      this.adaptOptions(opt_options));
};
export default _ol_format_GeoJSON_;
