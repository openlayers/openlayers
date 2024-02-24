/**
 * @module ol/format/filter
 */
import And from './filter/And.js';
import Bbox from './filter/Bbox.js';
import Contains from './filter/Contains.js';
import DWithin from './filter/DWithin.js';
import Disjoint from './filter/Disjoint.js';
import During from './filter/During.js';
import EqualTo from './filter/EqualTo.js';
import GreaterThan from './filter/GreaterThan.js';
import GreaterThanOrEqualTo from './filter/GreaterThanOrEqualTo.js';
import Intersects from './filter/Intersects.js';
import IsBetween from './filter/IsBetween.js';
import IsLike from './filter/IsLike.js';
import IsNull from './filter/IsNull.js';
import LessThan from './filter/LessThan.js';
import LessThanOrEqualTo from './filter/LessThanOrEqualTo.js';
import Not from './filter/Not.js';
import NotEqualTo from './filter/NotEqualTo.js';
import Or from './filter/Or.js';
import ResourceId from './filter/ResourceId.js';
import Within from './filter/Within.js';

/**
 * Create a logical `<And>` operator between two or more filter conditions.
 *
 * @param {...import("./filter/Filter.js").default} conditions Filter conditions.
 * @return {!And} `<And>` operator.
 * @api
 */
export function and(conditions) {
  const params = [null].concat(Array.prototype.slice.call(arguments));
  return new (Function.prototype.bind.apply(And, params))();
}

/**
 * Create a logical `<Or>` operator between two or more filter conditions.
 *
 * @param {...import("./filter/Filter.js").default} conditions Filter conditions.
 * @return {!Or} `<Or>` operator.
 * @api
 */
export function or(conditions) {
  const params = [null].concat(Array.prototype.slice.call(arguments));
  return new (Function.prototype.bind.apply(Or, params))();
}

/**
 * Represents a logical `<Not>` operator for a filter condition.
 *
 * @param {!import("./filter/Filter.js").default} condition Filter condition.
 * @return {!Not} `<Not>` operator.
 * @api
 */
export function not(condition) {
  return new Not(condition);
}

/**
 * Create a `<BBOX>` operator to test whether a geometry-valued property
 * intersects a fixed bounding box
 *
 * @param {!string} geometryName Geometry name to use.
 * @param {!import("../extent.js").Extent} extent Extent.
 * @param {string} [srsName] SRS name. No srsName attribute will be
 *    set on geometries when this is not provided.
 * @return {!Bbox} `<BBOX>` operator.
 * @api
 */
export function bbox(geometryName, extent, srsName) {
  return new Bbox(geometryName, extent, srsName);
}

/**
 * Create a `<Contains>` operator to test whether a geometry-valued property
 * contains a given geometry.
 *
 * @param {!string} geometryName Geometry name to use.
 * @param {!import("../geom/Geometry.js").default} geometry Geometry.
 * @param {string} [srsName] SRS name. No srsName attribute will be
 *    set on geometries when this is not provided.
 * @return {!Contains} `<Contains>` operator.
 * @api
 */
export function contains(geometryName, geometry, srsName) {
  return new Contains(geometryName, geometry, srsName);
}

/**
 * Create a `<Intersects>` operator to test whether a geometry-valued property
 * intersects a given geometry.
 *
 * @param {!string} geometryName Geometry name to use.
 * @param {!import("../geom/Geometry.js").default} geometry Geometry.
 * @param {string} [srsName] SRS name. No srsName attribute will be
 *    set on geometries when this is not provided.
 * @return {!Intersects} `<Intersects>` operator.
 * @api
 */
export function intersects(geometryName, geometry, srsName) {
  return new Intersects(geometryName, geometry, srsName);
}

/**
 * Create a `<Disjoint>` operator to test whether a geometry-valued property
 * is disjoint to a given geometry.
 *
 * @param {!string} geometryName Geometry name to use.
 * @param {!import("../geom/Geometry.js").default} geometry Geometry.
 * @param {string} [srsName] SRS name. No srsName attribute will be
 *    set on geometries when this is not provided.
 * @return {!Disjoint} `<Disjoint>` operator.
 * @api
 */
export function disjoint(geometryName, geometry, srsName) {
  return new Disjoint(geometryName, geometry, srsName);
}

/**
 * Create a `<Within>` operator to test whether a geometry-valued property
 * is within a given geometry.
 *
 * @param {!string} geometryName Geometry name to use.
 * @param {!import("../geom/Geometry.js").default} geometry Geometry.
 * @param {string} [srsName] SRS name. No srsName attribute will be
 *    set on geometries when this is not provided.
 * @return {!Within} `<Within>` operator.
 * @api
 */
export function within(geometryName, geometry, srsName) {
  return new Within(geometryName, geometry, srsName);
}

/**
 * Create a `<DWithin>` operator to test whether a geometry-valued property
 * is within a distance to a given geometry.
 *
 * @param {!string} geometryName Geometry name to use.
 * @param {!import("../geom/Geometry.js").default} geometry Geometry.
 * @param {!number} distance Distance.
 * @param {!string} unit Unit.
 * @param {string} [srsName] SRS name. No srsName attribute will be
 *    set on geometries when this is not provided.
 * @return {!DWithin} `<DWithin>` operator.
 * @api
 */
export function dwithin(geometryName, geometry, distance, unit, srsName) {
  return new DWithin(geometryName, geometry, distance, unit, srsName);
}

/**
 * Creates a `<PropertyIsEqualTo>` comparison operator.
 *
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!(string|number)} expression The value to compare.
 * @param {boolean} [matchCase] Case-sensitive?
 * @return {!EqualTo} `<PropertyIsEqualTo>` operator.
 * @api
 */
export function equalTo(propertyName, expression, matchCase) {
  return new EqualTo(propertyName, expression, matchCase);
}

/**
 * Creates a `<PropertyIsNotEqualTo>` comparison operator.
 *
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!(string|number)} expression The value to compare.
 * @param {boolean} [matchCase] Case-sensitive?
 * @return {!NotEqualTo} `<PropertyIsNotEqualTo>` operator.
 * @api
 */
export function notEqualTo(propertyName, expression, matchCase) {
  return new NotEqualTo(propertyName, expression, matchCase);
}

/**
 * Creates a `<PropertyIsLessThan>` comparison operator.
 *
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} expression The value to compare.
 * @return {!LessThan} `<PropertyIsLessThan>` operator.
 * @api
 */
export function lessThan(propertyName, expression) {
  return new LessThan(propertyName, expression);
}

/**
 * Creates a `<PropertyIsLessThanOrEqualTo>` comparison operator.
 *
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} expression The value to compare.
 * @return {!LessThanOrEqualTo} `<PropertyIsLessThanOrEqualTo>` operator.
 * @api
 */
export function lessThanOrEqualTo(propertyName, expression) {
  return new LessThanOrEqualTo(propertyName, expression);
}

/**
 * Creates a `<PropertyIsGreaterThan>` comparison operator.
 *
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} expression The value to compare.
 * @return {!GreaterThan} `<PropertyIsGreaterThan>` operator.
 * @api
 */
export function greaterThan(propertyName, expression) {
  return new GreaterThan(propertyName, expression);
}

/**
 * Creates a `<PropertyIsGreaterThanOrEqualTo>` comparison operator.
 *
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} expression The value to compare.
 * @return {!GreaterThanOrEqualTo} `<PropertyIsGreaterThanOrEqualTo>` operator.
 * @api
 */
export function greaterThanOrEqualTo(propertyName, expression) {
  return new GreaterThanOrEqualTo(propertyName, expression);
}

/**
 * Creates a `<PropertyIsNull>` comparison operator to test whether a property value
 * is null.
 *
 * @param {!string} propertyName Name of the context property to compare.
 * @return {!IsNull} `<PropertyIsNull>` operator.
 * @api
 */
export function isNull(propertyName) {
  return new IsNull(propertyName);
}

/**
 * Creates a `<PropertyIsBetween>` comparison operator to test whether an expression
 * value lies within a range given by a lower and upper bound (inclusive).
 *
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} lowerBoundary The lower bound of the range.
 * @param {!number} upperBoundary The upper bound of the range.
 * @return {!IsBetween} `<PropertyIsBetween>` operator.
 * @api
 */
export function between(propertyName, lowerBoundary, upperBoundary) {
  return new IsBetween(propertyName, lowerBoundary, upperBoundary);
}

/**
 * Represents a `<PropertyIsLike>` comparison operator that matches a string property
 * value against a text pattern.
 *
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!string} pattern Text pattern.
 * @param {string} [wildCard] Pattern character which matches any sequence of
 *    zero or more string characters. Default is '*'.
 * @param {string} [singleChar] pattern character which matches any single
 *    string character. Default is '.'.
 * @param {string} [escapeChar] Escape character which can be used to escape
 *    the pattern characters. Default is '!'.
 * @param {boolean} [matchCase] Case-sensitive?
 * @return {!IsLike} `<PropertyIsLike>` operator.
 * @api
 */
export function like(
  propertyName,
  pattern,
  wildCard,
  singleChar,
  escapeChar,
  matchCase,
) {
  return new IsLike(
    propertyName,
    pattern,
    wildCard,
    singleChar,
    escapeChar,
    matchCase,
  );
}

/**
 * Create a `<During>` temporal operator.
 *
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!string} begin The begin date in ISO-8601 format.
 * @param {!string} end The end date in ISO-8601 format.
 * @return {!During} `<During>` operator.
 * @api
 */
export function during(propertyName, begin, end) {
  return new During(propertyName, begin, end);
}

export function resourceId(rid) {
  return new ResourceId(rid);
}
