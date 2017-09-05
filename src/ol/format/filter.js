import _ol_format_filter_And_ from '../format/filter/and';
import _ol_format_filter_Bbox_ from '../format/filter/bbox';
import _ol_format_filter_During_ from '../format/filter/during';
import _ol_format_filter_EqualTo_ from '../format/filter/equalto';
import _ol_format_filter_GreaterThan_ from '../format/filter/greaterthan';
import _ol_format_filter_GreaterThanOrEqualTo_ from '../format/filter/greaterthanorequalto';
import _ol_format_filter_Intersects_ from '../format/filter/intersects';
import _ol_format_filter_IsBetween_ from '../format/filter/isbetween';
import _ol_format_filter_IsLike_ from '../format/filter/islike';
import _ol_format_filter_IsNull_ from '../format/filter/isnull';
import _ol_format_filter_LessThan_ from '../format/filter/lessthan';
import _ol_format_filter_LessThanOrEqualTo_ from '../format/filter/lessthanorequalto';
import _ol_format_filter_Not_ from '../format/filter/not';
import _ol_format_filter_NotEqualTo_ from '../format/filter/notequalto';
import _ol_format_filter_Or_ from '../format/filter/or';
import _ol_format_filter_Within_ from '../format/filter/within';
var _ol_format_filter_ = {};


/**
 * Create a logical `<And>` operator between two or more filter conditions.
 *
 * @param {...ol.format.filter.Filter} conditions Filter conditions.
 * @returns {!ol.format.filter.And} `<And>` operator.
 * @api
 */
_ol_format_filter_.and = function(conditions) {
  var params = [null].concat(Array.prototype.slice.call(arguments));
  return new (Function.prototype.bind.apply(_ol_format_filter_And_, params));
};


/**
 * Create a logical `<Or>` operator between two or more filter conditions.
 *
 * @param {...ol.format.filter.Filter} conditions Filter conditions.
 * @returns {!ol.format.filter.Or} `<Or>` operator.
 * @api
 */
_ol_format_filter_.or = function(conditions) {
  var params = [null].concat(Array.prototype.slice.call(arguments));
  return new (Function.prototype.bind.apply(_ol_format_filter_Or_, params));
};


/**
 * Represents a logical `<Not>` operator for a filter condition.
 *
 * @param {!ol.format.filter.Filter} condition Filter condition.
 * @returns {!ol.format.filter.Not} `<Not>` operator.
 * @api
 */
_ol_format_filter_.not = function(condition) {
  return new _ol_format_filter_Not_(condition);
};


/**
 * Create a `<BBOX>` operator to test whether a geometry-valued property
 * intersects a fixed bounding box
 *
 * @param {!string} geometryName Geometry name to use.
 * @param {!ol.Extent} extent Extent.
 * @param {string=} opt_srsName SRS name. No srsName attribute will be
 *    set on geometries when this is not provided.
 * @returns {!ol.format.filter.Bbox} `<BBOX>` operator.
 * @api
 */
_ol_format_filter_.bbox = function(geometryName, extent, opt_srsName) {
  return new _ol_format_filter_Bbox_(geometryName, extent, opt_srsName);
};

/**
 * Create a `<Intersects>` operator to test whether a geometry-valued property
 * intersects a given geometry.
 *
 * @param {!string} geometryName Geometry name to use.
 * @param {!ol.geom.Geometry} geometry Geometry.
 * @param {string=} opt_srsName SRS name. No srsName attribute will be
 *    set on geometries when this is not provided.
 * @returns {!ol.format.filter.Intersects} `<Intersects>` operator.
 * @api
 */
_ol_format_filter_.intersects = function(geometryName, geometry, opt_srsName) {
  return new _ol_format_filter_Intersects_(geometryName, geometry, opt_srsName);
};

/**
 * Create a `<Within>` operator to test whether a geometry-valued property
 * is within a given geometry.
 *
 * @param {!string} geometryName Geometry name to use.
 * @param {!ol.geom.Geometry} geometry Geometry.
 * @param {string=} opt_srsName SRS name. No srsName attribute will be
 *    set on geometries when this is not provided.
 * @returns {!ol.format.filter.Within} `<Within>` operator.
 * @api
 */
_ol_format_filter_.within = function(geometryName, geometry, opt_srsName) {
  return new _ol_format_filter_Within_(geometryName, geometry, opt_srsName);
};


/**
 * Creates a `<PropertyIsEqualTo>` comparison operator.
 *
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!(string|number)} expression The value to compare.
 * @param {boolean=} opt_matchCase Case-sensitive?
 * @returns {!ol.format.filter.EqualTo} `<PropertyIsEqualTo>` operator.
 * @api
 */
_ol_format_filter_.equalTo = function(propertyName, expression, opt_matchCase) {
  return new _ol_format_filter_EqualTo_(propertyName, expression, opt_matchCase);
};


/**
 * Creates a `<PropertyIsNotEqualTo>` comparison operator.
 *
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!(string|number)} expression The value to compare.
 * @param {boolean=} opt_matchCase Case-sensitive?
 * @returns {!ol.format.filter.NotEqualTo} `<PropertyIsNotEqualTo>` operator.
 * @api
 */
_ol_format_filter_.notEqualTo = function(propertyName, expression, opt_matchCase) {
  return new _ol_format_filter_NotEqualTo_(propertyName, expression, opt_matchCase);
};


/**
 * Creates a `<PropertyIsLessThan>` comparison operator.
 *
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} expression The value to compare.
 * @returns {!ol.format.filter.LessThan} `<PropertyIsLessThan>` operator.
 * @api
 */
_ol_format_filter_.lessThan = function(propertyName, expression) {
  return new _ol_format_filter_LessThan_(propertyName, expression);
};


/**
 * Creates a `<PropertyIsLessThanOrEqualTo>` comparison operator.
 *
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} expression The value to compare.
 * @returns {!ol.format.filter.LessThanOrEqualTo} `<PropertyIsLessThanOrEqualTo>` operator.
 * @api
 */
_ol_format_filter_.lessThanOrEqualTo = function(propertyName, expression) {
  return new _ol_format_filter_LessThanOrEqualTo_(propertyName, expression);
};


/**
 * Creates a `<PropertyIsGreaterThan>` comparison operator.
 *
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} expression The value to compare.
 * @returns {!ol.format.filter.GreaterThan} `<PropertyIsGreaterThan>` operator.
 * @api
 */
_ol_format_filter_.greaterThan = function(propertyName, expression) {
  return new _ol_format_filter_GreaterThan_(propertyName, expression);
};


/**
 * Creates a `<PropertyIsGreaterThanOrEqualTo>` comparison operator.
 *
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} expression The value to compare.
 * @returns {!ol.format.filter.GreaterThanOrEqualTo} `<PropertyIsGreaterThanOrEqualTo>` operator.
 * @api
 */
_ol_format_filter_.greaterThanOrEqualTo = function(propertyName, expression) {
  return new _ol_format_filter_GreaterThanOrEqualTo_(propertyName, expression);
};


/**
 * Creates a `<PropertyIsNull>` comparison operator to test whether a property value
 * is null.
 *
 * @param {!string} propertyName Name of the context property to compare.
 * @returns {!ol.format.filter.IsNull} `<PropertyIsNull>` operator.
 * @api
 */
_ol_format_filter_.isNull = function(propertyName) {
  return new _ol_format_filter_IsNull_(propertyName);
};


/**
 * Creates a `<PropertyIsBetween>` comparison operator to test whether an expression
 * value lies within a range given by a lower and upper bound (inclusive).
 *
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} lowerBoundary The lower bound of the range.
 * @param {!number} upperBoundary The upper bound of the range.
 * @returns {!ol.format.filter.IsBetween} `<PropertyIsBetween>` operator.
 * @api
 */
_ol_format_filter_.between = function(propertyName, lowerBoundary, upperBoundary) {
  return new _ol_format_filter_IsBetween_(propertyName, lowerBoundary, upperBoundary);
};


/**
 * Represents a `<PropertyIsLike>` comparison operator that matches a string property
 * value against a text pattern.
 *
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!string} pattern Text pattern.
 * @param {string=} opt_wildCard Pattern character which matches any sequence of
 *    zero or more string characters. Default is '*'.
 * @param {string=} opt_singleChar pattern character which matches any single
 *    string character. Default is '.'.
 * @param {string=} opt_escapeChar Escape character which can be used to escape
 *    the pattern characters. Default is '!'.
 * @param {boolean=} opt_matchCase Case-sensitive?
 * @returns {!ol.format.filter.IsLike} `<PropertyIsLike>` operator.
 * @api
 */
_ol_format_filter_.like = function(propertyName, pattern,
    opt_wildCard, opt_singleChar, opt_escapeChar, opt_matchCase) {
  return new _ol_format_filter_IsLike_(propertyName, pattern,
      opt_wildCard, opt_singleChar, opt_escapeChar, opt_matchCase);
};


/**
 * Create a `<During>` temporal operator.
 *
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!string} begin The begin date in ISO-8601 format.
 * @param {!string} end The end date in ISO-8601 format.
 * @returns {!ol.format.filter.During} `<During>` operator.
 * @api
 */
_ol_format_filter_.during = function(propertyName, begin, end) {
  return new _ol_format_filter_During_(propertyName, begin, end);
};
export default _ol_format_filter_;
