// FIXME coordinate order
// FIXME reprojection
// FIXME support other geometry types

goog.provide('ol.reader.GeoJSON');

goog.require('goog.asserts');
goog.require('goog.json');
goog.require('ol.Feature');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');



/**
 * @constructor
 */
ol.reader.GeoJSON = function() {
};


/**
 * @param {GeoJSONGeometry} geometry Geometry.
 * @private
 * @return {ol.geom.Point} Point.
 */
ol.reader.GeoJSON.readPointGeometry_ = function(geometry) {
  goog.asserts.assert(geometry.type == 'Point');
  return new ol.geom.Point(geometry.coordinates);
};


/**
 * @param {GeoJSONGeometry} geometry Geometry.
 * @private
 * @return {ol.geom.LineString} LineString.
 */
ol.reader.GeoJSON.readLineStringGeometry_ = function(geometry) {
  goog.asserts.assert(geometry.type == 'LineString');
  return new ol.geom.LineString(geometry.coordinates);
};


/**
 * @param {GeoJSONGeometry} geometry Geometry.
 * @private
 * @return {ol.geom.MultiLineString} MultiLineString.
 */
ol.reader.GeoJSON.readMultiLineStringGeometry_ = function(geometry) {
  goog.asserts.assert(geometry.type == 'MultiLineString');
  return new ol.geom.MultiLineString(geometry.coordinates);
};


/**
 * @param {GeoJSONGeometry} geometry Geometry.
 * @private
 * @return {ol.geom.Polygon} Polygon.
 */
ol.reader.GeoJSON.readPolygonGeometry_ = function(geometry) {
  goog.asserts.assert(geometry.type == 'Polygon');
  return new ol.geom.Polygon(geometry.coordinates);
};


/**
 * @param {GeoJSONObject} object Object.
 * @param {function(this: S, ol.Feature): T} callback Callback.
 * @param {S=} opt_obj Scope.
 * @private
 * @return {T} Callback result.
 * @template S,T
 */
ol.reader.GeoJSON.readFeature_ = function(object, callback, opt_obj) {
  goog.asserts.assert(object.type == 'Feature');
  var feature = /** @type {GeoJSONFeature} */ (object);
  var geometryReader =
      ol.reader.GeoJSON.GEOMETRY_READERS_[feature.geometry.type];
  goog.asserts.assert(goog.isDef(geometryReader));
  var geometry = geometryReader(feature.geometry);
  var f = new ol.Feature(geometry);
  if (goog.isDef(feature.properties)) {
    f.setValues(feature.properties);
  }
  return callback.call(opt_obj, f);
};


/**
 * @param {GeoJSONObject} object Object.
 * @param {function(this: S, ol.Feature): T} callback Callback.
 * @param {S=} opt_obj Scope.
 * @private
 * @return {T|undefined} Callback result.
 * @template S,T
 */
ol.reader.GeoJSON.readFeatureCollection_ = function(object, callback, opt_obj) {
  goog.asserts.assert(object.type == 'FeatureCollection');
  var featureCollection = /** @type {GeoJSONFeatureCollection} */ (object);
  var features = featureCollection.features;
  var i, ii;
  for (i = 0, ii = features.length; i < ii; ++i) {
    var result = ol.reader.GeoJSON.readFeature_(features[i], callback, opt_obj);
    if (result) {
      return result;
    }
  }
  return undefined;
};


/**
 * @param {GeoJSONObject} object Object.
 * @param {function(this: S, ol.Feature): T} callback Callback.
 * @param {S=} opt_obj Scope.
 * @return {T} Callback result.
 * @template S,T
 */
ol.reader.GeoJSON.readObject = function(object, callback, opt_obj) {
  var objectReader = ol.reader.GeoJSON.OBJECT_READERS_[object.type];
  goog.asserts.assert(goog.isDef(objectReader));
  return objectReader(object, callback, opt_obj);
};


/**
 * @param {string} string String.
 * @param {function(ol.Feature): T} callback Callback.
 * @param {S=} opt_obj Scope.
 * @return {T} Callback result.
 * @template S,T
 */
ol.reader.GeoJSON.readString = function(string, callback, opt_obj) {
  var object = goog.json.parse(string);
  return ol.reader.GeoJSON.readObject(
      /** @type {GeoJSONObject} */ (object), callback);
};


/**
 * @const
 * @private
 * @type {Object.<string, function(GeoJSONGeometry): ol.geom.Geometry>}
 */
ol.reader.GeoJSON.GEOMETRY_READERS_ = {
  'Point': ol.reader.GeoJSON.readPointGeometry_,
  'LineString': ol.reader.GeoJSON.readLineStringGeometry_,
  'Polygon': ol.reader.GeoJSON.readPolygonGeometry_,
  'MultiLineString': ol.reader.GeoJSON.readMultiLineStringGeometry_
};


/**
 * @const
 * @private
 * @type {Object.<string, function(GeoJSONObject, function(ol.Feature): *, *): *>}
 */
ol.reader.GeoJSON.OBJECT_READERS_ = {
  'Feature': ol.reader.GeoJSON.readFeature_,
  'FeatureCollection': ol.reader.GeoJSON.readFeatureCollection_
};
