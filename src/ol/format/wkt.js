import _ol_ from '../index';
import _ol_Feature_ from '../feature';
import _ol_format_Feature_ from '../format/feature';
import _ol_format_TextFeature_ from '../format/textfeature';
import _ol_geom_GeometryCollection_ from '../geom/geometrycollection';
import _ol_geom_GeometryType_ from '../geom/geometrytype';
import _ol_geom_GeometryLayout_ from '../geom/geometrylayout';
import _ol_geom_LineString_ from '../geom/linestring';
import _ol_geom_MultiLineString_ from '../geom/multilinestring';
import _ol_geom_MultiPoint_ from '../geom/multipoint';
import _ol_geom_MultiPolygon_ from '../geom/multipolygon';
import _ol_geom_Point_ from '../geom/point';
import _ol_geom_Polygon_ from '../geom/polygon';
import _ol_geom_SimpleGeometry_ from '../geom/simplegeometry';

/**
 * @classdesc
 * Geometry format for reading and writing data in the `WellKnownText` (WKT)
 * format.
 *
 * @constructor
 * @extends {ol.format.TextFeature}
 * @param {olx.format.WKTOptions=} opt_options Options.
 * @api
 */
var _ol_format_WKT_ = function(opt_options) {

  var options = opt_options ? opt_options : {};

  _ol_format_TextFeature_.call(this);

  /**
   * Split GeometryCollection into multiple features.
   * @type {boolean}
   * @private
   */
  this.splitCollection_ = options.splitCollection !== undefined ?
    options.splitCollection : false;

};

_ol_.inherits(_ol_format_WKT_, _ol_format_TextFeature_);


/**
 * @const
 * @type {string}
 */
_ol_format_WKT_.EMPTY = 'EMPTY';


/**
 * @const
 * @type {string}
 */
_ol_format_WKT_.Z = 'Z';


/**
 * @const
 * @type {string}
 */
_ol_format_WKT_.M = 'M';


/**
 * @const
 * @type {string}
 */
_ol_format_WKT_.ZM = 'ZM';


/**
 * @param {ol.geom.Point} geom Point geometry.
 * @return {string} Coordinates part of Point as WKT.
 * @private
 */
_ol_format_WKT_.encodePointGeometry_ = function(geom) {
  var coordinates = geom.getCoordinates();
  if (coordinates.length === 0) {
    return '';
  }
  return coordinates.join(' ');
};


/**
 * @param {ol.geom.MultiPoint} geom MultiPoint geometry.
 * @return {string} Coordinates part of MultiPoint as WKT.
 * @private
 */
_ol_format_WKT_.encodeMultiPointGeometry_ = function(geom) {
  var array = [];
  var components = geom.getPoints();
  for (var i = 0, ii = components.length; i < ii; ++i) {
    array.push('(' + _ol_format_WKT_.encodePointGeometry_(components[i]) + ')');
  }
  return array.join(',');
};


/**
 * @param {ol.geom.GeometryCollection} geom GeometryCollection geometry.
 * @return {string} Coordinates part of GeometryCollection as WKT.
 * @private
 */
_ol_format_WKT_.encodeGeometryCollectionGeometry_ = function(geom) {
  var array = [];
  var geoms = geom.getGeometries();
  for (var i = 0, ii = geoms.length; i < ii; ++i) {
    array.push(_ol_format_WKT_.encode_(geoms[i]));
  }
  return array.join(',');
};


/**
 * @param {ol.geom.LineString|ol.geom.LinearRing} geom LineString geometry.
 * @return {string} Coordinates part of LineString as WKT.
 * @private
 */
_ol_format_WKT_.encodeLineStringGeometry_ = function(geom) {
  var coordinates = geom.getCoordinates();
  var array = [];
  for (var i = 0, ii = coordinates.length; i < ii; ++i) {
    array.push(coordinates[i].join(' '));
  }
  return array.join(',');
};


/**
 * @param {ol.geom.MultiLineString} geom MultiLineString geometry.
 * @return {string} Coordinates part of MultiLineString as WKT.
 * @private
 */
_ol_format_WKT_.encodeMultiLineStringGeometry_ = function(geom) {
  var array = [];
  var components = geom.getLineStrings();
  for (var i = 0, ii = components.length; i < ii; ++i) {
    array.push('(' + _ol_format_WKT_.encodeLineStringGeometry_(
        components[i]) + ')');
  }
  return array.join(',');
};


/**
 * @param {ol.geom.Polygon} geom Polygon geometry.
 * @return {string} Coordinates part of Polygon as WKT.
 * @private
 */
_ol_format_WKT_.encodePolygonGeometry_ = function(geom) {
  var array = [];
  var rings = geom.getLinearRings();
  for (var i = 0, ii = rings.length; i < ii; ++i) {
    array.push('(' + _ol_format_WKT_.encodeLineStringGeometry_(
        rings[i]) + ')');
  }
  return array.join(',');
};


/**
 * @param {ol.geom.MultiPolygon} geom MultiPolygon geometry.
 * @return {string} Coordinates part of MultiPolygon as WKT.
 * @private
 */
_ol_format_WKT_.encodeMultiPolygonGeometry_ = function(geom) {
  var array = [];
  var components = geom.getPolygons();
  for (var i = 0, ii = components.length; i < ii; ++i) {
    array.push('(' + _ol_format_WKT_.encodePolygonGeometry_(
        components[i]) + ')');
  }
  return array.join(',');
};

/**
 * @param {ol.geom.SimpleGeometry} geom SimpleGeometry geometry.
 * @return {string} Potential dimensional information for WKT type.
 * @private
 */
_ol_format_WKT_.encodeGeometryLayout_ = function(geom) {
  var layout = geom.getLayout();
  var dimInfo = '';
  if (layout === _ol_geom_GeometryLayout_.XYZ || layout === _ol_geom_GeometryLayout_.XYZM) {
    dimInfo += _ol_format_WKT_.Z;
  }
  if (layout === _ol_geom_GeometryLayout_.XYM || layout === _ol_geom_GeometryLayout_.XYZM) {
    dimInfo += _ol_format_WKT_.M;
  }
  return dimInfo;
};


/**
 * Encode a geometry as WKT.
 * @param {ol.geom.Geometry} geom The geometry to encode.
 * @return {string} WKT string for the geometry.
 * @private
 */
_ol_format_WKT_.encode_ = function(geom) {
  var type = geom.getType();
  var geometryEncoder = _ol_format_WKT_.GeometryEncoder_[type];
  var enc = geometryEncoder(geom);
  type = type.toUpperCase();
  if (geom instanceof _ol_geom_SimpleGeometry_) {
    var dimInfo = _ol_format_WKT_.encodeGeometryLayout_(geom);
    if (dimInfo.length > 0) {
      type += ' ' + dimInfo;
    }
  }
  if (enc.length === 0) {
    return type + ' ' + _ol_format_WKT_.EMPTY;
  }
  return type + '(' + enc + ')';
};


/**
 * @const
 * @type {Object.<string, function(ol.geom.Geometry): string>}
 * @private
 */
_ol_format_WKT_.GeometryEncoder_ = {
  'Point': _ol_format_WKT_.encodePointGeometry_,
  'LineString': _ol_format_WKT_.encodeLineStringGeometry_,
  'Polygon': _ol_format_WKT_.encodePolygonGeometry_,
  'MultiPoint': _ol_format_WKT_.encodeMultiPointGeometry_,
  'MultiLineString': _ol_format_WKT_.encodeMultiLineStringGeometry_,
  'MultiPolygon': _ol_format_WKT_.encodeMultiPolygonGeometry_,
  'GeometryCollection': _ol_format_WKT_.encodeGeometryCollectionGeometry_
};


/**
 * Parse a WKT string.
 * @param {string} wkt WKT string.
 * @return {ol.geom.Geometry|undefined}
 *     The geometry created.
 * @private
 */
_ol_format_WKT_.prototype.parse_ = function(wkt) {
  var lexer = new _ol_format_WKT_.Lexer(wkt);
  var parser = new _ol_format_WKT_.Parser(lexer);
  return parser.parse();
};


/**
 * Read a feature from a WKT source.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {ol.Feature} Feature.
 * @api
 */
_ol_format_WKT_.prototype.readFeature;


/**
 * @inheritDoc
 */
_ol_format_WKT_.prototype.readFeatureFromText = function(text, opt_options) {
  var geom = this.readGeometryFromText(text, opt_options);
  if (geom) {
    var feature = new _ol_Feature_();
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
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {Array.<ol.Feature>} Features.
 * @api
 */
_ol_format_WKT_.prototype.readFeatures;


/**
 * @inheritDoc
 */
_ol_format_WKT_.prototype.readFeaturesFromText = function(text, opt_options) {
  var geometries = [];
  var geometry = this.readGeometryFromText(text, opt_options);
  if (this.splitCollection_ &&
      geometry.getType() == _ol_geom_GeometryType_.GEOMETRY_COLLECTION) {
    geometries = (/** @type {ol.geom.GeometryCollection} */ (geometry))
        .getGeometriesArray();
  } else {
    geometries = [geometry];
  }
  var feature, features = [];
  for (var i = 0, ii = geometries.length; i < ii; ++i) {
    feature = new _ol_Feature_();
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
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {ol.geom.Geometry} Geometry.
 * @api
 */
_ol_format_WKT_.prototype.readGeometry;


/**
 * @inheritDoc
 */
_ol_format_WKT_.prototype.readGeometryFromText = function(text, opt_options) {
  var geometry = this.parse_(text);
  if (geometry) {
    return (
      /** @type {ol.geom.Geometry} */ _ol_format_Feature_.transformWithOptions(geometry, false, opt_options)
    );
  } else {
    return null;
  }
};


/**
 * Encode a feature as a WKT string.
 *
 * @function
 * @param {ol.Feature} feature Feature.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {string} WKT string.
 * @api
 */
_ol_format_WKT_.prototype.writeFeature;


/**
 * @inheritDoc
 */
_ol_format_WKT_.prototype.writeFeatureText = function(feature, opt_options) {
  var geometry = feature.getGeometry();
  if (geometry) {
    return this.writeGeometryText(geometry, opt_options);
  }
  return '';
};


/**
 * Encode an array of features as a WKT string.
 *
 * @function
 * @param {Array.<ol.Feature>} features Features.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {string} WKT string.
 * @api
 */
_ol_format_WKT_.prototype.writeFeatures;


/**
 * @inheritDoc
 */
_ol_format_WKT_.prototype.writeFeaturesText = function(features, opt_options) {
  if (features.length == 1) {
    return this.writeFeatureText(features[0], opt_options);
  }
  var geometries = [];
  for (var i = 0, ii = features.length; i < ii; ++i) {
    geometries.push(features[i].getGeometry());
  }
  var collection = new _ol_geom_GeometryCollection_(geometries);
  return this.writeGeometryText(collection, opt_options);
};


/**
 * Write a single geometry as a WKT string.
 *
 * @function
 * @param {ol.geom.Geometry} geometry Geometry.
 * @return {string} WKT string.
 * @api
 */
_ol_format_WKT_.prototype.writeGeometry;


/**
 * @inheritDoc
 */
_ol_format_WKT_.prototype.writeGeometryText = function(geometry, opt_options) {
  return _ol_format_WKT_.encode_(/** @type {ol.geom.Geometry} */ (
    _ol_format_Feature_.transformWithOptions(geometry, true, opt_options)));
};


/**
 * @const
 * @enum {number}
 * @private
 */
_ol_format_WKT_.TokenType_ = {
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
 * @protected
 */
_ol_format_WKT_.Lexer = function(wkt) {

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
_ol_format_WKT_.Lexer.prototype.isAlpha_ = function(c) {
  return c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z';
};


/**
 * @param {string} c Character.
 * @param {boolean=} opt_decimal Whether the string number
 *     contains a dot, i.e. is a decimal number.
 * @return {boolean} Whether the character is numeric.
 * @private
 */
_ol_format_WKT_.Lexer.prototype.isNumeric_ = function(c, opt_decimal) {
  var decimal = opt_decimal !== undefined ? opt_decimal : false;
  return c >= '0' && c <= '9' || c == '.' && !decimal;
};


/**
 * @param {string} c Character.
 * @return {boolean} Whether the character is whitespace.
 * @private
 */
_ol_format_WKT_.Lexer.prototype.isWhiteSpace_ = function(c) {
  return c == ' ' || c == '\t' || c == '\r' || c == '\n';
};


/**
 * @return {string} Next string character.
 * @private
 */
_ol_format_WKT_.Lexer.prototype.nextChar_ = function() {
  return this.wkt.charAt(++this.index_);
};


/**
 * Fetch and return the next token.
 * @return {!ol.WKTToken} Next string token.
 */
_ol_format_WKT_.Lexer.prototype.nextToken = function() {
  var c = this.nextChar_();
  var token = {position: this.index_, value: c};

  if (c == '(') {
    token.type = _ol_format_WKT_.TokenType_.LEFT_PAREN;
  } else if (c == ',') {
    token.type = _ol_format_WKT_.TokenType_.COMMA;
  } else if (c == ')') {
    token.type = _ol_format_WKT_.TokenType_.RIGHT_PAREN;
  } else if (this.isNumeric_(c) || c == '-') {
    token.type = _ol_format_WKT_.TokenType_.NUMBER;
    token.value = this.readNumber_();
  } else if (this.isAlpha_(c)) {
    token.type = _ol_format_WKT_.TokenType_.TEXT;
    token.value = this.readText_();
  } else if (this.isWhiteSpace_(c)) {
    return this.nextToken();
  } else if (c === '') {
    token.type = _ol_format_WKT_.TokenType_.EOF;
  } else {
    throw new Error('Unexpected character: ' + c);
  }

  return token;
};


/**
 * @return {number} Numeric token value.
 * @private
 */
_ol_format_WKT_.Lexer.prototype.readNumber_ = function() {
  var c, index = this.index_;
  var decimal = false;
  var scientificNotation = false;
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
_ol_format_WKT_.Lexer.prototype.readText_ = function() {
  var c, index = this.index_;
  do {
    c = this.nextChar_();
  } while (this.isAlpha_(c));
  return this.wkt.substring(index, this.index_--).toUpperCase();
};


/**
 * Class to parse the tokens from the WKT string.
 * @param {ol.format.WKT.Lexer} lexer The lexer.
 * @constructor
 * @protected
 */
_ol_format_WKT_.Parser = function(lexer) {

  /**
   * @type {ol.format.WKT.Lexer}
   * @private
   */
  this.lexer_ = lexer;

  /**
   * @type {ol.WKTToken}
   * @private
   */
  this.token_;

  /**
   * @type {ol.geom.GeometryLayout}
   * @private
   */
  this.layout_ = _ol_geom_GeometryLayout_.XY;
};


/**
 * Fetch the next token form the lexer and replace the active token.
 * @private
 */
_ol_format_WKT_.Parser.prototype.consume_ = function() {
  this.token_ = this.lexer_.nextToken();
};

/**
 * Tests if the given type matches the type of the current token.
 * @param {ol.format.WKT.TokenType_} type Token type.
 * @return {boolean} Whether the token matches the given type.
 */
_ol_format_WKT_.Parser.prototype.isTokenType = function(type) {
  var isMatch = this.token_.type == type;
  return isMatch;
};


/**
 * If the given type matches the current token, consume it.
 * @param {ol.format.WKT.TokenType_} type Token type.
 * @return {boolean} Whether the token matches the given type.
 */
_ol_format_WKT_.Parser.prototype.match = function(type) {
  var isMatch = this.isTokenType(type);
  if (isMatch) {
    this.consume_();
  }
  return isMatch;
};


/**
 * Try to parse the tokens provided by the lexer.
 * @return {ol.geom.Geometry} The geometry.
 */
_ol_format_WKT_.Parser.prototype.parse = function() {
  this.consume_();
  var geometry = this.parseGeometry_();
  return geometry;
};


/**
 * Try to parse the dimensional info.
 * @return {ol.geom.GeometryLayout} The layout.
 * @private
 */
_ol_format_WKT_.Parser.prototype.parseGeometryLayout_ = function() {
  var layout = _ol_geom_GeometryLayout_.XY;
  var dimToken = this.token_;
  if (this.isTokenType(_ol_format_WKT_.TokenType_.TEXT)) {
    var dimInfo = dimToken.value;
    if (dimInfo === _ol_format_WKT_.Z) {
      layout = _ol_geom_GeometryLayout_.XYZ;
    } else if (dimInfo === _ol_format_WKT_.M) {
      layout = _ol_geom_GeometryLayout_.XYM;
    } else if (dimInfo === _ol_format_WKT_.ZM) {
      layout = _ol_geom_GeometryLayout_.XYZM;
    }
    if (layout !== _ol_geom_GeometryLayout_.XY) {
      this.consume_();
    }
  }
  return layout;
};


/**
 * @return {!ol.geom.Geometry} The geometry.
 * @private
 */
_ol_format_WKT_.Parser.prototype.parseGeometry_ = function() {
  var token = this.token_;
  if (this.match(_ol_format_WKT_.TokenType_.TEXT)) {
    var geomType = token.value;
    this.layout_ = this.parseGeometryLayout_();
    if (geomType == _ol_geom_GeometryType_.GEOMETRY_COLLECTION.toUpperCase()) {
      var geometries = this.parseGeometryCollectionText_();
      return new _ol_geom_GeometryCollection_(geometries);
    } else {
      var parser = _ol_format_WKT_.Parser.GeometryParser_[geomType];
      var ctor = _ol_format_WKT_.Parser.GeometryConstructor_[geomType];
      if (!parser || !ctor) {
        throw new Error('Invalid geometry type: ' + geomType);
      }
      var coordinates = parser.call(this);
      return new ctor(coordinates, this.layout_);
    }
  }
  throw new Error(this.formatErrorMessage_());
};


/**
 * @return {!Array.<ol.geom.Geometry>} A collection of geometries.
 * @private
 */
_ol_format_WKT_.Parser.prototype.parseGeometryCollectionText_ = function() {
  if (this.match(_ol_format_WKT_.TokenType_.LEFT_PAREN)) {
    var geometries = [];
    do {
      geometries.push(this.parseGeometry_());
    } while (this.match(_ol_format_WKT_.TokenType_.COMMA));
    if (this.match(_ol_format_WKT_.TokenType_.RIGHT_PAREN)) {
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
_ol_format_WKT_.Parser.prototype.parsePointText_ = function() {
  if (this.match(_ol_format_WKT_.TokenType_.LEFT_PAREN)) {
    var coordinates = this.parsePoint_();
    if (this.match(_ol_format_WKT_.TokenType_.RIGHT_PAREN)) {
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
_ol_format_WKT_.Parser.prototype.parseLineStringText_ = function() {
  if (this.match(_ol_format_WKT_.TokenType_.LEFT_PAREN)) {
    var coordinates = this.parsePointList_();
    if (this.match(_ol_format_WKT_.TokenType_.RIGHT_PAREN)) {
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
_ol_format_WKT_.Parser.prototype.parsePolygonText_ = function() {
  if (this.match(_ol_format_WKT_.TokenType_.LEFT_PAREN)) {
    var coordinates = this.parseLineStringTextList_();
    if (this.match(_ol_format_WKT_.TokenType_.RIGHT_PAREN)) {
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
_ol_format_WKT_.Parser.prototype.parseMultiPointText_ = function() {
  if (this.match(_ol_format_WKT_.TokenType_.LEFT_PAREN)) {
    var coordinates;
    if (this.token_.type == _ol_format_WKT_.TokenType_.LEFT_PAREN) {
      coordinates = this.parsePointTextList_();
    } else {
      coordinates = this.parsePointList_();
    }
    if (this.match(_ol_format_WKT_.TokenType_.RIGHT_PAREN)) {
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
_ol_format_WKT_.Parser.prototype.parseMultiLineStringText_ = function() {
  if (this.match(_ol_format_WKT_.TokenType_.LEFT_PAREN)) {
    var coordinates = this.parseLineStringTextList_();
    if (this.match(_ol_format_WKT_.TokenType_.RIGHT_PAREN)) {
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
_ol_format_WKT_.Parser.prototype.parseMultiPolygonText_ = function() {
  if (this.match(_ol_format_WKT_.TokenType_.LEFT_PAREN)) {
    var coordinates = this.parsePolygonTextList_();
    if (this.match(_ol_format_WKT_.TokenType_.RIGHT_PAREN)) {
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
_ol_format_WKT_.Parser.prototype.parsePoint_ = function() {
  var coordinates = [];
  var dimensions = this.layout_.length;
  for (var i = 0; i < dimensions; ++i) {
    var token = this.token_;
    if (this.match(_ol_format_WKT_.TokenType_.NUMBER)) {
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
_ol_format_WKT_.Parser.prototype.parsePointList_ = function() {
  var coordinates = [this.parsePoint_()];
  while (this.match(_ol_format_WKT_.TokenType_.COMMA)) {
    coordinates.push(this.parsePoint_());
  }
  return coordinates;
};


/**
 * @return {!Array.<!Array.<number>>} An array of points.
 * @private
 */
_ol_format_WKT_.Parser.prototype.parsePointTextList_ = function() {
  var coordinates = [this.parsePointText_()];
  while (this.match(_ol_format_WKT_.TokenType_.COMMA)) {
    coordinates.push(this.parsePointText_());
  }
  return coordinates;
};


/**
 * @return {!Array.<!Array.<number>>} An array of points.
 * @private
 */
_ol_format_WKT_.Parser.prototype.parseLineStringTextList_ = function() {
  var coordinates = [this.parseLineStringText_()];
  while (this.match(_ol_format_WKT_.TokenType_.COMMA)) {
    coordinates.push(this.parseLineStringText_());
  }
  return coordinates;
};


/**
 * @return {!Array.<!Array.<number>>} An array of points.
 * @private
 */
_ol_format_WKT_.Parser.prototype.parsePolygonTextList_ = function() {
  var coordinates = [this.parsePolygonText_()];
  while (this.match(_ol_format_WKT_.TokenType_.COMMA)) {
    coordinates.push(this.parsePolygonText_());
  }
  return coordinates;
};


/**
 * @return {boolean} Whether the token implies an empty geometry.
 * @private
 */
_ol_format_WKT_.Parser.prototype.isEmptyGeometry_ = function() {
  var isEmpty = this.isTokenType(_ol_format_WKT_.TokenType_.TEXT) &&
      this.token_.value == _ol_format_WKT_.EMPTY;
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
_ol_format_WKT_.Parser.prototype.formatErrorMessage_ = function() {
  return 'Unexpected `' + this.token_.value + '` at position ' +
      this.token_.position + ' in `' + this.lexer_.wkt + '`';
};


/**
 * @enum {function (new:ol.geom.Geometry, Array, ol.geom.GeometryLayout)}
 * @private
 */
_ol_format_WKT_.Parser.GeometryConstructor_ = {
  'POINT': _ol_geom_Point_,
  'LINESTRING': _ol_geom_LineString_,
  'POLYGON': _ol_geom_Polygon_,
  'MULTIPOINT': _ol_geom_MultiPoint_,
  'MULTILINESTRING': _ol_geom_MultiLineString_,
  'MULTIPOLYGON': _ol_geom_MultiPolygon_
};


/**
 * @enum {(function(): Array)}
 * @private
 */
_ol_format_WKT_.Parser.GeometryParser_ = {
  'POINT': _ol_format_WKT_.Parser.prototype.parsePointText_,
  'LINESTRING': _ol_format_WKT_.Parser.prototype.parseLineStringText_,
  'POLYGON': _ol_format_WKT_.Parser.prototype.parsePolygonText_,
  'MULTIPOINT': _ol_format_WKT_.Parser.prototype.parseMultiPointText_,
  'MULTILINESTRING': _ol_format_WKT_.Parser.prototype.parseMultiLineStringText_,
  'MULTIPOLYGON': _ol_format_WKT_.Parser.prototype.parseMultiPolygonText_
};
export default _ol_format_WKT_;
