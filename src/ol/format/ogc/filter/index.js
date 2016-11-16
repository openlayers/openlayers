goog.provide('ol.format.ogc.filter');

goog.require('ol');
goog.require('ol.format.ogc.filter.And');
goog.require('ol.format.ogc.filter.Bbox');
goog.require('ol.format.ogc.filter.EqualTo');
goog.require('ol.format.ogc.filter.GreaterThan');
goog.require('ol.format.ogc.filter.GreaterThanOrEqualTo');
goog.require('ol.format.ogc.filter.Intersects');
goog.require('ol.format.ogc.filter.IsBetween');
goog.require('ol.format.ogc.filter.IsLike');
goog.require('ol.format.ogc.filter.IsNull');
goog.require('ol.format.ogc.filter.LessThan');
goog.require('ol.format.ogc.filter.LessThanOrEqualTo');
goog.require('ol.format.ogc.filter.Not');
goog.require('ol.format.ogc.filter.NotEqualTo');
goog.require('ol.format.ogc.filter.Or');
goog.require('ol.format.ogc.filter.Within');


/**
 * Create a logical `<And>` operator between two filter conditions.
 *
 * @param {!ol.format.ogc.filter.Filter} conditionA First filter condition.
 * @param {!ol.format.ogc.filter.Filter} conditionB Second filter condition.
 * @returns {!ol.format.ogc.filter.And} `<And>` operator.
 * @api
 */
ol.format.ogc.filter.and = function(conditionA, conditionB) {
  return new ol.format.ogc.filter.And(conditionA, conditionB);
};


/**
 * Create a logical `<Or>` operator between two filter conditions.
 *
 * @param {!ol.format.ogc.filter.Filter} conditionA First filter condition.
 * @param {!ol.format.ogc.filter.Filter} conditionB Second filter condition.
 * @returns {!ol.format.ogc.filter.Or} `<Or>` operator.
 * @api
 */
ol.format.ogc.filter.or = function(conditionA, conditionB) {
  return new ol.format.ogc.filter.Or(conditionA, conditionB);
};


/**
 * Represents a logical `<Not>` operator for a filter condition.
 *
 * @param {!ol.format.ogc.filter.Filter} condition Filter condition.
 * @returns {!ol.format.ogc.filter.Not} `<Not>` operator.
 * @api
 */
ol.format.ogc.filter.not = function(condition) {
  return new ol.format.ogc.filter.Not(condition);
};


/**
 * Create a `<BBOX>` operator to test whether a geometry-valued property
 * intersects a fixed bounding box
 *
 * @param {!string} geometryName Geometry name to use.
 * @param {!ol.Extent} extent Extent.
 * @param {string=} opt_srsName SRS name. No srsName attribute will be
 *    set on geometries when this is not provided.
 * @returns {!ol.format.ogc.filter.Bbox} `<BBOX>` operator.
 * @api
 */
ol.format.ogc.filter.bbox = function(geometryName, extent, opt_srsName) {
  return new ol.format.ogc.filter.Bbox(geometryName, extent, opt_srsName);
};

/**
 * Create a `<Intersects>` operator to test whether a geometry-valued property
 * intersects a given geometry.
 *
 * @param {!string} geometryName Geometry name to use.
 * @param {!ol.geom.Geometry} geometry Geometry.
 * @param {string=} opt_srsName SRS name. No srsName attribute will be
 *    set on geometries when this is not provided.
 * @returns {!ol.format.ogc.filter.Intersects} `<Intersects>` operator.
 * @api
 */
ol.format.ogc.filter.intersects = function(geometryName, geometry, opt_srsName) {
  return new ol.format.ogc.filter.Intersects(geometryName, geometry, opt_srsName);
};

/**
 * Create a `<Within>` operator to test whether a geometry-valued property
 * is within a given geometry.
 *
 * @param {!string} geometryName Geometry name to use.
 * @param {!ol.geom.Geometry} geometry Geometry.
 * @param {string=} opt_srsName SRS name. No srsName attribute will be
 *    set on geometries when this is not provided.
 * @returns {!ol.format.ogc.filter.Within} `<Within>` operator.
 * @api
 */
ol.format.ogc.filter.within = function(geometryName, geometry, opt_srsName) {
  return new ol.format.ogc.filter.Within(geometryName, geometry, opt_srsName);
};


/**
 * Creates a `<PropertyIsEqualTo>` comparison operator.
 *
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!(string|number)} expression The value to compare.
 * @param {boolean=} opt_matchCase Case-sensitive?
 * @returns {!ol.format.ogc.filter.EqualTo} `<PropertyIsEqualTo>` operator.
 * @api
 */
ol.format.ogc.filter.equalTo = function(propertyName, expression, opt_matchCase) {
  return new ol.format.ogc.filter.EqualTo(propertyName, expression, opt_matchCase);
};


/**
 * Creates a `<PropertyIsNotEqualTo>` comparison operator.
 *
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!(string|number)} expression The value to compare.
 * @param {boolean=} opt_matchCase Case-sensitive?
 * @returns {!ol.format.ogc.filter.NotEqualTo} `<PropertyIsNotEqualTo>` operator.
 * @api
 */
ol.format.ogc.filter.notEqualTo = function(propertyName, expression, opt_matchCase) {
  return new ol.format.ogc.filter.NotEqualTo(propertyName, expression, opt_matchCase);
};


/**
 * Creates a `<PropertyIsLessThan>` comparison operator.
 *
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} expression The value to compare.
 * @returns {!ol.format.ogc.filter.LessThan} `<PropertyIsLessThan>` operator.
 * @api
 */
ol.format.ogc.filter.lessThan = function(propertyName, expression) {
  return new ol.format.ogc.filter.LessThan(propertyName, expression);
};


/**
 * Creates a `<PropertyIsLessThanOrEqualTo>` comparison operator.
 *
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} expression The value to compare.
 * @returns {!ol.format.ogc.filter.LessThanOrEqualTo} `<PropertyIsLessThanOrEqualTo>` operator.
 * @api
 */
ol.format.ogc.filter.lessThanOrEqualTo = function(propertyName, expression) {
  return new ol.format.ogc.filter.LessThanOrEqualTo(propertyName, expression);
};


/**
 * Creates a `<PropertyIsGreaterThan>` comparison operator.
 *
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} expression The value to compare.
 * @returns {!ol.format.ogc.filter.GreaterThan} `<PropertyIsGreaterThan>` operator.
 * @api
 */
ol.format.ogc.filter.greaterThan = function(propertyName, expression) {
  return new ol.format.ogc.filter.GreaterThan(propertyName, expression);
};


/**
 * Creates a `<PropertyIsGreaterThanOrEqualTo>` comparison operator.
 *
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} expression The value to compare.
 * @returns {!ol.format.ogc.filter.GreaterThanOrEqualTo} `<PropertyIsGreaterThanOrEqualTo>` operator.
 * @api
 */
ol.format.ogc.filter.greaterThanOrEqualTo = function(propertyName, expression) {
  return new ol.format.ogc.filter.GreaterThanOrEqualTo(propertyName, expression);
};


/**
 * Creates a `<PropertyIsNull>` comparison operator to test whether a property value
 * is null.
 *
 * @param {!string} propertyName Name of the context property to compare.
 * @returns {!ol.format.ogc.filter.IsNull} `<PropertyIsNull>` operator.
 * @api
 */
ol.format.ogc.filter.isNull = function(propertyName) {
  return new ol.format.ogc.filter.IsNull(propertyName);
};


/**
 * Creates a `<PropertyIsBetween>` comparison operator to test whether an expression
 * value lies within a range given by a lower and upper bound (inclusive).
 *
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} lowerBoundary The lower bound of the range.
 * @param {!number} upperBoundary The upper bound of the range.
 * @returns {!ol.format.ogc.filter.IsBetween} `<PropertyIsBetween>` operator.
 * @api
 */
ol.format.ogc.filter.between = function(propertyName, lowerBoundary, upperBoundary) {
  return new ol.format.ogc.filter.IsBetween(propertyName, lowerBoundary, upperBoundary);
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
 * @returns {!ol.format.ogc.filter.IsLike} `<PropertyIsLike>` operator.
 * @api
 */
ol.format.ogc.filter.like = function(propertyName, pattern,
    opt_wildCard, opt_singleChar, opt_escapeChar, opt_matchCase) {
  return new ol.format.ogc.filter.IsLike(propertyName, pattern,
    opt_wildCard, opt_singleChar, opt_escapeChar, opt_matchCase);
};
