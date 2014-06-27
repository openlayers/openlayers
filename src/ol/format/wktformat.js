goog.provide('ol.format.WKT');

goog.require('goog.array');
goog.require('goog.string');
goog.require('ol.Feature');
goog.require('ol.format.TextFeature');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');



/**
 * @constructor
 * @extends {ol.format.TextFeature}
 * @param {olx.format.WKTOptions=} opt_options Options.
 * @todo stability experimental
 * @todo api
 */
ol.format.WKT = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  goog.base(this);

  /**
   * Split GEOMETRYCOLLECTION into multiple features.
   * @type {boolean}
   * @private
   */
  this.splitCollection_ = goog.isDef(options.splitCollection) ?
      options.splitCollection : false;

};
goog.inherits(ol.format.WKT, ol.format.TextFeature);


/**
 * Constants for regExes.
 * @enum {RegExp}
 */
ol.format.WKT.regExes = {
  typeStr: /^\s*(\w+)\s*\(\s*(.*)\s*\)\s*$/,
  spaces: /\s+/,
  parenComma: /\)\s*,\s*\(/,
  doubleParenComma: /\)\s*\)\s*,\s*\(\s*\(/,
  trimParens: /^\s*\(?(.*?)\)?\s*$/,
  geomCollection: /,\s*([A-Za-z])/g,
  removeNewLine: /[\n\r]/g
};


/**
 * @param {string} str WKT point.
 * @return {ol.geom.Point} Parsed point.
 * @private
 */
ol.format.WKT.prototype.parsePoint_ = function(str) {
  var coords = goog.string.trim(str).split(ol.format.WKT.regExes.spaces);
  return new ol.geom.Point(goog.array.map(coords, parseFloat));
};


/**
 * @param {string} str WKT linestring.
 * @return {ol.geom.LineString} Parsed linestring.
 * @private
 */
ol.format.WKT.prototype.parseLineString_ = function(str) {
  var points = goog.string.trim(str).split(',');
  var coordinates = [];
  for (var i = 0, ii = points.length; i < ii; ++i) {
    coordinates.push(this.parsePoint_.apply(this,
        [points[i]]).getCoordinates());
  }
  return new ol.geom.LineString(coordinates);
};


/**
 * @param {string} str WKT multipoint.
 * @return {ol.geom.MultiPoint} Parsed multipoint.
 * @private
 */
ol.format.WKT.prototype.parseMultiPoint_ = function(str) {
  var point;
  var points = goog.string.trim(str).split(',');
  var geom = new ol.geom.MultiPoint(null);
  for (var i = 0, ii = points.length; i < ii; ++i) {
    point = points[i].replace(ol.format.WKT.regExes.trimParens, '$1');
    geom.appendPoint(this.parsePoint_.apply(this, [point]));
  }
  return geom;
};


/**
 * @param {string} str WKT multilinestring.
 * @return {ol.geom.MultiLineString} Parsed multilinestring.
 * @private
 */
ol.format.WKT.prototype.parseMultiLineString_ = function(str) {
  var line;
  var lines = goog.string.trim(str).split(ol.format.WKT.regExes.parenComma);
  var geom = new ol.geom.MultiLineString(null);
  for (var i = 0, ii = lines.length; i < ii; ++i) {
    line = lines[i].replace(ol.format.WKT.regExes.trimParens, '$1');
    geom.appendLineString(this.parseLineString_.apply(this, [line]));
  }
  return geom;
};


/**
 * @param {string} str WKT polygon.
 * @return {ol.geom.Polygon} Parsed polygon.
 * @private
 */
ol.format.WKT.prototype.parsePolygon_ = function(str) {
  var ring, linestring, linearring;
  var rings = goog.string.trim(str).split(ol.format.WKT.regExes.parenComma);
  var coordinates = [];
  for (var i = 0, ii = rings.length; i < ii; ++i) {
    ring = rings[i].replace(ol.format.WKT.regExes.trimParens, '$1');
    linestring = this.parseLineString_.apply(this, [ring]).getCoordinates();
    coordinates.push(linestring);
  }
  return new ol.geom.Polygon(coordinates);
};


/**
 * @param {string} str WKT multipolygon.
 * @return {ol.geom.MultiPolygon} Parsed multipolygon.
 * @private
 */
ol.format.WKT.prototype.parseMultiPolygon_ = function(str) {
  var polygon;
  var polygons = goog.string.trim(str).split(
      ol.format.WKT.regExes.doubleParenComma);
  var geom = new ol.geom.MultiPolygon(null);
  for (var i = 0, ii = polygons.length; i < ii; ++i) {
    polygon = polygons[i].replace(ol.format.WKT.regExes.trimParens, '$1');
    geom.appendPolygon(this.parsePolygon_.apply(this, [polygon]));
  }
  return geom;
};


/**
 * @param {string} str WKT geometrycollection.
 * @return {ol.geom.GeometryCollection} Parsed geometrycollection.
 * @private
 */
ol.format.WKT.prototype.parseGeometryCollection_ = function(str) {
  // separate components of the collection with |
  str = str.replace(ol.format.WKT.regExes.geomCollection, '|$1');
  var wktArray = goog.string.trim(str).split('|');
  var geoms = [];
  for (var i = 0, ii = wktArray.length; i < ii; ++i) {
    geoms.push(this.parse_.apply(this, [wktArray[i]]));
  }
  return new ol.geom.GeometryCollection(geoms);
};


/**
 * @param {ol.geom.Point} geom Point geometry.
 * @return {string} Coordinates part of Point as WKT.
 * @private
 */
ol.format.WKT.prototype.encodePoint_ = function(geom) {
  var coordinates = geom.getCoordinates();
  return coordinates[0] + ' ' + coordinates[1];
};


/**
 * @param {ol.geom.MultiPoint} geom MultiPoint geometry.
 * @return {string} Coordinates part of MultiPoint as WKT.
 * @private
 */
ol.format.WKT.prototype.encodeMultiPoint_ = function(geom) {
  var array = [];
  var components = geom.getPoints();
  for (var i = 0, ii = components.length; i < ii; ++i) {
    array.push('(' + this.encodePoint_.apply(this, [components[i]]) + ')');
  }
  return array.join(',');
};


/**
 * @param {ol.geom.GeometryCollection} geom GeometryCollection geometry.
 * @return {string} Coordinates part of GeometryCollection as WKT.
 * @private
 */
ol.format.WKT.prototype.encodeGeometryCollection_ = function(geom) {
  var array = [];
  var geoms = geom.getGeometries();
  for (var i = 0, ii = geoms.length; i < ii; ++i) {
    array.push(this.encode_.apply(this, [geoms[i]]));
  }
  return array.join(',');
};


/**
 * @param {ol.geom.LineString} geom LineString geometry.
 * @return {string} Coordinates part of LineString as WKT.
 * @private
 */
ol.format.WKT.prototype.encodeLineString_ = function(geom) {
  var coordinates = geom.getCoordinates();
  var array = [];
  for (var i = 0, ii = coordinates.length; i < ii; ++i) {
    array.push(coordinates[i][0] + ' ' + coordinates[i][1]);
  }
  return array.join(',');
};


/**
 * @param {ol.geom.MultiLineString} geom MultiLineString geometry.
 * @return {string} Coordinates part of MultiLineString as WKT.
 * @private
 */
ol.format.WKT.prototype.encodeMultiLineString_ = function(geom) {
  var array = [];
  var components = geom.getLineStrings();
  for (var i = 0, ii = components.length; i < ii; ++i) {
    array.push('(' + this.encodeLineString_.apply(this,
        [components[i]]) + ')');
  }
  return array.join(',');
};


/**
 * @param {ol.geom.Polygon} geom Polygon geometry.
 * @return {string} Coordinates part of Polygon as WKT.
 * @private
 */
ol.format.WKT.prototype.encodePolygon_ = function(geom) {
  var array = [];
  var rings = geom.getLinearRings();
  for (var i = 0, ii = rings.length; i < ii; ++i) {
    array.push('(' + this.encodeLineString_.apply(this,
        [rings[i]]) + ')');
  }
  return array.join(',');
};


/**
 * @param {ol.geom.MultiPolygon} geom MultiPolygon geometry.
 * @return {string} Coordinates part of MultiPolygon as WKT.
 * @private
 */
ol.format.WKT.prototype.encodeMultiPolygon_ = function(geom) {
  var array = [];
  var components = geom.getPolygons();
  for (var i = 0, ii = components.length; i < ii; ++i) {
    array.push('(' + this.encodePolygon_.apply(this, [components[i]]) + ')');
  }
  return array.join(',');
};


/**
 * Parse a WKT string.
 * @param {string} wkt WKT string.
 * @return {ol.geom.Geometry|ol.geom.GeometryCollection|undefined}
 *     The geometry created.
 * @private
 */
ol.format.WKT.prototype.parse_ = function(wkt) {
  wkt = wkt.replace(ol.format.WKT.regExes.removeNewLine, ' ');
  var matches = ol.format.WKT.regExes.typeStr.exec(wkt);
  var geometry;
  if (matches) {
    var type = matches[1].toLowerCase();
    var str = matches[2];
    switch (type) {
      case 'point':
        geometry = this.parsePoint_(str);
        break;
      case 'multipoint':
        geometry = this.parseMultiPoint_(str);
        break;
      case 'linestring':
        geometry = this.parseLineString_(str);
        break;
      case 'multilinestring':
        geometry = this.parseMultiLineString_(str);
        break;
      case 'polygon':
        geometry = this.parsePolygon_(str);
        break;
      case 'multipolygon':
        geometry = this.parseMultiPolygon_(str);
        break;
      case 'geometrycollection':
        geometry = this.parseGeometryCollection_(str);
        break;
      default:
        throw new Error('Bad geometry type: ' + type);
    }
  }
  return geometry;
};


/**
 * Encode a geometry as WKT.
 * @param {ol.geom.Geometry} geom The geometry to encode.
 * @return {string} WKT string for the geometry.
 * @private
 */
ol.format.WKT.prototype.encode_ = function(geom) {
  var type = geom.getType();
  var result = type.toUpperCase() + '(';
  if (geom instanceof ol.geom.Point) {
    result += this.encodePoint_(geom);
  } else if (geom instanceof ol.geom.MultiPoint) {
    result += this.encodeMultiPoint_(geom);
  } else if (geom instanceof ol.geom.LineString) {
    result += this.encodeLineString_(geom);
  } else if (geom instanceof ol.geom.MultiLineString) {
    result += this.encodeMultiLineString_(geom);
  } else if (geom instanceof ol.geom.Polygon) {
    result += this.encodePolygon_(geom);
  } else if (geom instanceof ol.geom.MultiPolygon) {
    result += this.encodeMultiPolygon_(geom);
  } else if (geom instanceof ol.geom.GeometryCollection) {
    result += this.encodeGeometryCollection_(geom);
  } else {
    throw new Error('Bad geometry type: ' + type);
  }
  return result + ')';
};


/**
 * Read a feature from a WKT source.
 *
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
 * @return {ol.Feature} Feature.
 * @todo api
 */
ol.format.WKT.prototype.readFeature;


/**
 * @inheritDoc
 */
ol.format.WKT.prototype.readFeatureFromText = function(text) {
  var geom = this.readGeometryFromText(text);
  if (goog.isDef(geom)) {
    var feature = new ol.Feature();
    feature.setGeometry(geom);
    return feature;
  }
  return null;
};


/**
 * Read all features from a WKT source.
 *
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
 * @return {Array.<ol.Feature>} Features.
 * @todo api
 */
ol.format.WKT.prototype.readFeatures;


/**
 * @inheritDoc
 */
ol.format.WKT.prototype.readFeaturesFromText = function(text) {
  var geometries = [];
  var geometry = this.readGeometryFromText(text);
  if (this.splitCollection_ &&
      geometry.getType() == ol.geom.GeometryType.GEOMETRY_COLLECTION) {
    geometries = (/** @type {ol.geom.GeometryCollection} */ (geometry))
        .getGeometriesArray();
  } else {
    geometries = [geometry];
  }
  var feature, features = [];
  for (var i = 0, ii = geometries.length; i < ii; ++i) {
    feature = new ol.Feature();
    feature.setGeometry(geometries[i]);
    features.push(feature);
  }
  return features;
};


/**
 * Read a single geometry from a WKT source.
 *
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
 * @return {ol.geom.Geometry} Geometry.
 * @todo api
 */
ol.format.WKT.prototype.readGeometry;


/**
 * @inheritDoc
 */
ol.format.WKT.prototype.readGeometryFromText = function(text) {
  return this.parse_(text) || null;
};


/**
 * @inheritDoc
 */
ol.format.WKT.prototype.readProjectionFromText = function(text) {
  return null;
};


/**
 * Encode a feature as a WKT string.
 *
 * @param {ol.Feature} feature Feature.
 * @return {ArrayBuffer|Node|Object|string} Result.
 * @todo api
 */
ol.format.WKT.prototype.writeFeature;


/**
 * @inheritDoc
 */
ol.format.WKT.prototype.writeFeatureText = function(feature) {
  var geometry = feature.getGeometry();
  if (goog.isDef(geometry)) {
    return this.writeGeometryText(geometry);
  }
  return '';
};


/**
 * Encode an array of features as a WKT string.
 *
 * @param {Array.<ol.Feature>} features Features.
 * @return {ArrayBuffer|Node|Object|string} Result.
 * @todo api
 */
ol.format.WKT.prototype.writeFeatures;


/**
 * @inheritDoc
 */
ol.format.WKT.prototype.writeFeaturesText = function(features) {
  if (features.length == 1) {
    return this.writeFeatureText(features[0]);
  }
  var geometries = [];
  for (var i = 0, ii = features.length; i < ii; ++i) {
    geometries.push(features[i].getGeometry());
  }
  var collection = new ol.geom.GeometryCollection(geometries);
  return this.writeGeometryText(collection);
};


/**
 * Write a single geometry as a WKT string.
 *
 * @param {ol.geom.Geometry} geometry Geometry.
 * @return {ArrayBuffer|Node|Object|string} Node.
 * @todo api
 */
ol.format.WKT.prototype.writeGeometry;


/**
 * @inheritDoc
 */
ol.format.WKT.prototype.writeGeometryText = function(geometry) {
  return this.encode_(geometry);
};
