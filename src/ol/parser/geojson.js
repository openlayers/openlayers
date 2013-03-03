goog.provide('ol.parser.GeoJSON');

goog.require('ol.Feature');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.geom.SharedVertices');
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
 * @param {ol.parser.GeoJSON.ReadOptions=} opt_options Read options.
 * @return {ol.Feature|Array.<ol.Feature>|
 *    ol.geom.Geometry|Array.<ol.geom.Geometry>} Parsed geometry or array
 *    of geometries.
 */
ol.parser.GeoJSON.prototype.read = function(str, opt_options) {
  var json = /** @type {GeoJSONObject} */ (JSON.parse(str));
  return this.parse_(json, opt_options);
};


/**
 * @param {GeoJSONObject} json GeoJSON object.
 * @param {ol.parser.GeoJSON.ReadOptions=} opt_options Read options.
 * @return {ol.Feature|Array.<ol.Feature>|
 *    ol.geom.Geometry|Array.<ol.geom.Geometry>} Parsed geometry or array
 *    of geometries.
 * @private
 */
ol.parser.GeoJSON.prototype.parse_ = function(json, opt_options) {
  var result;
  switch (json.type) {
    case 'FeatureCollection':
      result = this.parseFeatureCollection_(
          /** @type {GeoJSONFeatureCollection} */ (json), opt_options);
      break;
    case 'Feature':
      result = this.parseFeature_(
          /** @type {GeoJSONFeature} */ (json), opt_options);
      break;
    case 'GeometryCollection':
      result = this.parseGeometryCollection_(
          /** @type {GeoJSONGeometryCollection} */ (json), opt_options);
      break;
    case 'Point':
      result = this.parsePoint_(
          /** @type {GeoJSONGeometry} */ (json), opt_options);
      break;
    case 'LineString':
      result = this.parseLineString_(
          /** @type {GeoJSONGeometry} */ (json), opt_options);
      break;
    case 'Polygon':
      result = this.parsePolygon_(
          /** @type {GeoJSONGeometry} */ (json), opt_options);
      break;
    case 'MultiPoint':
      result = this.parseMultiPoint_(
          /** @type {GeoJSONGeometry} */ (json), opt_options);
      break;
    case 'MultiLineString':
      result = this.parseMultiLineString_(
          /** @type {GeoJSONGeometry} */ (json), opt_options);
      break;
    case 'MultiPolygon':
      result = this.parseMultiPolygon_(
          /** @type {GeoJSONGeometry} */ (json), opt_options);
      break;
    default:
      throw new Error('GeoJSON parsing not implemented for type: ' + json.type);
  }
  return result;
};


/**
 * @param {GeoJSONFeature} json GeoJSON feature.
 * @param {ol.parser.GeoJSON.ReadOptions=} opt_options Read options.
 * @return {ol.Feature} Parsed feature.
 * @private
 */
ol.parser.GeoJSON.prototype.parseFeature_ = function(json, opt_options) {
  var geomJson = json.geometry,
      geometry = null;
  if (geomJson) {
    geometry = /** @type {ol.geom.Geometry} */ (this.parse_(
        /** @type {GeoJSONGeometry} */ (geomJson), opt_options));
  }
  var feature = new ol.Feature();
  feature.setGeometry(geometry);
  feature.setValues(json.properties);
  return feature;
};


/**
 * @param {GeoJSONFeatureCollection} json GeoJSON feature collection.
 * @param {ol.parser.GeoJSON.ReadOptions=} opt_options Read options.
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
    result[i] = this.parse_(
        /** @type {GeoJSONFeature} */ (features[i]), opt_options);
  }
  return result;
};


/**
 * @param {GeoJSONGeometryCollection} json GeoJSON geometry collection.
 * @param {ol.parser.GeoJSON.ReadOptions=} opt_options Read options.
 * @return {Array.<ol.geom.Geometry>} Parsed array of geometries.
 * @private
 */
ol.parser.GeoJSON.prototype.parseGeometryCollection_ = function(
    json, opt_options) {
  var geometries = json.geometries,
      len = geometries.length,
      result = new Array(len),
      i;

  for (i = 0; i < len; ++i) {
    result[i] = this.parse_(
        /** @type {GeoJSONGeometry} */ (geometries[i]), opt_options);
  }
  return result;
};


/**
 * @param {GeoJSONGeometry} json GeoJSON linestring.
 * @param {ol.parser.GeoJSON.ReadOptions=} opt_options Read options.
 * @return {ol.geom.LineString} Parsed linestring.
 * @private
 */
ol.parser.GeoJSON.prototype.parseLineString_ = function(json, opt_options) {
  var vertices = opt_options && opt_options.lineVertices;
  return new ol.geom.LineString(json.coordinates, vertices);
};


/**
 * @param {GeoJSONGeometry} json GeoJSON multi-linestring.
 * @param {ol.parser.GeoJSON.ReadOptions=} opt_options Read options.
 * @return {ol.geom.MultiLineString} Parsed multi-linestring.
 * @private
 */
ol.parser.GeoJSON.prototype.parseMultiLineString_ = function(
    json, opt_options) {
  var vertices = opt_options && opt_options.lineVertices;
  return new ol.geom.MultiLineString(json.coordinates, vertices);
};


/**
 * @param {GeoJSONGeometry} json GeoJSON multi-point.
 * @param {ol.parser.GeoJSON.ReadOptions=} opt_options Read options.
 * @return {ol.geom.MultiPoint} Parsed multi-point.
 * @private
 */
ol.parser.GeoJSON.prototype.parseMultiPoint_ = function(json, opt_options) {
  var vertices = opt_options && opt_options.pointVertices;
  return new ol.geom.MultiPoint(json.coordinates, vertices);
};


/**
 * @param {GeoJSONGeometry} json GeoJSON multi-polygon.
 * @param {ol.parser.GeoJSON.ReadOptions=} opt_options Read options.
 * @return {ol.geom.MultiPolygon} Parsed multi-polygon.
 * @private
 */
ol.parser.GeoJSON.prototype.parseMultiPolygon_ = function(json, opt_options) {
  var vertices = opt_options && opt_options.polygonVertices;
  return new ol.geom.MultiPolygon(json.coordinates, vertices);
};


/**
 * @param {GeoJSONGeometry} json GeoJSON point.
 * @param {ol.parser.GeoJSON.ReadOptions=} opt_options Read options.
 * @return {ol.geom.Point} Parsed multi-point.
 * @private
 */
ol.parser.GeoJSON.prototype.parsePoint_ = function(json, opt_options) {
  var vertices = opt_options && opt_options.pointVertices;
  return new ol.geom.Point(json.coordinates, vertices);
};


/**
 * @param {GeoJSONGeometry} json GeoJSON polygon.
 * @param {ol.parser.GeoJSON.ReadOptions=} opt_options Read options.
 * @return {ol.geom.Polygon} Parsed polygon.
 * @private
 */
ol.parser.GeoJSON.prototype.parsePolygon_ = function(json, opt_options) {
  var vertices = opt_options && opt_options.polygonVertices;
  return new ol.geom.Polygon(json.coordinates, vertices);
};


/**
 * @typedef {{pointVertices: (ol.geom.SharedVertices|undefined),
 *            lineVertices: (ol.geom.SharedVertices|undefined),
 *            polygonVertices: (ol.geom.SharedVertices|undefined)}}
 * TODO: add support for toProjection
 */
ol.parser.GeoJSON.ReadOptions;
