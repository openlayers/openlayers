goog.provide('ol.parser.WKT');

goog.require('goog.string');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.geom.GeometryType');
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
ol.parser.WKT = function() {
  this.regExes = {
    typeStr: /^\s*(\w+)\s*\(\s*(.*)\s*\)\s*$/,
    spaces: /\s+/,
    parenComma: /\)\s*,\s*\(/,
    doubleParenComma: /\)\s*\)\s*,\s*\(\s*\(/,
    trimParens: /^\s*\(?(.*?)\)?\s*$/
  };
};
goog.inherits(ol.parser.WKT, ol.parser.Parser);


/**
 * @param {string} str WKT point.
 * @return {ol.geom.Point} Parsed point.
 * @private
 */
ol.parser.WKT.prototype.parsePoint_ = function(str) {
  var coords = goog.string.trim(str).split(this.regExes.spaces);
  return new ol.geom.Point(coords.map(parseFloat));
};


/**
 * @param {string} str WKT linestring.
 * @return {ol.geom.LineString} Parsed linestring.
 * @private
 */
ol.parser.WKT.prototype.parseLineString_ = function(str) {
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
ol.parser.WKT.prototype.parseMultiPoint_ = function(str) {
  var point;
  var points = goog.string.trim(str).split(',');
  var parts = [];
  for (var i = 0, ii = points.length; i < ii; ++i) {
    point = points[i].replace(this.regExes.trimParens, '$1');
    parts.push(this.parsePoint_.apply(this, [point]));
  }
  return ol.geom.MultiPoint.fromParts(parts);
};


/**
 * @param {string} str WKT multilinestring.
 * @return {ol.geom.MultiLineString} Parsed multilinestring.
 * @private
 */
ol.parser.WKT.prototype.parseMultiLineString_ = function(str) {
  var line;
  var lines = goog.string.trim(str).split(this.regExes.parenComma);
  var parts = [];
  for (var i = 0, ii = lines.length; i < ii; ++i) {
    line = lines[i].replace(this.regExes.trimParens, '$1');
    parts.push(this.parseLineString_.apply(this, [line]));
  }
  return ol.geom.MultiLineString.fromParts(parts);
};


/**
 * @param {string} str WKT polygon.
 * @return {ol.geom.Polygon} Parsed polygon.
 * @private
 */
ol.parser.WKT.prototype.parsePolygon_ = function(str) {
  var ring, linestring, linearring;
  var rings = goog.string.trim(str).split(this.regExes.parenComma);
  var coordinates = [];
  for (var i = 0, ii = rings.length; i < ii; ++i) {
    ring = rings[i].replace(this.regExes.trimParens, '$1');
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
ol.parser.WKT.prototype.parseMultiPolygon_ = function(str) {
  var polygon;
  var polygons = goog.string.trim(str).split(this.regExes.doubleParenComma);
  var parts = [];
  for (var i = 0, ii = polygons.length; i < ii; ++i) {
    polygon = polygons[i].replace(this.regExes.trimParens, '$1');
    parts.push(this.parsePolygon_.apply(this, [polygon]));
  }
  return ol.geom.MultiPolygon.fromParts(parts);
};


/**
 * @param {string} str WKT geometrycollection.
 * @return {ol.geom.GeometryCollection} Parsed geometrycollection.
 * @private
 */
ol.parser.WKT.prototype.parseGeometryCollection_ = function(str) {
  // separate components of the collection with |
  str = str.replace(/,\s*([A-Za-z])/g, '|$1');
  var wktArray = goog.string.trim(str).split('|');
  var components = [];
  for (var i = 0, ii = wktArray.length; i < ii; ++i) {
    components.push(this.parse_.apply(this, [wktArray[i]]));
  }
  return new ol.geom.GeometryCollection(components);
};


/**
 * @param {ol.geom.Point} geom Point geometry.
 * @return {string} Coordinates part of Point as WKT.
 * @private
 */
ol.parser.WKT.prototype.encodePoint_ = function(geom) {
  var coordinates = geom.getCoordinates();
  return coordinates[0] + ' ' + coordinates[1];
};


/**
 * @param {ol.geom.MultiPoint} geom MultiPoint geometry.
 * @return {string} Coordinates part of MultiPoint as WKT.
 * @private
 */
ol.parser.WKT.prototype.encodeMultiPoint_ = function(geom) {
  var array = [];
  for (var i = 0, ii = geom.components.length; i < ii; ++i) {
    array.push('(' + this.encodePoint_.apply(this, [geom.components[i]]) + ')');
  }
  return array.join(',');
};


/**
 * @param {ol.geom.GeometryCollection} geom GeometryCollection geometry.
 * @return {string} Coordinates part of GeometryCollection as WKT.
 * @private
 */
ol.parser.WKT.prototype.encodeGeometryCollection_ = function(geom) {
  var array = [];
  for (var i = 0, ii = geom.components.length; i < ii; ++i) {
    array.push(this.encode_.apply(this, [geom.components[i]]));
  }
  return array.join(',');
};


/**
 * @param {ol.geom.LineString} geom LineString geometry.
 * @return {string} Coordinates part of LineString as WKT.
 * @private
 */
ol.parser.WKT.prototype.encodeLineString_ = function(geom) {
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
ol.parser.WKT.prototype.encodeMultiLineString_ = function(geom) {
  var array = [];
  for (var i = 0, ii = geom.components.length; i < ii; ++i) {
    array.push('(' + this.encodeLineString_.apply(this,
        [geom.components[i]]) + ')');
  }
  return array.join(',');
};


/**
 * @param {ol.geom.Polygon} geom Polygon geometry.
 * @return {string} Coordinates part of Polygon as WKT.
 * @private
 */
ol.parser.WKT.prototype.encodePolygon_ = function(geom) {
  var array = [];
  for (var i = 0, ii = geom.rings.length; i < ii; ++i) {
    array.push('(' + this.encodeLineString_.apply(this,
        [geom.rings[i]]) + ')');
  }
  return array.join(',');
};


/**
 * @param {ol.geom.MultiPolygon} geom MultiPolygon geometry.
 * @return {string} Coordinates part of MultiPolygon as WKT.
 * @private
 */
ol.parser.WKT.prototype.encodeMultiPolygon_ = function(geom) {
  var array = [];
  for (var i = 0, ii = geom.components.length; i < ii; ++i) {
    array.push('(' + this.encodePolygon_.apply(this,
        [geom.components[i]]) + ')');
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
ol.parser.WKT.prototype.parse_ = function(wkt) {
  wkt = wkt.replace(/[\n\r]/g, ' ');
  var matches = this.regExes.typeStr.exec(wkt);
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
ol.parser.WKT.prototype.encode_ = function(geom) {
  var type = geom.getType();
  var result = type.toUpperCase() + '(';
  switch (type) {
    case ol.geom.GeometryType.POINT:
      result += this.encodePoint_(/** @type {ol.geom.Point} */ (geom));
      break;
    case ol.geom.GeometryType.MULTIPOINT:
      result += this.encodeMultiPoint_(
          /** @type {ol.geom.MultiPoint} */ (geom));
      break;
    case ol.geom.GeometryType.LINESTRING:
      result += this.encodeLineString_(
          /** @type {ol.geom.LineString} */ (geom));
      break;
    case ol.geom.GeometryType.MULTILINESTRING:
      result += this.encodeMultiLineString_(
          /** @type {ol.geom.MultiLineString} */ (geom));
      break;
    case ol.geom.GeometryType.POLYGON:
      result += this.encodePolygon_(
          /** @type {ol.geom.Polygon} */ (geom));
      break;
    case ol.geom.GeometryType.MULTIPOLYGON:
      result += this.encodeMultiPolygon_(
          /** @type {ol.geom.MultiPolygon} */ (geom));
      break;
    case ol.geom.GeometryType.GEOMETRYCOLLECTION:
      result += this.encodeGeometryCollection_(
          /** @type {ol.geom.GeometryCollection} */ (geom));
      break;
    default:
      throw new Error('Bad geometry type: ' + type);
  }
  return result + ')';
};


/**
 * Parse a WKT string.
 * @param {string} str WKT string.
 * @return {ol.geom.Geometry|undefined} Parsed geometry.
 */
ol.parser.WKT.prototype.read = function(str) {
  return this.parse_(str);
};


/**
 * Write out a geometry as a WKT string.
 * @param {ol.geom.Geometry} geom The geometry to encode.
 * @return {string} WKT for the geometry.
 */
ol.parser.WKT.prototype.write = function(geom) {
  return this.encode_(geom);
};
