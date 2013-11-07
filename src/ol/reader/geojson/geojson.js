// FIXME coordinate order
// FIXME reprojection
// FIXME support other geometry types

goog.provide('ol.reader.GeoJSON');

goog.require('goog.asserts');
goog.require('goog.json');
goog.require('ol.Feature');
goog.require('ol.geom.LineString');
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
 * @return {ol.geom.Polygon} Polygon.
 */
ol.reader.GeoJSON.readPolygonGeometry_ = function(geometry) {
  goog.asserts.assert(geometry.type == 'Polygon');
  return new ol.geom.Polygon(geometry.coordinates);
};


/**
 * @param {GeoJSONFeature} feature Feature.
 * @param {function(ol.Feature): *} callback Callback.
 * @private
 * @return {*} Callback result.
 */
ol.reader.GeoJSON.readFeature_ = function(feature, callback) {
  goog.asserts.assert(feature.type == 'Feature');
  var geometryReader =
      ol.reader.GeoJSON.GEOMETRY_READERS_[feature.geometry.type];
  goog.asserts.assert(goog.isDef(geometryReader));
  var geometry = geometryReader(feature.geometry);
  var f = new ol.Feature(geometry);
  if (goog.isDef(feature.properties)) {
    f.setValues(feature.properties);
  }
  return callback(f);
};


/**
 * @param {GeoJSONFeatureCollection} featureCollection Feature collection.
 * @param {function(ol.Feature): *} callback Callback.
 * @private
 * @return {*} Callback result.
 */
ol.reader.GeoJSON.readFeatureCollection_ =
    function(featureCollection, callback) {
  goog.asserts.assert(featureCollection.type == 'FeatureCollection');
  var features = featureCollection.features;
  var i, ii;
  for (i = 0, ii = features.length; i < ii; ++i) {
    var result = ol.reader.GeoJSON.readFeature_(features[i], callback);
    if (result) {
      return result;
    }
  }
  return undefined;
};


/**
 * @param {GeoJSONObject} object Object.
 * @param {function(ol.Feature): *} callback Callback.
 * @return {*} Callback result.
 */
ol.reader.GeoJSON.readObject = function(object, callback) {
  var objectReader = ol.reader.GeoJSON.OBJECT_READERS_[object.type];
  goog.asserts.assert(goog.isDef(objectReader));
  return objectReader(object, callback);
};


/**
 * @param {string} string String.
 * @param {function(ol.Feature): *} callback Callback.
 * @return {*} Callback result.
 */
ol.reader.GeoJSON.readString = function(string, callback) {
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
  'Polygon': ol.reader.GeoJSON.readPolygonGeometry_
};


/**
 * @const
 * @private
 * @type {Object.<string, function(*, function(ol.Feature): *): *>}
 */
ol.reader.GeoJSON.OBJECT_READERS_ = {
  'Feature': ol.reader.GeoJSON.readFeature_,
  'FeatureCollection': ol.reader.GeoJSON.readFeatureCollection_
};
