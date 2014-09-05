// FIXME coordinate order
// FIXME reprojection

goog.provide('ol.format.GeoJSON');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.object');
goog.require('ol.Feature');
goog.require('ol.format.Feature');
goog.require('ol.format.JSONFeature');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
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

  var options = goog.isDef(opt_options) ? opt_options : {};

  goog.base(this);

  /**
   * @inheritDoc
   */
  this.defaultDataProjection = ol.proj.get(
      goog.isDefAndNotNull(options.defaultDataProjection) ?
          options.defaultDataProjection : 'EPSG:4326');


  /**
   * Name of the geometry attribute for features.
   * @type {string|undefined}
   * @private
   */
  this.geometryName_ = options.geometryName;

};
goog.inherits(ol.format.GeoJSON, ol.format.JSONFeature);


/**
 * @const
 * @type {Array.<string>}
 * @private
 */
ol.format.GeoJSON.EXTENSIONS_ = ['.geojson'];


/**
 * @param {GeoJSONObject} object Object.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @private
 * @return {ol.geom.Geometry} Geometry.
 */
ol.format.GeoJSON.readGeometry_ = function(object, opt_options) {
  if (goog.isNull(object)) {
    return null;
  }
  var geometryReader = ol.format.GeoJSON.GEOMETRY_READERS_[object.type];
  goog.asserts.assert(goog.isDef(geometryReader));
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
  goog.asserts.assert(object.type == 'GeometryCollection');
  var geometries = goog.array.map(object.geometries,
      /**
       * @param {GeoJSONObject} geometry Geometry.
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
  goog.asserts.assert(object.type == 'Point');
  return new ol.geom.Point(object.coordinates);
};


/**
 * @param {GeoJSONGeometry} object Object.
 * @private
 * @return {ol.geom.LineString} LineString.
 */
ol.format.GeoJSON.readLineStringGeometry_ = function(object) {
  goog.asserts.assert(object.type == 'LineString');
  return new ol.geom.LineString(object.coordinates);
};


/**
 * @param {GeoJSONGeometry} object Object.
 * @private
 * @return {ol.geom.MultiLineString} MultiLineString.
 */
ol.format.GeoJSON.readMultiLineStringGeometry_ = function(object) {
  goog.asserts.assert(object.type == 'MultiLineString');
  return new ol.geom.MultiLineString(object.coordinates);
};


/**
 * @param {GeoJSONGeometry} object Object.
 * @private
 * @return {ol.geom.MultiPoint} MultiPoint.
 */
ol.format.GeoJSON.readMultiPointGeometry_ = function(object) {
  goog.asserts.assert(object.type == 'MultiPoint');
  return new ol.geom.MultiPoint(object.coordinates);
};


/**
 * @param {GeoJSONGeometry} object Object.
 * @private
 * @return {ol.geom.MultiPolygon} MultiPolygon.
 */
ol.format.GeoJSON.readMultiPolygonGeometry_ = function(object) {
  goog.asserts.assert(object.type == 'MultiPolygon');
  return new ol.geom.MultiPolygon(object.coordinates);
};


/**
 * @param {GeoJSONGeometry} object Object.
 * @private
 * @return {ol.geom.Polygon} Polygon.
 */
ol.format.GeoJSON.readPolygonGeometry_ = function(object) {
  goog.asserts.assert(object.type == 'Polygon');
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
  goog.asserts.assert(goog.isDef(geometryWriter));
  return geometryWriter(/** @type {ol.geom.Geometry} */ (
      ol.format.Feature.transformWithOptions(geometry, true, opt_options)));
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @private
 * @return {GeoJSONGeometryCollection} Empty GeoJSON geometry collection.
 */
ol.format.GeoJSON.writeEmptyGeometryCollectionGeometry_ = function(geometry) {
  return /** @type {GeoJSONGeometryCollection} */ ({
    'type': 'GeometryCollection',
    'geometries': []
  });
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @private
 * @return {GeoJSONGeometryCollection} GeoJSON geometry collection.
 */
ol.format.GeoJSON.writeGeometryCollectionGeometry_ = function(
    geometry, opt_options) {
  goog.asserts.assertInstanceof(geometry, ol.geom.GeometryCollection);
  var geometries = goog.array.map(
      geometry.getGeometriesArray(), function(geometry) {
        return ol.format.GeoJSON.writeGeometry_(geometry, opt_options);
      });
  return /** @type {GeoJSONGeometryCollection} */ ({
    'type': 'GeometryCollection',
    'geometries': geometries
  });
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @private
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
ol.format.GeoJSON.writeLineStringGeometry_ = function(geometry) {
  goog.asserts.assertInstanceof(geometry, ol.geom.LineString);
  return /** @type {GeoJSONGeometry} */ ({
    'type': 'LineString',
    'coordinates': geometry.getCoordinates()
  });
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @private
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
ol.format.GeoJSON.writeMultiLineStringGeometry_ = function(geometry) {
  goog.asserts.assertInstanceof(geometry, ol.geom.MultiLineString);
  goog.asserts.assert(
      geometry.getType() == ol.geom.GeometryType.MULTI_LINE_STRING);
  return /** @type {GeoJSONGeometry} */ ({
    'type': 'MultiLineString',
    'coordinates': geometry.getCoordinates()
  });
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @private
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
ol.format.GeoJSON.writeMultiPointGeometry_ = function(geometry) {
  goog.asserts.assertInstanceof(geometry, ol.geom.MultiPoint);
  return /** @type {GeoJSONGeometry} */ ({
    'type': 'MultiPoint',
    'coordinates': geometry.getCoordinates()
  });
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @private
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
ol.format.GeoJSON.writeMultiPolygonGeometry_ = function(geometry) {
  goog.asserts.assertInstanceof(geometry, ol.geom.MultiPolygon);
  return /** @type {GeoJSONGeometry} */ ({
    'type': 'MultiPolygon',
    'coordinates': geometry.getCoordinates()
  });
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @private
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
ol.format.GeoJSON.writePointGeometry_ = function(geometry) {
  goog.asserts.assertInstanceof(geometry, ol.geom.Point);
  return /** @type {GeoJSONGeometry} */ ({
    'type': 'Point',
    'coordinates': geometry.getCoordinates()
  });
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @private
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
ol.format.GeoJSON.writePolygonGeometry_ = function(geometry) {
  goog.asserts.assertInstanceof(geometry, ol.geom.Polygon);
  return /** @type {GeoJSONGeometry} */ ({
    'type': 'Polygon',
    'coordinates': geometry.getCoordinates()
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
 * @type {Object.<string, function(ol.geom.Geometry): (GeoJSONGeometry|GeoJSONGeometryCollection)>}
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
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
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
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
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
  goog.asserts.assert(geoJSONFeature.type == 'Feature');
  var geometry = ol.format.GeoJSON.readGeometry_(geoJSONFeature.geometry,
      opt_options);
  var feature = new ol.Feature();
  if (goog.isDef(this.geometryName_)) {
    feature.setGeometryName(this.geometryName_);
  }
  feature.setGeometry(geometry);
  if (goog.isDef(geoJSONFeature.id)) {
    feature.setId(geoJSONFeature.id);
  }
  if (goog.isDef(geoJSONFeature.properties)) {
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
  if (geoJSONObject.type == 'Feature') {
    return [this.readFeatureFromObject(object, opt_options)];
  } else if (geoJSONObject.type == 'FeatureCollection') {
    var geoJSONFeatureCollection = /** @type {GeoJSONFeatureCollection} */
        (object);
    /** @type {Array.<ol.Feature>} */
    var features = [];
    var geoJSONFeatures = geoJSONFeatureCollection.features;
    var i, ii;
    for (i = 0, ii = geoJSONFeatures.length; i < ii; ++i) {
      features.push(this.readFeatureFromObject(geoJSONFeatures[i],
          opt_options));
    }
    return features;
  } else {
    goog.asserts.fail();
    return [];
  }
};


/**
 * Read a geometry from a GeoJSON source.
 *
 * @function
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
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
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
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
  if (goog.isDefAndNotNull(crs)) {
    if (crs.type == 'name') {
      return ol.proj.get(crs.properties.name);
    } else if (crs.type == 'EPSG') {
      // 'EPSG' is not part of the GeoJSON specification, but is generated by
      // GeoServer.
      // TODO: remove this when http://jira.codehaus.org/browse/GEOS-5996
      // is fixed and widely deployed.
      return ol.proj.get('EPSG:' + crs.properties.code);
    } else {
      goog.asserts.fail();
      return null;
    }
  } else {
    return this.defaultDataProjection;
  }
};


/**
 * Encode a feature as a GeoJSON Feature object.
 *
 * @function
 * @param {ol.Feature} feature Feature.
 * @param {olx.format.WriteOptions} options Write options.
 * @return {GeoJSONFeature} GeoJSON.
 * @api stable
 */
ol.format.GeoJSON.prototype.writeFeature;


/**
 * @inheritDoc
 */
ol.format.GeoJSON.prototype.writeFeatureObject = function(
    feature, opt_options) {
  var object = {
    'type': 'Feature'
  };
  var id = feature.getId();
  if (goog.isDefAndNotNull(id)) {
    goog.object.set(object, 'id', id);
  }
  var geometry = feature.getGeometry();
  if (goog.isDefAndNotNull(geometry)) {
    goog.object.set(
        object, 'geometry',
        ol.format.GeoJSON.writeGeometry_(geometry, opt_options));
  }
  var properties = feature.getProperties();
  goog.object.remove(properties, 'geometry');
  if (!goog.object.isEmpty(properties)) {
    goog.object.set(object, 'properties', properties);
  }
  return object;
};


/**
 * Encode an array of features as GeoJSON.
 *
 * @function
 * @param {Array.<ol.Feature>} features Features.
 * @param {olx.format.WriteOptions} options Write options.
 * @return {GeoJSONObject} GeoJSON.
 * @api stable
 */
ol.format.GeoJSON.prototype.writeFeatures;


/**
 * @inheritDoc
 */
ol.format.GeoJSON.prototype.writeFeaturesObject =
    function(features, opt_options) {
  var objects = [];
  var i, ii;
  for (i = 0, ii = features.length; i < ii; ++i) {
    objects.push(this.writeFeatureObject(features[i], opt_options));
  }
  return /** @type {GeoJSONFeatureCollection} */ ({
    'type': 'FeatureCollection',
    'features': objects
  });
};


/**
 * Encode a geometry as GeoJSON.
 *
 * @function
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions} options Write options.
 * @return {GeoJSONGeometry|GeoJSONGeometryCollection} GeoJSON.
 * @api stable
 */
ol.format.GeoJSON.prototype.writeGeometry;


/**
 * @inheritDoc
 */
ol.format.GeoJSON.prototype.writeGeometryObject =
    ol.format.GeoJSON.writeGeometry_;
