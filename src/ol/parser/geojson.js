goog.provide('ol.parser.GeoJSON');

goog.require('ol.Feature');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.parser.Parser');



/**
 * @constructor
 * @extends {ol.parser.Parser}
 */
ol.parser.GeoJSON = function() {};
goog.inherits(ol.parser.GeoJSON, ol.parser.Parser);


/**
 * Parse a GeoJSON string.
 * @param {string} str GeoJSON string.
 * @return {ol.Feature|Array.<ol.Feature>|
 *    ol.geom.Geometry|Array.<ol.geom.Geometry>} Parsed geometry or array
 *    of geometries.
 */
ol.parser.GeoJSON.prototype.read = function(str) {
  // TODO: add options and accept projection
  var json = /** @type {GeoJSONObject} */ (JSON.parse(str));
  return ol.parser.GeoJSON.prototype.parse_(json);
};


/**
 * @param {GeoJSONObject} json GeoJSON object.
 * @return {ol.Feature|Array.<ol.Feature>|
 *    ol.geom.Geometry|Array.<ol.geom.Geometry>} Parsed geometry or array
 *    of geometries.
 * @private
 */
ol.parser.GeoJSON.prototype.parse_ = function(json) {
  var result;
  switch (json.type) {
    case 'FeatureCollection':
      result = this.parseFeatureCollection_(
          /** @type {GeoJSONFeatureCollection} */ (json));
      break;
    case 'Feature':
      result = this.parseFeature_(
          /** @type {GeoJSONFeature} */ (json));
      break;
    case 'GeometryCollection':
      result = this.parseGeometryCollection_(
          /** @type {GeoJSONGeometryCollection} */ (json));
      break;
    case 'Point':
      result = this.parsePoint_(
          /** @type {GeoJSONGeometry} */ (json));
      break;
    case 'LineString':
      result = this.parseLineString_(
          /** @type {GeoJSONGeometry} */ (json));
      break;
    case 'Polygon':
      result = this.parsePolygon_(
          /** @type {GeoJSONGeometry} */ (json));
      break;
    case 'MultiPoint':
      result = this.parseMultiPoint_(
          /** @type {GeoJSONGeometry} */ (json));
      break;
    case 'MultiLineString':
      result = this.parseMultiLineString_(
          /** @type {GeoJSONGeometry} */ (json));
      break;
    case 'MultiPolygon':
      result = this.parseMultiPolygon_(
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
ol.parser.GeoJSON.prototype.parseFeature_ = function(json) {
  var geomJson = json.geometry,
      geometry = null;
  if (geomJson) {
    geometry = /** @type {ol.geom.Geometry} */ (this.parse_(
        /** @type {GeoJSONGeometry} */ (geomJson)));
  }
  var feature = new ol.Feature();
  feature.setGeometry(geometry);
  feature.setValues(json.properties);
  return feature;
};


/**
 * @param {GeoJSONFeatureCollection} json GeoJSON feature collection.
 * @return {Array.<ol.Feature>} Parsed array of features.
 * @private
 */
ol.parser.GeoJSON.prototype.parseFeatureCollection_ = function(json) {
  var features = json.features,
      len = features.length,
      result = new Array(len),
      i;

  for (i = 0; i < len; ++i) {
    result[i] = this.parse_(
        /** @type {GeoJSONFeature} */ (features[i]));
  }
  return result;
};


/**
 * @param {GeoJSONGeometryCollection} json GeoJSON geometry collection.
 * @return {Array.<ol.geom.Geometry>} Parsed array of geometries.
 * @private
 */
ol.parser.GeoJSON.prototype.parseGeometryCollection_ = function(json) {
  var geometries = json.geometries,
      len = geometries.length,
      result = new Array(len),
      i;

  for (i = 0; i < len; ++i) {
    result[i] = this.parse_(
        /** @type {GeoJSONGeometry} */ (geometries[i]));
  }
  return result;
};


/**
 * @param {GeoJSONGeometry} json GeoJSON linestring.
 * @return {ol.geom.LineString} Parsed linestring.
 * @private
 */
ol.parser.GeoJSON.prototype.parseLineString_ = function(json) {
  return new ol.geom.LineString(json.coordinates);
};


/**
 * @param {GeoJSONGeometry} json GeoJSON multi-linestring.
 * @return {ol.geom.MultiLineString} Parsed multi-linestring.
 * @private
 */
ol.parser.GeoJSON.prototype.parseMultiLineString_ = function(json) {
  return new ol.geom.MultiLineString(json.coordinates);
};


/**
 * @param {GeoJSONGeometry} json GeoJSON multi-point.
 * @return {ol.geom.MultiPoint} Parsed multi-point.
 * @private
 */
ol.parser.GeoJSON.prototype.parseMultiPoint_ = function(json) {
  return new ol.geom.MultiPoint(json.coordinates);
};


/**
 * @param {GeoJSONGeometry} json GeoJSON multi-polygon.
 * @return {ol.geom.MultiPolygon} Parsed multi-polygon.
 * @private
 */
ol.parser.GeoJSON.prototype.parseMultiPolygon_ = function(json) {
  return new ol.geom.MultiPolygon(json.coordinates);
};


/**
 * @param {GeoJSONGeometry} json GeoJSON point.
 * @return {ol.geom.Point} Parsed multi-point.
 * @private
 */
ol.parser.GeoJSON.prototype.parsePoint_ = function(json) {
  return new ol.geom.Point(json.coordinates);
};


/**
 * @param {GeoJSONGeometry} json GeoJSON polygon.
 * @return {ol.geom.Polygon} Parsed polygon.
 * @private
 */
ol.parser.GeoJSON.prototype.parsePolygon_ = function(json) {
  return new ol.geom.Polygon(json.coordinates);
};
