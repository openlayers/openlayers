// FIXME coordinate order
// FIXME reprojection
// FIXME support other geometry types

goog.provide('ol.format.GeoJSON');

goog.require('goog.asserts');
goog.require('goog.json');
goog.require('ol.Feature');
goog.require('ol.format.IReader');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');



/**
 * @constructor
 * @implements {ol.format.IReader}
 */
ol.format.GeoJSON = function() {
};


/**
 * @param {GeoJSONGeometry} geometry Geometry.
 * @private
 * @return {ol.geom.Point} Point.
 */
ol.format.GeoJSON.readPointGeometry_ = function(geometry) {
  goog.asserts.assert(geometry.type == 'Point');
  return new ol.geom.Point(geometry.coordinates);
};


/**
 * @param {GeoJSONGeometry} geometry Geometry.
 * @private
 * @return {ol.geom.LineString} LineString.
 */
ol.format.GeoJSON.readLineStringGeometry_ = function(geometry) {
  goog.asserts.assert(geometry.type == 'LineString');
  return new ol.geom.LineString(geometry.coordinates);
};


/**
 * @param {GeoJSONGeometry} geometry Geometry.
 * @private
 * @return {ol.geom.MultiLineString} MultiLineString.
 */
ol.format.GeoJSON.readMultiLineStringGeometry_ = function(geometry) {
  goog.asserts.assert(geometry.type == 'MultiLineString');
  return new ol.geom.MultiLineString(geometry.coordinates);
};


/**
 * @param {GeoJSONGeometry} geometry Geometry.
 * @private
 * @return {ol.geom.MultiPolygon} MultiPolygon.
 */
ol.format.GeoJSON.readMultiPolygonGeometry_ = function(geometry) {
  goog.asserts.assert(geometry.type == 'MultiPolygon');
  return new ol.geom.MultiPolygon(geometry.coordinates);
};


/**
 * @param {GeoJSONGeometry} geometry Geometry.
 * @private
 * @return {ol.geom.Polygon} Polygon.
 */
ol.format.GeoJSON.readPolygonGeometry_ = function(geometry) {
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
ol.format.GeoJSON.readFeature_ = function(object, callback, opt_obj) {
  goog.asserts.assert(object.type == 'Feature');
  var feature = /** @type {GeoJSONFeature} */ (object);
  var geometryReader =
      ol.format.GeoJSON.GEOMETRY_READERS_[feature.geometry.type];
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
ol.format.GeoJSON.readFeatureCollection_ = function(object, callback, opt_obj) {
  goog.asserts.assert(object.type == 'FeatureCollection');
  var featureCollection = /** @type {GeoJSONFeatureCollection} */ (object);
  var features = featureCollection.features;
  var i, ii;
  for (i = 0, ii = features.length; i < ii; ++i) {
    var result = ol.format.GeoJSON.readFeature_(features[i], callback, opt_obj);
    if (result) {
      return result;
    }
  }
  return undefined;
};


/**
 * @inheritDoc
 */
ol.format.GeoJSON.prototype.readObject = function(object, callback, opt_obj) {
  var geoJSONObject = /** @type {GeoJSONObject} */ (object);
  var objectReader = ol.format.GeoJSON.OBJECT_READERS_[geoJSONObject.type];
  goog.asserts.assert(goog.isDef(objectReader));
  return objectReader(geoJSONObject, callback, opt_obj);
};


/**
 * @inheritDoc
 */
ol.format.GeoJSON.prototype.readString = function(string, callback, opt_obj) {
  return this.readObject(goog.json.parse(string), callback, opt_obj);
};


/**
 * @const
 * @private
 * @type {Object.<string, function(GeoJSONGeometry): ol.geom.Geometry>}
 */
ol.format.GeoJSON.GEOMETRY_READERS_ = {
  'Point': ol.format.GeoJSON.readPointGeometry_,
  'LineString': ol.format.GeoJSON.readLineStringGeometry_,
  'Polygon': ol.format.GeoJSON.readPolygonGeometry_,
  'MultiLineString': ol.format.GeoJSON.readMultiLineStringGeometry_,
  'MultiPolygon': ol.format.GeoJSON.readMultiPolygonGeometry_
};


/**
 * @const
 * @private
 * @type {Object.<string, function(GeoJSONObject, function(ol.Feature): *, *): *>}
 */
ol.format.GeoJSON.OBJECT_READERS_ = {
  'Feature': ol.format.GeoJSON.readFeature_,
  'FeatureCollection': ol.format.GeoJSON.readFeatureCollection_
};
