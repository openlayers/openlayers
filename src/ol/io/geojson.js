goog.provide('ol.io.geojson');

goog.require('ol.Feature');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');


/**
 * Parse a GeoJSON string.
 * @param {string} str GeoJSON string.
 * @return {ol.Feature|Array.<ol.Feature>|
 *    ol.geom.Geometry|Array.<ol.geom.Geometry>} Parsed geometry or array
 *    of geometries.
 */
ol.io.geojson.read = function(str) {
  // TODO: add options and accept projection
  var json = /** @type {GeoJSONObject} */ (JSON.parse(str));
  return ol.io.geojson.parse_(json);
};


/**
 * @param {GeoJSONObject} json GeoJSON object.
 * @return {ol.Feature|Array.<ol.Feature>|
 *    ol.geom.Geometry|Array.<ol.geom.Geometry>} Parsed geometry or array
 *    of geometries.
 * @private
 */
ol.io.geojson.parse_ = function(json) {
  var result;
  switch (json.type) {
    case 'FeatureCollection':
      result = ol.io.geojson.parseFeatureCollection_(
          /** @type {GeoJSONFeatureCollection} */ (json));
      break;
    case 'Feature':
      result = ol.io.geojson.parseFeature_(
          /** @type {GeoJSONFeature} */ (json));
      break;
    case 'GeometryCollection':
      result = ol.io.geojson.parseGeometryCollection_(
          /** @type {GeoJSONGeometryCollection} */ (json));
      break;
    case 'Point':
      result = ol.io.geojson.parsePoint_(
          /** @type {GeoJSONGeometry} */ (json));
      break;
    case 'LineString':
      result = ol.io.geojson.parseLineString_(
          /** @type {GeoJSONGeometry} */ (json));
      break;
    case 'Polygon':
      result = ol.io.geojson.parsePolygon_(
          /** @type {GeoJSONGeometry} */ (json));
      break;
    case 'MultiPoint':
      result = ol.io.geojson.parseMultiPoint_(
          /** @type {GeoJSONGeometry} */ (json));
      break;
    case 'MultiLineString':
      result = ol.io.geojson.parseMultiLineString_(
          /** @type {GeoJSONGeometry} */ (json));
      break;
    case 'MultiPolygon':
      result = ol.io.geojson.parseMultiPolygon_(
          /** @type {GeoJSONGeometry} */ (json));
      break;
    default:
      throw new Error('GeoJSON parsing not implemented for type: ' + json.type);
  }
  return result;
};


/**
 * @param {GeoJSONFeature} json GeoJSON feature.
 * @return {ol.Feature} Parsed feature.
 * @private
 */
ol.io.geojson.parseFeature_ = function(json) {
  var geomJson = json.geometry,
      geometry;
  if (geomJson) {
    geometry = /** @type {ol.geom.Geometry} */ (ol.io.geojson.parse_(
        /** @type {GeoJSONGeometry} */ (geomJson)));
  }
  return new ol.Feature(geometry, json.properties);
};


/**
 * @param {GeoJSONFeatureCollection} json GeoJSON feature collection.
 * @return {Array.<ol.Feature>} Parsed array of features.
 * @private
 */
ol.io.geojson.parseFeatureCollection_ = function(json) {
  var features = json.features,
      len = features.length,
      result = new Array(len),
      i;

  for (i = 0; i < len; ++i) {
    result[i] = ol.io.geojson.parse_(
        /** @type {GeoJSONFeature} */ (features[i]));
  }
  return result;
};


/**
 * @param {GeoJSONGeometryCollection} json GeoJSON geometry collection.
 * @return {Array.<ol.geom.Geometry>} Parsed array of geometries.
 * @private
 */
ol.io.geojson.parseGeometryCollection_ = function(json) {
  var geometries = json.geometries,
      len = geometries.length,
      result = new Array(len),
      i;

  for (i = 0; i < len; ++i) {
    result[i] = ol.io.geojson.parse_(
        /** @type {GeoJSONGeometry} */ (geometries[i]));
  }
  return result;
};


/**
 * @param {GeoJSONGeometry} json GeoJSON linestring.
 * @return {ol.geom.LineString} Parsed linestring.
 * @private
 */
ol.io.geojson.parseLineString_ = function(json) {
  return new ol.geom.LineString(json.coordinates);
};


/**
 * @param {GeoJSONGeometry} json GeoJSON multi-linestring.
 * @return {ol.geom.MultiLineString} Parsed multi-linestring.
 * @private
 */
ol.io.geojson.parseMultiLineString_ = function(json) {
  return new ol.geom.MultiLineString(json.coordinates);
};


/**
 * @param {GeoJSONGeometry} json GeoJSON multi-point.
 * @return {ol.geom.MultiPoint} Parsed multi-point.
 * @private
 */
ol.io.geojson.parseMultiPoint_ = function(json) {
  return new ol.geom.MultiPoint(json.coordinates);
};


/**
 * @param {GeoJSONGeometry} json GeoJSON multi-polygon.
 * @return {ol.geom.MultiPolygon} Parsed multi-polygon.
 * @private
 */
ol.io.geojson.parseMultiPolygon_ = function(json) {
  return new ol.geom.MultiPolygon(json.coordinates);
};


/**
 * @param {GeoJSONGeometry} json GeoJSON point.
 * @return {ol.geom.Point} Parsed multi-point.
 * @private
 */
ol.io.geojson.parsePoint_ = function(json) {
  return new ol.geom.Point(json.coordinates);
};


/**
 * @param {GeoJSONGeometry} json GeoJSON polygon.
 * @return {ol.geom.Polygon} Parsed polygon.
 * @private
 */
ol.io.geojson.parsePolygon_ = function(json) {
  return new ol.geom.Polygon(json.coordinates);
};
