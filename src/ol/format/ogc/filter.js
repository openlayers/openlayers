goog.provide('ol.format.ogc.filter');
goog.provide('ol.format.ogc.filter.Filter');
goog.provide('ol.format.ogc.filter.Logical');
goog.provide('ol.format.ogc.filter.LogicalBinary');
goog.provide('ol.format.ogc.filter.And');
goog.provide('ol.format.ogc.filter.Or');
goog.provide('ol.format.ogc.filter.Not');
goog.provide('ol.format.ogc.filter.Bbox');
goog.provide('ol.format.ogc.filter.Comparison');
goog.provide('ol.format.ogc.filter.ComparisonBinary');
goog.provide('ol.format.ogc.filter.EqualTo');
goog.provide('ol.format.ogc.filter.NotEqualTo');
goog.provide('ol.format.ogc.filter.LessThan');
goog.provide('ol.format.ogc.filter.LessThanOrEqualTo');
goog.provide('ol.format.ogc.filter.GreaterThan');
goog.provide('ol.format.ogc.filter.GreaterThanOrEqualTo');
goog.provide('ol.format.ogc.filter.IsNull');
goog.provide('ol.format.ogc.filter.IsBetween');
goog.provide('ol.format.ogc.filter.IsLike');

goog.require('ol.Extent');
goog.require('ol.Object');


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


/**
 * @classdesc
 * Abstract class; normally only used for creating subclasses and not instantiated in apps.
 * Base class for WFS GetFeature filters.
 *
 * @constructor
 * @param {!string} tagName The XML tag name for this filter.
 * @extends {ol.Object}
 * @api
 */
ol.format.ogc.filter.Filter = function(tagName) {

  goog.base(this);

  /**
   * @private
   * @type {!string}
   */
  this.tagName_ = tagName;
};
goog.inherits(ol.format.ogc.filter.Filter, ol.Object);

/**
 * The XML tag name for a filter.
 * @returns {!string} Name.
 */
ol.format.ogc.filter.Filter.prototype.getTagName = function() {
  return this.tagName_;
};


// Logical filters


/**
 * @classdesc
 * Abstract class; normally only used for creating subclasses and not instantiated in apps.
 * Base class for WFS GetFeature logical filters.
 *
 * @constructor
 * @param {!string} tagName The XML tag name for this filter.
 * @extends {ol.format.ogc.filter.Filter}
 */
ol.format.ogc.filter.Logical = function(tagName) {
  goog.base(this, tagName);
};
goog.inherits(ol.format.ogc.filter.Logical, ol.format.ogc.filter.Filter);


/**
 * @classdesc
 * Abstract class; normally only used for creating subclasses and not instantiated in apps.
 * Base class for WFS GetFeature binary logical filters.
 *
 * @constructor
 * @param {!string} tagName The XML tag name for this filter.
 * @param {!ol.format.ogc.filter.Filter} conditionA First filter condition.
 * @param {!ol.format.ogc.filter.Filter} conditionB Second filter condition.
 * @extends {ol.format.ogc.filter.Logical}
 */
ol.format.ogc.filter.LogicalBinary = function(tagName, conditionA, conditionB) {

  goog.base(this, tagName);

  /**
   * @public
   * @type {!ol.format.ogc.filter.Filter}
   */
  this.conditionA = conditionA;

  /**
   * @public
   * @type {!ol.format.ogc.filter.Filter}
   */
  this.conditionB = conditionB;

};
goog.inherits(ol.format.ogc.filter.LogicalBinary, ol.format.ogc.filter.Logical);


/**
 * @classdesc
 * Represents a logical `<And>` operator between two filter conditions.
 *
 * @constructor
 * @param {!ol.format.ogc.filter.Filter} conditionA First filter condition.
 * @param {!ol.format.ogc.filter.Filter} conditionB Second filter condition.
 * @extends {ol.format.ogc.filter.LogicalBinary}
 * @api
 */
ol.format.ogc.filter.And = function(conditionA, conditionB) {
  goog.base(this, 'And', conditionA, conditionB);
};
goog.inherits(ol.format.ogc.filter.And, ol.format.ogc.filter.LogicalBinary);


/**
 * @classdesc
 * Represents a logical `<Or>` operator between two filter conditions.
 *
 * @constructor
 * @param {!ol.format.ogc.filter.Filter} conditionA First filter condition.
 * @param {!ol.format.ogc.filter.Filter} conditionB Second filter condition.
 * @extends {ol.format.ogc.filter.LogicalBinary}
 * @api
 */
ol.format.ogc.filter.Or = function(conditionA, conditionB) {
  goog.base(this, 'Or', conditionA, conditionB);
};
goog.inherits(ol.format.ogc.filter.Or, ol.format.ogc.filter.LogicalBinary);


/**
 * @classdesc
 * Represents a logical `<Not>` operator for a filter condition.
 *
 * @constructor
 * @param {!ol.format.ogc.filter.Filter} condition Filter condition.
 * @extends {ol.format.ogc.filter.Logical}
 * @api
 */
ol.format.ogc.filter.Not = function(condition) {

  goog.base(this, 'Not');

  /**
   * @public
   * @type {!ol.format.ogc.filter.Filter}
   */
  this.condition = condition;
};
goog.inherits(ol.format.ogc.filter.Not, ol.format.ogc.filter.Logical);


// Spatial filters


/**
 * @classdesc
 * Represents a `<BBOX>` operator to test whether a geometry-valued property
 * intersects a fixed bounding box
 *
 * @constructor
 * @param {!string} geometryName Geometry name to use.
 * @param {!ol.Extent} extent Extent.
 * @param {string=} opt_srsName SRS name. No srsName attribute will be
 *    set on geometries when this is not provided.
 * @extends {ol.format.ogc.filter.Filter}
 * @api
 */
ol.format.ogc.filter.Bbox = function(geometryName, extent, opt_srsName) {

  goog.base(this, 'BBOX');

  /**
   * @public
   * @type {!string}
   */
  this.geometryName = geometryName;

  /**
   * @public
   * @type {!ol.Extent}
   */
  this.extent = extent;

  /**
   * @public
   * @type {string|undefined}
   */
  this.srsName = opt_srsName;
};
goog.inherits(ol.format.ogc.filter.Bbox, ol.format.ogc.filter.Filter);


// Property comparison filters


/**
 * @classdesc
 * Abstract class; normally only used for creating subclasses and not instantiated in apps.
 * Base class for WFS GetFeature property comparison filters.
 *
 * @constructor
 * @param {!string} tagName The XML tag name for this filter.
 * @param {!string} propertyName Name of the context property to compare.
 * @extends {ol.format.ogc.filter.Filter}
 * @api
 */
ol.format.ogc.filter.Comparison = function(tagName, propertyName) {

  goog.base(this, tagName);

  /**
   * @public
   * @type {!string}
   */
  this.propertyName = propertyName;
};
goog.inherits(ol.format.ogc.filter.Comparison, ol.format.ogc.filter.Filter);


/**
 * @classdesc
 * Abstract class; normally only used for creating subclasses and not instantiated in apps.
 * Base class for WFS GetFeature property binary comparison filters.
 *
 * @constructor
 * @param {!string} tagName The XML tag name for this filter.
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!(string|number)} expression The value to compare.
 * @param {boolean=} opt_matchCase Case-sensitive?
 * @extends {ol.format.ogc.filter.Comparison}
 * @api
 */
ol.format.ogc.filter.ComparisonBinary = function(
    tagName, propertyName, expression, opt_matchCase) {

  goog.base(this, tagName, propertyName);

  /**
   * @public
   * @type {!(string|number)}
   */
  this.expression = expression;

  /**
   * @public
   * @type {boolean|undefined}
   */
  this.matchCase = opt_matchCase;
};
goog.inherits(ol.format.ogc.filter.ComparisonBinary, ol.format.ogc.filter.Comparison);


/**
 * @classdesc
 * Represents a `<PropertyIsEqualTo>` comparison operator.
 *
 * @constructor
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!(string|number)} expression The value to compare.
 * @param {boolean=} opt_matchCase Case-sensitive?
 * @extends {ol.format.ogc.filter.ComparisonBinary}
 * @api
 */
ol.format.ogc.filter.EqualTo = function(propertyName, expression, opt_matchCase) {
  goog.base(this, 'PropertyIsEqualTo', propertyName, expression, opt_matchCase);
};
goog.inherits(ol.format.ogc.filter.EqualTo, ol.format.ogc.filter.ComparisonBinary);


/**
 * @classdesc
 * Represents a `<PropertyIsNotEqualTo>` comparison operator.
 *
 * @constructor
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!(string|number)} expression The value to compare.
 * @param {boolean=} opt_matchCase Case-sensitive?
 * @extends {ol.format.ogc.filter.ComparisonBinary}
 * @api
 */
ol.format.ogc.filter.NotEqualTo = function(propertyName, expression, opt_matchCase) {
  goog.base(this, 'PropertyIsNotEqualTo', propertyName, expression, opt_matchCase);
};
goog.inherits(ol.format.ogc.filter.NotEqualTo, ol.format.ogc.filter.ComparisonBinary);


/**
 * @classdesc
 * Represents a `<PropertyIsLessThan>` comparison operator.
 *
 * @constructor
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} expression The value to compare.
 * @extends {ol.format.ogc.filter.ComparisonBinary}
 * @api
 */
ol.format.ogc.filter.LessThan = function(propertyName, expression) {
  goog.base(this, 'PropertyIsLessThan', propertyName, expression);
};
goog.inherits(ol.format.ogc.filter.LessThan, ol.format.ogc.filter.ComparisonBinary);


/**
 * @classdesc
 * Represents a `<PropertyIsLessThanOrEqualTo>` comparison operator.
 *
 * @constructor
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} expression The value to compare.
 * @extends {ol.format.ogc.filter.ComparisonBinary}
 * @api
 */
ol.format.ogc.filter.LessThanOrEqualTo = function(propertyName, expression) {
  goog.base(this, 'PropertyIsLessThanOrEqualTo', propertyName, expression);
};
goog.inherits(ol.format.ogc.filter.LessThanOrEqualTo, ol.format.ogc.filter.ComparisonBinary);


/**
 * @classdesc
 * Represents a `<PropertyIsGreaterThan>` comparison operator.
 *
 * @constructor
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} expression The value to compare.
 * @extends {ol.format.ogc.filter.ComparisonBinary}
 * @api
 */
ol.format.ogc.filter.GreaterThan = function(propertyName, expression) {
  goog.base(this, 'PropertyIsGreaterThan', propertyName, expression);
};
goog.inherits(ol.format.ogc.filter.GreaterThan, ol.format.ogc.filter.ComparisonBinary);


/**
 * @classdesc
 * Represents a `<PropertyIsGreaterThanOrEqualTo>` comparison operator.
 *
 * @constructor
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} expression The value to compare.
 * @extends {ol.format.ogc.filter.ComparisonBinary}
 * @api
 */
ol.format.ogc.filter.GreaterThanOrEqualTo = function(propertyName, expression) {
  goog.base(this, 'PropertyIsGreaterThanOrEqualTo', propertyName, expression);
};
goog.inherits(ol.format.ogc.filter.GreaterThanOrEqualTo, ol.format.ogc.filter.ComparisonBinary);


/**
 * @classdesc
 * Represents a `<PropertyIsNull>` comparison operator.
 *
 * @constructor
 * @param {!string} propertyName Name of the context property to compare.
 * @extends {ol.format.ogc.filter.Comparison}
 * @api
 */
ol.format.ogc.filter.IsNull = function(propertyName) {
  goog.base(this, 'PropertyIsNull', propertyName);
};
goog.inherits(ol.format.ogc.filter.IsNull, ol.format.ogc.filter.Comparison);


/**
 * @classdesc
 * Represents a `<PropertyIsBetween>` comparison operator.
 *
 * @constructor
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} lowerBoundary The lower bound of the range.
 * @param {!number} upperBoundary The upper bound of the range.
 * @extends {ol.format.ogc.filter.Comparison}
 * @api
 */
ol.format.ogc.filter.IsBetween = function(propertyName, lowerBoundary, upperBoundary) {
  goog.base(this, 'PropertyIsBetween', propertyName);

  /**
   * @public
   * @type {!number}
   */
  this.lowerBoundary = lowerBoundary;

  /**
   * @public
   * @type {!number}
   */
  this.upperBoundary = upperBoundary;
};
goog.inherits(ol.format.ogc.filter.IsBetween, ol.format.ogc.filter.Comparison);


/**
 * @classdesc
 * Represents a `<PropertyIsLike>` comparison operator.
 *
 * @constructor
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!string} pattern Text pattern.
 * @param {string=} opt_wildCard Pattern character which matches any sequence of
 *    zero or more string characters. Default is '*'.
 * @param {string=} opt_singleChar pattern character which matches any single
 *    string character. Default is '.'.
 * @param {string=} opt_escapeChar Escape character which can be used to escape
 *    the pattern characters. Default is '!'.
 * @param {boolean=} opt_matchCase Case-sensitive?
 * @extends {ol.format.ogc.filter.Comparison}
 * @api
 */
ol.format.ogc.filter.IsLike = function(propertyName, pattern,
    opt_wildCard, opt_singleChar, opt_escapeChar, opt_matchCase) {
  goog.base(this, 'PropertyIsLike', propertyName);

  /**
   * @public
   * @type {!string}
   */
  this.pattern = pattern;

  /**
   * @public
   * @type {!string}
   */
  this.wildCard = (opt_wildCard !== undefined) ? opt_wildCard : '*';

  /**
   * @public
   * @type {!string}
   */
  this.singleChar = (opt_singleChar !== undefined) ? opt_singleChar : '.';

  /**
   * @public
   * @type {!string}
   */
  this.escapeChar = (opt_escapeChar !== undefined) ? opt_escapeChar : '!';

  /**
   * @public
   * @type {boolean|undefined}
   */
  this.matchCase = opt_matchCase;
};
goog.inherits(ol.format.ogc.filter.IsLike, ol.format.ogc.filter.Comparison);
