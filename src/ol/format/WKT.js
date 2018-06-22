/**
 * @module ol/format/WKT
 */
import {inherits} from '../util.js';
import Feature from '../Feature.js';
import {transformWithOptions} from '../format/Feature.js';
import TextFeature from '../format/TextFeature.js';
import GeometryCollection from '../geom/GeometryCollection.js';
import GeometryType from '../geom/GeometryType.js';
import GeometryLayout from '../geom/GeometryLayout.js';
import LineString from '../geom/LineString.js';
import MultiLineString from '../geom/MultiLineString.js';
import MultiPoint from '../geom/MultiPoint.js';
import MultiPolygon from '../geom/MultiPolygon.js';
import Point from '../geom/Point.js';
import Polygon from '../geom/Polygon.js';
import SimpleGeometry from '../geom/SimpleGeometry.js';


/**
 * @typedef {Object} Options
 * @property {boolean} [splitCollection=false] Whether to split GeometryCollections into
 * multiple features on reading.
 */

/**
 * @typedef {Object} Token
 * @property {number} type
 * @property {number|string} [value]
 * @property {number} position
 */

/**
 * @const
 * @type {string}
 */
const EMPTY = 'EMPTY';


/**
 * @const
 * @type {string}
 */
const Z = 'Z';


/**
 * @const
 * @type {string}
 */
const M = 'M';


/**
 * @const
 * @type {string}
 */
const ZM = 'ZM';


/**
 * @const
 * @enum {number}
 */
const TokenType = {
  TEXT: 1,
  LEFT_PAREN: 2,
  RIGHT_PAREN: 3,
  NUMBER: 4,
  COMMA: 5,
  EOF: 6
};


/**
 * Class to tokenize a WKT string.
 * @param {string} wkt WKT string.
 * @constructor
 */
const Lexer = function(wkt) {

  /**
   * @type {string}
   */
  this.wkt = wkt;

  /**
   * @type {number}
   * @private
   */
  this.index_ = -1;
};


/**
 * @param {string} c Character.
 * @return {boolean} Whether the character is alphabetic.
 * @private
 */
Lexer.prototype.isAlpha_ = function(c) {
  return c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z';
};


/**
 * @param {string} c Character.
 * @param {boolean=} opt_decimal Whether the string number
 *     contains a dot, i.e. is a decimal number.
 * @return {boolean} Whether the character is numeric.
 * @private
 */
Lexer.prototype.isNumeric_ = function(c, opt_decimal) {
  const decimal = opt_decimal !== undefined ? opt_decimal : false;
  return c >= '0' && c <= '9' || c == '.' && !decimal;
};


/**
 * @param {string} c Character.
 * @return {boolean} Whether the character is whitespace.
 * @private
 */
Lexer.prototype.isWhiteSpace_ = function(c) {
  return c == ' ' || c == '\t' || c == '\r' || c == '\n';
};


/**
 * @return {string} Next string character.
 * @private
 */
Lexer.prototype.nextChar_ = function() {
  return this.wkt.charAt(++this.index_);
};


/**
 * Fetch and return the next token.
 * @return {!module:ol/format/WKT~Token} Next string token.
 */
Lexer.prototype.nextToken = function() {
  const c = this.nextChar_();
  const token = {position: this.index_, value: c};

  if (c == '(') {
    token.type = TokenType.LEFT_PAREN;
  } else if (c == ',') {
    token.type = TokenType.COMMA;
  } else if (c == ')') {
    token.type = TokenType.RIGHT_PAREN;
  } else if (this.isNumeric_(c) || c == '-') {
    token.type = TokenType.NUMBER;
    token.value = this.readNumber_();
  } else if (this.isAlpha_(c)) {
    token.type = TokenType.TEXT;
    token.value = this.readText_();
  } else if (this.isWhiteSpace_(c)) {
    return this.nextToken();
  } else if (c === '') {
    token.type = TokenType.EOF;
  } else {
    throw new Error('Unexpected character: ' + c);
  }

  return token;
};


/**
 * @return {number} Numeric token value.
 * @private
 */
Lexer.prototype.readNumber_ = function() {
  let c;
  const index = this.index_;
  let decimal = false;
  let scientificNotation = false;
  do {
    if (c == '.') {
      decimal = true;
    } else if (c == 'e' || c == 'E') {
      scientificNotation = true;
    }
    c = this.nextChar_();
  } while (
    this.isNumeric_(c, decimal) ||
      // if we haven't detected a scientific number before, 'e' or 'E'
      // hint that we should continue to read
      !scientificNotation && (c == 'e' || c == 'E') ||
      // once we know that we have a scientific number, both '-' and '+'
      // are allowed
      scientificNotation && (c == '-' || c == '+')
  );
  return parseFloat(this.wkt.substring(index, this.index_--));
};


/**
 * @return {string} String token value.
 * @private
 */
Lexer.prototype.readText_ = function() {
  let c;
  const index = this.index_;
  do {
    c = this.nextChar_();
  } while (this.isAlpha_(c));
  return this.wkt.substring(index, this.index_--).toUpperCase();
};


/**
 * Class to parse the tokens from the WKT string.
 * @param {module:ol/format/WKT~Lexer} lexer The lexer.
 * @constructor
 */
const Parser = function(lexer) {

  /**
   * @type {module:ol/format/WKT~Lexer}
   * @private
   */
  this.lexer_ = lexer;

  /**
   * @type {module:ol/format/WKT~Token}
   * @private
   */
  this.token_;

  /**
   * @type {module:ol/geom/GeometryLayout}
   * @private
   */
  this.layout_ = GeometryLayout.XY;
};


/**
 * Fetch the next token form the lexer and replace the active token.
 * @private
 */
Parser.prototype.consume_ = function() {
  this.token_ = this.lexer_.nextToken();
};

/**
 * Tests if the given type matches the type of the current token.
 * @param {module:ol/format/WKT~TokenType} type Token type.
 * @return {boolean} Whether the token matches the given type.
 */
Parser.prototype.isTokenType = function(type) {
  const isMatch = this.token_.type == type;
  return isMatch;
};


/**
 * If the given type matches the current token, consume it.
 * @param {module:ol/format/WKT~TokenType} type Token type.
 * @return {boolean} Whether the token matches the given type.
 */
Parser.prototype.match = function(type) {
  const isMatch = this.isTokenType(type);
  if (isMatch) {
    this.consume_();
  }
  return isMatch;
};


/**
 * Try to parse the tokens provided by the lexer.
 * @return {module:ol/geom/Geometry} The geometry.
 */
Parser.prototype.parse = function() {
  this.consume_();
  const geometry = this.parseGeometry_();
  return geometry;
};


/**
 * Try to parse the dimensional info.
 * @return {module:ol/geom/GeometryLayout} The layout.
 * @private
 */
Parser.prototype.parseGeometryLayout_ = function() {
  let layout = GeometryLayout.XY;
  const dimToken = this.token_;
  if (this.isTokenType(TokenType.TEXT)) {
    const dimInfo = dimToken.value;
    if (dimInfo === Z) {
      layout = GeometryLayout.XYZ;
    } else if (dimInfo === M) {
      layout = GeometryLayout.XYM;
    } else if (dimInfo === ZM) {
      layout = GeometryLayout.XYZM;
    }
    if (layout !== GeometryLayout.XY) {
      this.consume_();
    }
  }
  return layout;
};


/**
 * @return {!Array.<module:ol/geom/Geometry>} A collection of geometries.
 * @private
 */
Parser.prototype.parseGeometryCollectionText_ = function() {
  if (this.match(TokenType.LEFT_PAREN)) {
    const geometries = [];
    do {
      geometries.push(this.parseGeometry_());
    } while (this.match(TokenType.COMMA));
    if (this.match(TokenType.RIGHT_PAREN)) {
      return geometries;
    }
  } else if (this.isEmptyGeometry_()) {
    return [];
  }
  throw new Error(this.formatErrorMessage_());
};


/**
 * @return {Array.<number>} All values in a point.
 * @private
 */
Parser.prototype.parsePointText_ = function() {
  if (this.match(TokenType.LEFT_PAREN)) {
    const coordinates = this.parsePoint_();
    if (this.match(TokenType.RIGHT_PAREN)) {
      return coordinates;
    }
  } else if (this.isEmptyGeometry_()) {
    return null;
  }
  throw new Error(this.formatErrorMessage_());
};


/**
 * @return {!Array.<!Array.<number>>} All points in a linestring.
 * @private
 */
Parser.prototype.parseLineStringText_ = function() {
  if (this.match(TokenType.LEFT_PAREN)) {
    const coordinates = this.parsePointList_();
    if (this.match(TokenType.RIGHT_PAREN)) {
      return coordinates;
    }
  } else if (this.isEmptyGeometry_()) {
    return [];
  }
  throw new Error(this.formatErrorMessage_());
};


/**
 * @return {!Array.<!Array.<number>>} All points in a polygon.
 * @private
 */
Parser.prototype.parsePolygonText_ = function() {
  if (this.match(TokenType.LEFT_PAREN)) {
    const coordinates = this.parseLineStringTextList_();
    if (this.match(TokenType.RIGHT_PAREN)) {
      return coordinates;
    }
  } else if (this.isEmptyGeometry_()) {
    return [];
  }
  throw new Error(this.formatErrorMessage_());
};


/**
 * @return {!Array.<!Array.<number>>} All points in a multipoint.
 * @private
 */
Parser.prototype.parseMultiPointText_ = function() {
  if (this.match(TokenType.LEFT_PAREN)) {
    let coordinates;
    if (this.token_.type == TokenType.LEFT_PAREN) {
      coordinates = this.parsePointTextList_();
    } else {
      coordinates = this.parsePointList_();
    }
    if (this.match(TokenType.RIGHT_PAREN)) {
      return coordinates;
    }
  } else if (this.isEmptyGeometry_()) {
    return [];
  }
  throw new Error(this.formatErrorMessage_());
};


/**
 * @return {!Array.<!Array.<number>>} All linestring points
 *                                        in a multilinestring.
 * @private
 */
Parser.prototype.parseMultiLineStringText_ = function() {
  if (this.match(TokenType.LEFT_PAREN)) {
    const coordinates = this.parseLineStringTextList_();
    if (this.match(TokenType.RIGHT_PAREN)) {
      return coordinates;
    }
  } else if (this.isEmptyGeometry_()) {
    return [];
  }
  throw new Error(this.formatErrorMessage_());
};


/**
 * @return {!Array.<!Array.<number>>} All polygon points in a multipolygon.
 * @private
 */
Parser.prototype.parseMultiPolygonText_ = function() {
  if (this.match(TokenType.LEFT_PAREN)) {
    const coordinates = this.parsePolygonTextList_();
    if (this.match(TokenType.RIGHT_PAREN)) {
      return coordinates;
    }
  } else if (this.isEmptyGeometry_()) {
    return [];
  }
  throw new Error(this.formatErrorMessage_());
};


/**
 * @return {!Array.<number>} A point.
 * @private
 */
Parser.prototype.parsePoint_ = function() {
  const coordinates = [];
  const dimensions = this.layout_.length;
  for (let i = 0; i < dimensions; ++i) {
    const token = this.token_;
    if (this.match(TokenType.NUMBER)) {
      coordinates.push(token.value);
    } else {
      break;
    }
  }
  if (coordinates.length == dimensions) {
    return coordinates;
  }
  throw new Error(this.formatErrorMessage_());
};


/**
 * @return {!Array.<!Array.<number>>} An array of points.
 * @private
 */
Parser.prototype.parsePointList_ = function() {
  const coordinates = [this.parsePoint_()];
  while (this.match(TokenType.COMMA)) {
    coordinates.push(this.parsePoint_());
  }
  return coordinates;
};


/**
 * @return {!Array.<!Array.<number>>} An array of points.
 * @private
 */
Parser.prototype.parsePointTextList_ = function() {
  const coordinates = [this.parsePointText_()];
  while (this.match(TokenType.COMMA)) {
    coordinates.push(this.parsePointText_());
  }
  return coordinates;
};


/**
 * @return {!Array.<!Array.<number>>} An array of points.
 * @private
 */
Parser.prototype.parseLineStringTextList_ = function() {
  const coordinates = [this.parseLineStringText_()];
  while (this.match(TokenType.COMMA)) {
    coordinates.push(this.parseLineStringText_());
  }
  return coordinates;
};


/**
 * @return {!Array.<!Array.<number>>} An array of points.
 * @private
 */
Parser.prototype.parsePolygonTextList_ = function() {
  const coordinates = [this.parsePolygonText_()];
  while (this.match(TokenType.COMMA)) {
    coordinates.push(this.parsePolygonText_());
  }
  return coordinates;
};


/**
 * @return {boolean} Whether the token implies an empty geometry.
 * @private
 */
Parser.prototype.isEmptyGeometry_ = function() {
  const isEmpty = this.isTokenType(TokenType.TEXT) &&
      this.token_.value == EMPTY;
  if (isEmpty) {
    this.consume_();
  }
  return isEmpty;
};


/**
 * Create an error message for an unexpected token error.
 * @return {string} Error message.
 * @private
 */
Parser.prototype.formatErrorMessage_ = function() {
  return 'Unexpected `' + this.token_.value + '` at position ' +
      this.token_.position + ' in `' + this.lexer_.wkt + '`';
};


/**
 * @classdesc
 * Geometry format for reading and writing data in the `WellKnownText` (WKT)
 * format.
 *
 * @constructor
 * @extends {module:ol/format/TextFeature}
 * @param {module:ol/format/WKT~Options=} opt_options Options.
 * @api
 */
const WKT = function(opt_options) {

  const options = opt_options ? opt_options : {};

  TextFeature.call(this);

  /**
   * Split GeometryCollection into multiple features.
   * @type {boolean}
   * @private
   */
  this.splitCollection_ = options.splitCollection !== undefined ?
    options.splitCollection : false;

};

inherits(WKT, TextFeature);


/**
 * @param {module:ol/geom/Point} geom Point geometry.
 * @return {string} Coordinates part of Point as WKT.
 */
function encodePointGeometry(geom) {
  const coordinates = geom.getCoordinates();
  if (coordinates.length === 0) {
    return '';
  }
  return coordinates.join(' ');
}


/**
 * @param {module:ol/geom/MultiPoint} geom MultiPoint geometry.
 * @return {string} Coordinates part of MultiPoint as WKT.
 */
function encodeMultiPointGeometry(geom) {
  const array = [];
  const components = geom.getPoints();
  for (let i = 0, ii = components.length; i < ii; ++i) {
    array.push('(' + encodePointGeometry(components[i]) + ')');
  }
  return array.join(',');
}


/**
 * @param {module:ol/geom/GeometryCollection} geom GeometryCollection geometry.
 * @return {string} Coordinates part of GeometryCollection as WKT.
 */
function encodeGeometryCollectionGeometry(geom) {
  const array = [];
  const geoms = geom.getGeometries();
  for (let i = 0, ii = geoms.length; i < ii; ++i) {
    array.push(encode(geoms[i]));
  }
  return array.join(',');
}


/**
 * @param {module:ol/geom/LineString|module:ol/geom/LinearRing} geom LineString geometry.
 * @return {string} Coordinates part of LineString as WKT.
 */
function encodeLineStringGeometry(geom) {
  const coordinates = geom.getCoordinates();
  const array = [];
  for (let i = 0, ii = coordinates.length; i < ii; ++i) {
    array.push(coordinates[i].join(' '));
  }
  return array.join(',');
}


/**
 * @param {module:ol/geom/MultiLineString} geom MultiLineString geometry.
 * @return {string} Coordinates part of MultiLineString as WKT.
 */
function encodeMultiLineStringGeometry(geom) {
  const array = [];
  const components = geom.getLineStrings();
  for (let i = 0, ii = components.length; i < ii; ++i) {
    array.push('(' + encodeLineStringGeometry(components[i]) + ')');
  }
  return array.join(',');
}


/**
 * @param {module:ol/geom/Polygon} geom Polygon geometry.
 * @return {string} Coordinates part of Polygon as WKT.
 */
function encodePolygonGeometry(geom) {
  const array = [];
  const rings = geom.getLinearRings();
  for (let i = 0, ii = rings.length; i < ii; ++i) {
    array.push('(' + encodeLineStringGeometry(rings[i]) + ')');
  }
  return array.join(',');
}


/**
 * @param {module:ol/geom/MultiPolygon} geom MultiPolygon geometry.
 * @return {string} Coordinates part of MultiPolygon as WKT.
 */
function encodeMultiPolygonGeometry(geom) {
  const array = [];
  const components = geom.getPolygons();
  for (let i = 0, ii = components.length; i < ii; ++i) {
    array.push('(' + encodePolygonGeometry(components[i]) + ')');
  }
  return array.join(',');
}

/**
 * @param {module:ol/geom/SimpleGeometry} geom SimpleGeometry geometry.
 * @return {string} Potential dimensional information for WKT type.
 */
function encodeGeometryLayout(geom) {
  const layout = geom.getLayout();
  let dimInfo = '';
  if (layout === GeometryLayout.XYZ || layout === GeometryLayout.XYZM) {
    dimInfo += Z;
  }
  if (layout === GeometryLayout.XYM || layout === GeometryLayout.XYZM) {
    dimInfo += M;
  }
  return dimInfo;
}


/**
 * @const
 * @type {Object.<string, function(module:ol/geom/Geometry): string>}
 */
const GeometryEncoder = {
  'Point': encodePointGeometry,
  'LineString': encodeLineStringGeometry,
  'Polygon': encodePolygonGeometry,
  'MultiPoint': encodeMultiPointGeometry,
  'MultiLineString': encodeMultiLineStringGeometry,
  'MultiPolygon': encodeMultiPolygonGeometry,
  'GeometryCollection': encodeGeometryCollectionGeometry
};


/**
 * Encode a geometry as WKT.
 * @param {module:ol/geom/Geometry} geom The geometry to encode.
 * @return {string} WKT string for the geometry.
 */
function encode(geom) {
  let type = geom.getType();
  const geometryEncoder = GeometryEncoder[type];
  const enc = geometryEncoder(geom);
  type = type.toUpperCase();
  if (geom instanceof SimpleGeometry) {
    const dimInfo = encodeGeometryLayout(geom);
    if (dimInfo.length > 0) {
      type += ' ' + dimInfo;
    }
  }
  if (enc.length === 0) {
    return type + ' ' + EMPTY;
  }
  return type + '(' + enc + ')';
}


/**
 * Parse a WKT string.
 * @param {string} wkt WKT string.
 * @return {module:ol/geom/Geometry|undefined}
 *     The geometry created.
 * @private
 */
WKT.prototype.parse_ = function(wkt) {
  const lexer = new Lexer(wkt);
  const parser = new Parser(lexer);
  return parser.parse();
};


/**
 * Read a feature from a WKT source.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
 * @return {module:ol/Feature} Feature.
 * @api
 */
WKT.prototype.readFeature;


/**
 * @inheritDoc
 */
WKT.prototype.readFeatureFromText = function(text, opt_options) {
  const geom = this.readGeometryFromText(text, opt_options);
  if (geom) {
    const feature = new Feature();
    feature.setGeometry(geom);
    return feature;
  }
  return null;
};


/**
 * Read all features from a WKT source.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
 * @return {Array.<module:ol/Feature>} Features.
 * @api
 */
WKT.prototype.readFeatures;


/**
 * @inheritDoc
 */
WKT.prototype.readFeaturesFromText = function(text, opt_options) {
  let geometries = [];
  const geometry = this.readGeometryFromText(text, opt_options);
  if (this.splitCollection_ &&
      geometry.getType() == GeometryType.GEOMETRY_COLLECTION) {
    geometries = (/** @type {module:ol/geom/GeometryCollection} */ (geometry))
      .getGeometriesArray();
  } else {
    geometries = [geometry];
  }
  const features = [];
  for (let i = 0, ii = geometries.length; i < ii; ++i) {
    const feature = new Feature();
    feature.setGeometry(geometries[i]);
    features.push(feature);
  }
  return features;
};


/**
 * Read a single geometry from a WKT source.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
 * @return {module:ol/geom/Geometry} Geometry.
 * @api
 */
WKT.prototype.readGeometry;


/**
 * @inheritDoc
 */
WKT.prototype.readGeometryFromText = function(text, opt_options) {
  const geometry = this.parse_(text);
  if (geometry) {
    return (
      /** @type {module:ol/geom/Geometry} */ (transformWithOptions(geometry, false, opt_options))
    );
  } else {
    return null;
  }
};


/**
 * @enum {function (new:module:ol/geom/Geometry, Array, module:ol/geom/GeometryLayout)}
 */
const GeometryConstructor = {
  'POINT': Point,
  'LINESTRING': LineString,
  'POLYGON': Polygon,
  'MULTIPOINT': MultiPoint,
  'MULTILINESTRING': MultiLineString,
  'MULTIPOLYGON': MultiPolygon
};


/**
 * @enum {(function(): Array)}
 */
const GeometryParser = {
  'POINT': Parser.prototype.parsePointText_,
  'LINESTRING': Parser.prototype.parseLineStringText_,
  'POLYGON': Parser.prototype.parsePolygonText_,
  'MULTIPOINT': Parser.prototype.parseMultiPointText_,
  'MULTILINESTRING': Parser.prototype.parseMultiLineStringText_,
  'MULTIPOLYGON': Parser.prototype.parseMultiPolygonText_
};


/**
 * @return {!module:ol/geom/Geometry} The geometry.
 * @private
 */
Parser.prototype.parseGeometry_ = function() {
  const token = this.token_;
  if (this.match(TokenType.TEXT)) {
    const geomType = token.value;
    this.layout_ = this.parseGeometryLayout_();
    if (geomType == GeometryType.GEOMETRY_COLLECTION.toUpperCase()) {
      const geometries = this.parseGeometryCollectionText_();
      return new GeometryCollection(geometries);
    } else {
      const parser = GeometryParser[geomType];
      const ctor = GeometryConstructor[geomType];
      if (!parser || !ctor) {
        throw new Error('Invalid geometry type: ' + geomType);
      }
      const coordinates = parser.call(this);
      return new ctor(coordinates, this.layout_);
    }
  }
  throw new Error(this.formatErrorMessage_());
};


/**
 * Encode a feature as a WKT string.
 *
 * @function
 * @param {module:ol/Feature} feature Feature.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @return {string} WKT string.
 * @api
 */
WKT.prototype.writeFeature;


/**
 * @inheritDoc
 */
WKT.prototype.writeFeatureText = function(feature, opt_options) {
  const geometry = feature.getGeometry();
  if (geometry) {
    return this.writeGeometryText(geometry, opt_options);
  }
  return '';
};


/**
 * Encode an array of features as a WKT string.
 *
 * @function
 * @param {Array.<module:ol/Feature>} features Features.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @return {string} WKT string.
 * @api
 */
WKT.prototype.writeFeatures;


/**
 * @inheritDoc
 */
WKT.prototype.writeFeaturesText = function(features, opt_options) {
  if (features.length == 1) {
    return this.writeFeatureText(features[0], opt_options);
  }
  const geometries = [];
  for (let i = 0, ii = features.length; i < ii; ++i) {
    geometries.push(features[i].getGeometry());
  }
  const collection = new GeometryCollection(geometries);
  return this.writeGeometryText(collection, opt_options);
};


/**
 * Write a single geometry as a WKT string.
 *
 * @function
 * @param {module:ol/geom/Geometry} geometry Geometry.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @return {string} WKT string.
 * @api
 */
WKT.prototype.writeGeometry;


/**
 * @inheritDoc
 */
WKT.prototype.writeGeometryText = function(geometry, opt_options) {
  return encode(/** @type {module:ol/geom/Geometry} */ (
    transformWithOptions(geometry, true, opt_options)));
};


export default WKT;
