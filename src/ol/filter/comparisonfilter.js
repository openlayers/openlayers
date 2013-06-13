goog.provide('ol.filter.Comparison');
goog.provide('ol.filter.ComparisonType');

goog.require('ol.Expression');
goog.require('ol.filter.Filter');



/**
 * @constructor
 * @extends {ol.filter.Filter}
 * @param {ol.filter.ComparisonOptions} options Options.
 */
ol.filter.Comparison = function(options) {
  goog.base(this);

  /**
   * @type {ol.filter.ComparisonType}
   * @private
   */
  this.type_ = options.type;

  this.property_ = options.property;

  this.value_ = options.value;

  this.lowerBoundary_ = options.lowerBoundary;

  this.upperBoundary_ = options.upperBoundary;

  this.matchCase_ = options.matchCase;

  var expr;
  var quote = '';
  if (goog.isString(this.value_)) {
    quote = '"';
  }
  switch (this.type_) {
    case ol.filter.ComparisonType.EQUAL_TO:
      expr = this.property_ + '==' + quote + this.value_ + quote;
      break;
    case ol.filter.ComparisonType.NOT_EQUAL_TO:
      expr = this.property_ + '!=' + quote + this.value_ + quote;
      break;
    case ol.filter.ComparisonType.LESS_THAN:
      expr = this.property_ + '<' + this.value_;
      break;
    case ol.filter.ComparisonType.GREATER_THAN:
      expr = this.property_ + '>' + this.value_;
      break;
    case ol.filter.ComparisonType.LESS_THAN_OR_EQUAL_TO:
      expr = this.property_ + '<=' + this.value_;
      break;
    case ol.filter.ComparisonType.GREATER_THAN_OR_EQUAL_TO:
      expr = this.property_ + '>=' + this.value_;
      break;
    case ol.filter.ComparisonType.BETWEEN:
      expr = this.property_ + '>=' + this.lowerBoundary_ + '&&' +
          this.property_ + '<=' + this.upperBoundary_;
      break;
    case ol.filter.ComparisonType.LIKE:
      this.applies = function(feature) {
        var attr = feature.getAttributes();
        return new RegExp(this.value_, 'gi').test(attr[this.property_]);
      };
      break;
    case ol.filter.ComparisonType.IS_NULL:
      expr = this.property_ + '=== null';
      break;
    default:
      throw new Error('Unknown filter comparison type: ' + this.type_);
      break;
  }
  if (goog.isDef(expr)) {
    this.expression_ = new ol.Expression(expr);
  }
};
goog.inherits(ol.filter.Comparison, ol.filter.Filter);


/**
 * @return {ol.filter.ComparisonType} The type of comparison filter.
 */
ol.filter.Comparison.prototype.getType = function() {
  return this.type_;
};


/**
 * @return {string} The name of the property associated with the filter.
 */
ol.filter.Comparison.prototype.getProperty = function() {
  return this.property_;
};


/**
 * @return {string|number|undefined} The value to filter on.
 */
ol.filter.Comparison.prototype.getValue = function() {
  return this.value_;
};


/**
 * @return {string|number|undefined} The lower boundary of the between filter.
 */
ol.filter.Comparison.prototype.getLowerBoundary = function() {
  return this.lowerBoundary_;
};


/**
 * @return {string|number|undefined} The upper boundary of the between filter.
 */
ol.filter.Comparison.prototype.getUpperBoundary = function() {
  return this.upperBoundary_;
};


/**
 * @return {boolean} Force case sensitive searches or not.
 */
ol.filter.Comparison.prototype.getMatchCase = function() {
  return this.matchCase_;
};


/**
 * @inheritDoc
 */
ol.filter.Comparison.prototype.applies = function(feature) {
  var attr = feature.getAttributes();
  return /** @type {boolean} */(this.expression_.evaluate(feature, attr));
};


/**
 * @param {string} wildCard wildcard character in the value, default is '*'.
 * @param {string} singleChar single-character in the value, default is '.'.
 * @param {string} escapeChar escape character in the value, default is '!'.
 * @return {string} regular expression string.
 */
ol.filter.Comparison.prototype.value2regex = function(wildCard, singleChar,
    escapeChar) {
  if (wildCard == '.') {
    throw new Error('"." is an unsupported wildCard character for ' +
        'ol.filter.Comparison');
  }
  // set UMN MapServer defaults for unspecified parameters
  wildCard = goog.isDef(wildCard) ? wildCard : '*';
  singleChar = goog.isDef(singleChar) ? singleChar : '.';
  escapeChar = goog.isDef(escapeChar) ? escapeChar : '!';
  this.value_ = this.value_.replace(
      new RegExp('\\' + escapeChar + '(.|$)', 'g'), '\\$1');
  this.value_ = this.value_.replace(
      new RegExp('\\' + singleChar, 'g'), '.');
  this.value_ = this.value_.replace(
      new RegExp('\\' + wildCard, 'g'), '.*');
  this.value_ = this.value_.replace(
      new RegExp('\\\\.\\*', 'g'), '\\' + wildCard);
  this.value_ = this.value_.replace(
      new RegExp('\\\\\\.', 'g'), '\\' + singleChar);
  return this.value_;
};


/**
 * Convert the value of this rule from a regular expression string into an
 *     ogc literal string using a wildCard of *, a singleChar of ., and an
 *     escape of !.
 * @return {string} A string value.
 */
ol.filter.Comparison.prototype.regex2value = function() {
  var value = this.value_;
  // replace ! with !!
  value = value.replace(/!/g, '!!');
  // replace \. with !. (watching out for \\.)
  value = value.replace(/(\\)?\\\./g, function($0, $1) {
    return $1 ? $0 : '!.';
  });
  // replace \* with #* (watching out for \\*)
  value = value.replace(/(\\)?\\\*/g, function($0, $1) {
    return $1 ? $0 : '!*';
  });
  // replace \\ with \
  value = value.replace(/\\\\/g, '\\');
  // convert .* to * (the sequence #.* is not allowed)
  value = value.replace(/\.\*/g, '*');
  return value;
};


/**
 * @enum {string}
 */
ol.filter.ComparisonType = {
  EQUAL_TO: '==',
  NOT_EQUAL_TO: '!=',
  LESS_THAN: '<',
  GREATER_THAN: '>',
  LESS_THAN_OR_EQUAL_TO: '<=',
  GREATER_THAN_OR_EQUAL_TO: '>=',
  BETWEEN: '..',
  LIKE: '~',
  IS_NULL: 'NULL'
};
