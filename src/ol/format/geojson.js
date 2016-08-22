// TODO: serialize dataProjection as crs member when writing
// see https://github.com/openlayers/ol3/issues/2078

goog.provide('ol.format.GeoJSON');

goog.require('ol');
goog.require('ol.asserts');
goog.require('ol.Feature');
goog.require('ol.format.Feature');
goog.require('ol.format.JSONFeature');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.obj');
goog.require('ol.proj');


/**
 * @classdesc
 * Feature format for reading and writing data in the GeoJSON format.
 *
 * @constructor
 * @extends {ol.format.JSONFeature}
 * @param {olx.format.GeoJSONOptions=} opt_options Options.
 * @api stable
 */
ol.format.GeoJSON = function(opt_options) {

  var options = opt_options ? opt_options : {};

  ol.format.JSONFeature.call(this);

  /**
   * @inheritDoc
   */
  this.defaultDataProjection = ol.proj.get(
      options.defaultDataProjection ?
          options.defaultDataProjection : 'EPSG:4326');


  /**
   * Name of the geometry attribute for features.
   * @type {string|undefined}
   * @private
   */
  this.geometryName_ = options.geometryName;

};
ol.inherits(ol.format.GeoJSON, ol.format.JSONFeature);


/**
 * @const
 * @type {Array.<string>}
 * @private
 */
ol.format.GeoJSON.EXTENSIONS_ = ['.geojson'];


/**
 * @param {GeoJSONGeometry|GeoJSONGeometryCollection} object Object.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @private
 * @return {ol.geom.Geometry} Geometry.
 */
ol.format.GeoJSON.readGeometry_ = function(object, opt_options) {
  if (!object) {
    return null;
  }
  var geometryReader = ol.format.GeoJSON.GEOMETRY_READERS_[object.type];
  return /** @type {ol.geom.Geometry} */ (
      ol.format.Feature.transformWithOptions(
          geometryReader(object), false, opt_options));
};


/**
 * @param {GeoJSONGeometryCollection} object Object.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @private
 * @return {ol.geom.GeometryCollection} Geometry collection.
 */
ol.format.GeoJSON.readGeometryCollectionGeometry_ = function(
    object, opt_options) {
  goog.DEBUG && console.assert(object.type == 'GeometryCollection',
      'object.type should be GeometryCollection');
  var geometries = object.geometries.map(
      /**
       * @param {GeoJSONGeometry} geometry Geometry.
       * @return {ol.geom.Geometry} geometry Geometry.
       */
      function(geometry) {
        return ol.format.GeoJSON.readGeometry_(geometry, opt_options);
      });
  return new ol.geom.GeometryCollection(geometries);
};


/**
 * @param {GeoJSONGeometry} object Object.
 * @private
 * @return {ol.geom.Point} Point.
 */
ol.format.GeoJSON.readPointGeometry_ = function(object) {
  goog.DEBUG && console.assert(object.type == 'Point',
      'object.type should be Point');
  return new ol.geom.Point(object.coordinates);
};


/**
 * @param {GeoJSONGeometry} object Object.
 * @private
 * @return {ol.geom.LineString} LineString.
 */
ol.format.GeoJSON.readLineStringGeometry_ = function(object) {
  goog.DEBUG && console.assert(object.type == 'LineString',
      'object.type should be LineString');
  return new ol.geom.LineString(object.coordinates);
};


/**
 * @param {GeoJSONGeometry} object Object.
 * @private
 * @return {ol.geom.MultiLineString} MultiLineString.
 */
ol.format.GeoJSON.readMultiLineStringGeometry_ = function(object) {
  goog.DEBUG && console.assert(object.type == 'MultiLineString',
      'object.type should be MultiLineString');
  return new ol.geom.MultiLineString(object.coordinates);
};


/**
 * @param {GeoJSONGeometry} object Object.
 * @private
 * @return {ol.geom.MultiPoint} MultiPoint.
 */
ol.format.GeoJSON.readMultiPointGeometry_ = function(object) {
  goog.DEBUG && console.assert(object.type == 'MultiPoint',
      'object.type should be MultiPoint');
  return new ol.geom.MultiPoint(object.coordinates);
};


/**
 * @param {GeoJSONGeometry} object Object.
 * @private
 * @return {ol.geom.MultiPolygon} MultiPolygon.
 */
ol.format.GeoJSON.readMultiPolygonGeometry_ = function(object) {
  goog.DEBUG && console.assert(object.type == 'MultiPolygon',
      'object.type should be MultiPolygon');
  return new ol.geom.MultiPolygon(object.coordinates);
};


/**
 * @param {GeoJSONGeometry} object Object.
 * @private
 * @return {ol.geom.Polygon} Polygon.
 */
ol.format.GeoJSON.readPolygonGeometry_ = function(object) {
  goog.DEBUG && console.assert(object.type == 'Polygon',
      'object.type should be Polygon');
  return new ol.geom.Polygon(object.coordinates);
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @private
 * @return {GeoJSONGeometry|GeoJSONGeometryCollection} GeoJSON geometry.
 */
ol.format.GeoJSON.writeGeometry_ = function(geometry, opt_options) {
  var geometryWriter = ol.format.GeoJSON.GEOMETRY_WRITERS_[geometry.getType()];
  return geometryWriter(/** @type {ol.geom.Geometry} */ (
      ol.format.Feature.transformWithOptions(geometry, true, opt_options)),
      opt_options);
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @private
 * @return {GeoJSONGeometryCollection} Empty GeoJSON geometry collection.
 */
ol.format.GeoJSON.writeEmptyGeometryCollectionGeometry_ = function(geometry) {
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
ol.format.GeoJSON.writeGeometryCollectionGeometry_ = function(
    geometry, opt_options) {
  var geometries = geometry.getGeometriesArray().map(function(geometry) {
    var options = ol.obj.assign({}, opt_options);
    delete options.featureProjection;
    return ol.format.GeoJSON.writeGeometry_(geometry, options);
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
ol.format.GeoJSON.writeLineStringGeometry_ = function(geometry, opt_options) {
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
ol.format.GeoJSON.writeMultiLineStringGeometry_ = function(geometry, opt_options) {
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
ol.format.GeoJSON.writeMultiPointGeometry_ = function(geometry, opt_options) {
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
ol.format.GeoJSON.writeMultiPolygonGeometry_ = function(geometry, opt_options) {
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
ol.format.GeoJSON.writePointGeometry_ = function(geometry, opt_options) {
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
ol.format.GeoJSON.writePolygonGeometry_ = function(geometry, opt_options) {
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
ol.format.GeoJSON.GEOMETRY_READERS_ = {
  'Point': ol.format.GeoJSON.readPointGeometry_,
  'LineString': ol.format.GeoJSON.readLineStringGeometry_,
  'Polygon': ol.format.GeoJSON.readPolygonGeometry_,
  'MultiPoint': ol.format.GeoJSON.readMultiPointGeometry_,
  'MultiLineString': ol.format.GeoJSON.readMultiLineStringGeometry_,
  'MultiPolygon': ol.format.GeoJSON.readMultiPolygonGeometry_,
  'GeometryCollection': ol.format.GeoJSON.readGeometryCollectionGeometry_
};


/**
 * @const
 * @private
 * @type {Object.<string, function(ol.geom.Geometry, olx.format.WriteOptions=): (GeoJSONGeometry|GeoJSONGeometryCollection)>}
 */
ol.format.GeoJSON.GEOMETRY_WRITERS_ = {
  'Point': ol.format.GeoJSON.writePointGeometry_,
  'LineString': ol.format.GeoJSON.writeLineStringGeometry_,
  'Polygon': ol.format.GeoJSON.writePolygonGeometry_,
  'MultiPoint': ol.format.GeoJSON.writeMultiPointGeometry_,
  'MultiLineString': ol.format.GeoJSON.writeMultiLineStringGeometry_,
  'MultiPolygon': ol.format.GeoJSON.writeMultiPolygonGeometry_,
  'GeometryCollection': ol.format.GeoJSON.writeGeometryCollectionGeometry_,
  'Circle': ol.format.GeoJSON.writeEmptyGeometryCollectionGeometry_
};


/**
 * @inheritDoc
 */
ol.format.GeoJSON.prototype.getExtensions = function() {
  return ol.format.GeoJSON.EXTENSIONS_;
};


/**
 * Read a feature from a GeoJSON Feature source.  Only works for Feature,
 * use `readFeatures` to read FeatureCollection source.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {ol.Feature} Feature.
 * @api stable
 */
ol.format.GeoJSON.prototype.readFeature;


/**
 * Read all features from a GeoJSON source.  Works with both Feature and
 * FeatureCollection sources.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {Array.<ol.Feature>} Features.
 * @api stable
 */
ol.format.GeoJSON.prototype.readFeatures;


/**
 * @inheritDoc
 */
ol.format.GeoJSON.prototype.readFeatureFromObject = function(
    object, opt_options) {
  var geoJSONFeature = /** @type {GeoJSONFeature} */ (object);
  goog.DEBUG && console.assert(geoJSONFeature.type == 'Feature',
      'geoJSONFeature.type should be Feature');
  var geometry = ol.format.GeoJSON.readGeometry_(geoJSONFeature.geometry,
      opt_options);
  var feature = new ol.Feature();
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
ol.format.GeoJSON.prototype.readFeaturesFromObject = function(
    object, opt_options) {
  var geoJSONObject = /** @type {GeoJSONObject} */ (object);
  /** @type {Array.<ol.Feature>} */
  var features;
  if (geoJSONObject.type == 'Feature') {
    features = [this.readFeatureFromObject(object, opt_options)];
  } else if (geoJSONObject.type == 'FeatureCollection') {
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
    ol.asserts.assert(false, 35); // Unknown GeoJSON object type
  }
  return /** Array.<ol.Feature> */ (features);
};


/**
 * Read a geometry from a GeoJSON source.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {ol.geom.Geometry} Geometry.
 * @api stable
 */
ol.format.GeoJSON.prototype.readGeometry;


/**
 * @inheritDoc
 */
ol.format.GeoJSON.prototype.readGeometryFromObject = function(
    object, opt_options) {
  return ol.format.GeoJSON.readGeometry_(
      /** @type {GeoJSONGeometry} */ (object), opt_options);
};


/**
 * Read the projection from a GeoJSON source.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @return {ol.proj.Projection} Projection.
 * @api stable
 */
ol.format.GeoJSON.prototype.readProjection;


/**
 * @inheritDoc
 */
ol.format.GeoJSON.prototype.readProjectionFromObject = function(object) {
  var geoJSONObject = /** @type {GeoJSONObject} */ (object);
  var crs = geoJSONObject.crs;
  var projection;
  if (crs) {
    if (crs.type == 'name') {
      projection = ol.proj.get(crs.properties.name);
    } else if (crs.type == 'EPSG') {
      // 'EPSG' is not part of the GeoJSON specification, but is generated by
      // GeoServer.
      // TODO: remove this when http://jira.codehaus.org/browse/GEOS-5996
      // is fixed and widely deployed.
      projection = ol.proj.get('EPSG:' + crs.properties.code);
    } else {
      ol.asserts.assert(false, 36); // Unknown SRS type
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
 * @api stable
 */
ol.format.GeoJSON.prototype.writeFeature;


/**
 * Encode a feature as a GeoJSON Feature object.
 *
 * @param {ol.Feature} feature Feature.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {GeoJSONFeature} Object.
 * @api stable
 */
ol.format.GeoJSON.prototype.writeFeatureObject = function(feature, opt_options) {
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
        ol.format.GeoJSON.writeGeometry_(geometry, opt_options);
  } else {
    object.geometry = null;
  }
  var properties = feature.getProperties();
  delete properties[feature.getGeometryName()];
  if (!ol.obj.isEmpty(properties)) {
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
 * @api stable
 */
ol.format.GeoJSON.prototype.writeFeatures;


/**
 * Encode an array of features as a GeoJSON object.
 *
 * @param {Array.<ol.Feature>} features Features.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {GeoJSONFeatureCollection} GeoJSON Object.
 * @api stable
 */
ol.format.GeoJSON.prototype.writeFeaturesObject = function(features, opt_options) {
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
 * @api stable
 */
ol.format.GeoJSON.prototype.writeGeometry;


/**
 * Encode a geometry as a GeoJSON object.
 *
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {GeoJSONGeometry|GeoJSONGeometryCollection} Object.
 * @api stable
 */
ol.format.GeoJSON.prototype.writeGeometryObject = function(geometry,
    opt_options) {
  return ol.format.GeoJSON.writeGeometry_(geometry,
      this.adaptOptions(opt_options));
};
