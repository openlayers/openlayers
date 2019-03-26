/**
 * @module ol/format/filter
 */
import AndFilter from './filter/And.js';
import BboxFilter from './filter/Bbox.js';
import ContainsFilter from './filter/Contains.js';
import DuringFilter from './filter/During.js';
import EqualToFilter from './filter/EqualTo.js';
import GreaterThanFilter from './filter/GreaterThan.js';
import GreaterThanOrEqualToFilter from './filter/GreaterThanOrEqualTo.js';
import IntersectsFilter from './filter/Intersects.js';
import IsBetweenFilter from './filter/IsBetween.js';
import IsLikeFilter from './filter/IsLike.js';
import IsNullFilter from './filter/IsNull.js';
import LessThanFilter from './filter/LessThan.js';
import LessThanOrEqualToFilter from './filter/LessThanOrEqualTo.js';
import NotFilter from './filter/Not.js';
import NotEqualToFilter from './filter/NotEqualTo.js';
import OrFilter from './filter/Or.js';
import WithinFilter from './filter/Within.js';


/**
 * Create a logical `<And>` operator between two or more filter conditions.
 *
 * @param {...import("./filter/Filter.js").default} conditions Filter conditions.
 * @returns {!AndFilter} `<And>` operator.
 * @api
 */
export function and(conditions) {
  const params = [null].concat(Array.prototype.slice.call(arguments));
  return new (Function.prototype.bind.apply(AndFilter, params));
}


/**
 * Create a logical `<Or>` operator between two or more filter conditions.
 *
 * @param {...import("./filter/Filter.js").default} conditions Filter conditions.
 * @returns {!OrFilter} `<Or>` operator.
 * @api
 */
export function or(conditions) {
  const params = [null].concat(Array.prototype.slice.call(arguments));
  return new (Function.prototype.bind.apply(OrFilter, params));
}


/**
 * Represents a logical `<Not>` operator for a filter condition.
 *
 * @param {!import("./filter/Filter.js").default} condition Filter condition.
 * @returns {!NotFilter} `<Not>` operator.
 * @api
 */
export function not(condition) {
  return new NotFilter(condition);
}


/**
 * Create a `<BBOX>` operator to test whether a geometry-valued property
 * intersects a fixed bounding box
 *
 * @param {!string} geometryName Geometry name to use.
 * @param {!import("../extent.js").Extent} extent Extent.
 * @param {string=} opt_srsName SRS name. No srsName attribute will be
 *    set on geometries when this is not provided.
 * @returns {!BboxFilter} `<BBOX>` operator.
 * @api
 */
export function bbox(geometryName, extent, opt_srsName) {
  return new BboxFilter(geometryName, extent, opt_srsName);
}

/**
 * Create a `<Contains>` operator to test whether a geometry-valued property
 * contains a given geometry.
 *
 * @param {!string} geometryName Geometry name to use.
 * @param {!import("../geom/Geometry.js").default} geometry Geometry.
 * @param {string=} opt_srsName SRS name. No srsName attribute will be
 *    set on geometries when this is not provided.
 * @returns {!ContainsFilter} `<Contains>` operator.
 * @api
 */
export function contains(geometryName, geometry, opt_srsName) {
  return new ContainsFilter(geometryName, geometry, opt_srsName);
}

/**
 * Create a `<Intersects>` operator to test whether a geometry-valued property
 * intersects a given geometry.
 *
 * @param {!string} geometryName Geometry name to use.
 * @param {!import("../geom/Geometry.js").default} geometry Geometry.
 * @param {string=} opt_srsName SRS name. No srsName attribute will be
 *    set on geometries when this is not provided.
 * @returns {!IntersectsFilter} `<Intersects>` operator.
 * @api
 */
export function intersects(geometryName, geometry, opt_srsName) {
  return new IntersectsFilter(geometryName, geometry, opt_srsName);
}

/**
 * Create a `<Within>` operator to test whether a geometry-valued property
 * is within a given geometry.
 *
 * @param {!string} geometryName Geometry name to use.
 * @param {!import("../geom/Geometry.js").default} geometry Geometry.
 * @param {string=} opt_srsName SRS name. No srsName attribute will be
 *    set on geometries when this is not provided.
 * @returns {!WithinFilter} `<Within>` operator.
 * @api
 */
export function within(geometryName, geometry, opt_srsName) {
  return new WithinFilter(geometryName, geometry, opt_srsName);
}


/**
 * Creates a `<PropertyIsEqualTo>` comparison operator.
 *
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!(string|number)} expression The value to compare.
 * @param {boolean=} opt_matchCase Case-sensitive?
 * @returns {!EqualToFilter} `<PropertyIsEqualTo>` operator.
 * @api
 */
export function equalTo(propertyName, expression, opt_matchCase) {
  return new EqualToFilter(propertyName, expression, opt_matchCase);
}


/**
 * Creates a `<PropertyIsNotEqualTo>` comparison operator.
 *
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!(string|number)} expression The value to compare.
 * @param {boolean=} opt_matchCase Case-sensitive?
 * @returns {!NotEqualToFilter} `<PropertyIsNotEqualTo>` operator.
 * @api
 */
export function notEqualTo(propertyName, expression, opt_matchCase) {
  return new NotEqualToFilter(propertyName, expression, opt_matchCase);
}


/**
 * Creates a `<PropertyIsLessThan>` comparison operator.
 *
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} expression The value to compare.
 * @returns {!LessThanFilter} `<PropertyIsLessThan>` operator.
 * @api
 */
export function lessThan(propertyName, expression) {
  return new LessThanFilter(propertyName, expression);
}


/**
 * Creates a `<PropertyIsLessThanOrEqualTo>` comparison operator.
 *
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} expression The value to compare.
 * @returns {!LessThanOrEqualToFilter} `<PropertyIsLessThanOrEqualTo>` operator.
 * @api
 */
export function lessThanOrEqualTo(propertyName, expression) {
  return new LessThanOrEqualToFilter(propertyName, expression);
}


/**
 * Creates a `<PropertyIsGreaterThan>` comparison operator.
 *
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} expression The value to compare.
 * @returns {!GreaterThanFilter} `<PropertyIsGreaterThan>` operator.
 * @api
 */
export function greaterThan(propertyName, expression) {
  return new GreaterThanFilter(propertyName, expression);
}


/**
 * Creates a `<PropertyIsGreaterThanOrEqualTo>` comparison operator.
 *
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} expression The value to compare.
 * @returns {!GreaterThanOrEqualToFilter} `<PropertyIsGreaterThanOrEqualTo>` operator.
 * @api
 */
export function greaterThanOrEqualTo(propertyName, expression) {
  return new GreaterThanOrEqualToFilter(propertyName, expression);
}


/**
 * Creates a `<PropertyIsNull>` comparison operator to test whether a property value
 * is null.
 *
 * @param {!string} propertyName Name of the context property to compare.
 * @returns {!IsNullFilter} `<PropertyIsNull>` operator.
 * @api
 */
export function isNull(propertyName) {
  return new IsNullFilter(propertyName);
}


/**
 * Creates a `<PropertyIsBetween>` comparison operator to test whether an expression
 * value lies within a range given by a lower and upper bound (inclusive).
 *
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} lowerBoundary The lower bound of the range.
 * @param {!number} upperBoundary The upper bound of the range.
 * @returns {!IsBetweenFilter} `<PropertyIsBetween>` operator.
 * @api
 */
export function between(propertyName, lowerBoundary, upperBoundary) {
  return new IsBetweenFilter(propertyName, lowerBoundary, upperBoundary);
}


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
 * @returns {!IsLikeFilter} `<PropertyIsLike>` operator.
 * @api
 */
export function like(propertyName, pattern,
  opt_wildCard, opt_singleChar, opt_escapeChar, opt_matchCase) {
  return new IsLikeFilter(propertyName, pattern,
    opt_wildCard, opt_singleChar, opt_escapeChar, opt_matchCase);
}


/**
 * Create a `<During>` temporal operator.
 *
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!string} begin The begin date in ISO-8601 format.
 * @param {!string} end The end date in ISO-8601 format.
 * @returns {!DuringFilter} `<During>` operator.
 * @api
 */
export function during(propertyName, begin, end) {
  return new DuringFilter(propertyName, begin, end);
}
