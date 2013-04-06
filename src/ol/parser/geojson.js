goog.provide('ol.parser.GeoJSON');

goog.require('goog.asserts');
goog.require('ol.Feature');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.geom.SharedVertices');
goog.require('ol.parser.Parser');
goog.require('ol.parser.ReadFeaturesOptions');
goog.require('ol.parser.StringFeatureParser');



/**
 * @constructor
 * @implements {ol.parser.StringFeatureParser}
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
  var json = /** @type {GeoJSONObject} */ (JSON.parse(str));
  return this.parse_(json);
};


/**
 * Parse a GeoJSON feature collection.
 * @param {string} str GeoJSON feature collection.
 * @param {ol.parser.ReadFeaturesOptions=} opt_options Reader options.
 * @return {Array.<ol.Feature>} Array of features.
 */
ol.parser.GeoJSON.prototype.readFeaturesFromString =
    function(str, opt_options) {
  var json = /** @type {GeoJSONFeatureCollection} */ (JSON.parse(str));
  return this.parseFeatureCollection_(json, opt_options);
};


/**
 * Parse a GeoJSON feature collection from decoded JSON.
 * @param {GeoJSONFeatureCollection} object GeoJSON feature collection decoded
 *     from JSON.
 * @param {ol.parser.ReadFeaturesOptions=} opt_options Reader options.
 * @return {Array.<ol.Feature>} Array of features.
 */
ol.parser.GeoJSON.prototype.readFeaturesFromObject =
    function(object, opt_options) {
  return this.parseFeatureCollection_(object, opt_options);
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
 * @param {ol.parser.ReadFeaturesOptions=} opt_options Read options.
 * @return {ol.Feature} Parsed feature.
 * @private
 */
ol.parser.GeoJSON.prototype.parseFeature_ = function(json, opt_options) {
  var geomJson = json.geometry,
      geometry = null,
      options = opt_options || {};
  var feature = new ol.Feature(json.properties);
  if (geomJson) {
    var type = geomJson.type;
    var callback = options.callback;
    var sharedVertices;
    if (callback) {
      goog.asserts.assert(type in ol.parser.GeoJSON.GeometryType,
          'Bad geometry type: ' + type);
      sharedVertices = callback(feature, ol.parser.GeoJSON.GeometryType[type]);
    }
    switch (type) {
      case 'Point':
        geometry = this.parsePoint_(geomJson, sharedVertices);
        break;
      case 'LineString':
        geometry = this.parseLineString_(geomJson, sharedVertices);
        break;
      case 'Polygon':
        geometry = this.parsePolygon_(geomJson, sharedVertices);
        break;
      case 'MultiPoint':
        geometry = this.parseMultiPoint_(geomJson, sharedVertices);
        break;
      case 'MultiLineString':
        geometry = this.parseMultiLineString_(geomJson, sharedVertices);
        break;
      case 'MultiPolygon':
        geometry = this.parseMultiPolygon_(geomJson, sharedVertices);
        break;
      default:
        throw new Error('Bad geometry type: ' + type);
    }
    feature.setGeometry(geometry);
  }
  return feature;
};


/**
 * @param {GeoJSONFeatureCollection} json GeoJSON feature collection.
 * @param {ol.parser.ReadFeaturesOptions=} opt_options Read options.
 * @return {Array.<ol.Feature>} Parsed array of features.
 * @private
 */
ol.parser.GeoJSON.prototype.parseFeatureCollection_ = function(
    json, opt_options) {
  var features = json.features,
      len = features.length,
      result = new Array(len),
      i;

  for (i = 0; i < len; ++i) {
    result[i] = this.parseFeature_(
        /** @type {GeoJSONFeature} */ (features[i]), opt_options);
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
    result[i] = this.parse_(/** @type {GeoJSONGeometry} */ (geometries[i]));
  }
  return result;
};


/**
 * @param {GeoJSONGeometry} json GeoJSON linestring.
 * @param {ol.geom.SharedVertices=} opt_vertices Shared vertices.
 * @return {ol.geom.LineString} Parsed linestring.
 * @private
 */
ol.parser.GeoJSON.prototype.parseLineString_ = function(json, opt_vertices) {
  return new ol.geom.LineString(json.coordinates, opt_vertices);
};


/**
 * @param {GeoJSONGeometry} json GeoJSON multi-linestring.
 * @param {ol.geom.SharedVertices=} opt_vertices Shared vertices.
 * @return {ol.geom.MultiLineString} Parsed multi-linestring.
 * @private
 */
ol.parser.GeoJSON.prototype.parseMultiLineString_ = function(
    json, opt_vertices) {
  return new ol.geom.MultiLineString(json.coordinates, opt_vertices);
};


/**
 * @param {GeoJSONGeometry} json GeoJSON multi-point.
 * @param {ol.geom.SharedVertices=} opt_vertices Shared vertices.
 * @return {ol.geom.MultiPoint} Parsed multi-point.
 * @private
 */
ol.parser.GeoJSON.prototype.parseMultiPoint_ = function(json, opt_vertices) {
  return new ol.geom.MultiPoint(json.coordinates, opt_vertices);
};


/**
 * @param {GeoJSONGeometry} json GeoJSON multi-polygon.
 * @param {ol.geom.SharedVertices=} opt_vertices Shared vertices.
 * @return {ol.geom.MultiPolygon} Parsed multi-polygon.
 * @private
 */
ol.parser.GeoJSON.prototype.parseMultiPolygon_ = function(json, opt_vertices) {
  return new ol.geom.MultiPolygon(json.coordinates, opt_vertices);
};


/**
 * @param {GeoJSONGeometry} json GeoJSON point.
 * @param {ol.geom.SharedVertices=} opt_vertices Shared vertices.
 * @return {ol.geom.Point} Parsed point.
 * @private
 */
ol.parser.GeoJSON.prototype.parsePoint_ = function(json, opt_vertices) {
  return new ol.geom.Point(json.coordinates, opt_vertices);
};


/**
 * @param {GeoJSONGeometry} json GeoJSON polygon.
 * @param {ol.geom.SharedVertices=} opt_vertices Shared vertices.
 * @return {ol.geom.Polygon} Parsed polygon.
 * @private
 */
ol.parser.GeoJSON.prototype.parsePolygon_ = function(json, opt_vertices) {
  return new ol.geom.Polygon(json.coordinates, opt_vertices);
};


/**
 * @enum {ol.geom.GeometryType}
 */
ol.parser.GeoJSON.GeometryType = {
  'Point': ol.geom.GeometryType.POINT,
  'LineString': ol.geom.GeometryType.LINESTRING,
  'Polygon': ol.geom.GeometryType.POLYGON,
  'MultiPoint': ol.geom.GeometryType.MULTIPOINT,
  'MultiLineString': ol.geom.GeometryType.MULTILINESTRING,
  'MultiPolygon': ol.geom.GeometryType.MULTIPOLYGON,
  'GeometryCollection': ol.geom.GeometryType.GEOMETRYCOLLECTION
};
