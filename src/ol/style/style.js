goog.provide('ol.style.Style');

goog.require('ol.Feature');
goog.require('ol.geom.GeometryType');
goog.require('ol.style.Rule');
goog.require('ol.style.Literal');
goog.require('ol.style.PolygonLiteral');



/**
 * @constructor
 * @param {ol.style.StyleOptions} options Style options.
 */
ol.style.Style = function(options) {

  /**
   * @type {Array.<ol.style.Rule>}
   * @private
   */
  this.rules_ = goog.isDef(options.rules) ? options.rules : [];

};


/**
 * @param {ol.Feature} feature Feature.
 * @return {Array.<ol.style.Literal>} Symbolizer literals for the
 *     feature.
 */
ol.style.Style.prototype.apply = function(feature) {
  var rules = this.rules_,
      literals = [],
      rule, symbolizers;
  for (var i = 0, ii = rules.length; i < ii; ++i) {
    rule = rules[i];
    if (rule.applies(feature)) {
      symbolizers = rule.getSymbolizers();
      for (var j = 0, jj = symbolizers.length; j < jj; ++j) {
        literals.push(symbolizers[j].createLiteral(feature));
      }
    }
  }
  return literals;
};


/**
 * @param {ol.Feature} feature Feature.
 * @return {Array.<ol.style.Literal>} Default symbolizer literals for
 *     the feature.
 */
ol.style.Style.applyDefaultStyle = function(feature) {
  var geometry = feature.getGeometry(),
      symbolizerLiterals = [];
  if (!goog.isNull(geometry)) {
    var type = geometry.getType();
    if (type === ol.geom.GeometryType.POINT ||
        type === ol.geom.GeometryType.MULTIPOINT) {
      symbolizerLiterals.push(ol.style.ShapeDefaults);
    } else if (type === ol.geom.GeometryType.LINESTRING ||
        type === ol.geom.GeometryType.MULTILINESTRING) {
      symbolizerLiterals.push(ol.style.LineDefaults);
    } else if (type === ol.geom.GeometryType.LINEARRING ||
        type === ol.geom.GeometryType.POLYGON ||
        type === ol.geom.GeometryType.MULTIPOLYGON) {
      symbolizerLiterals.push(ol.style.PolygonDefaults);
    }
  }
  return symbolizerLiterals;
};


/**
 * Collapse partial polygon symbolizers.
 * @param {Array.<ol.style.Literal>} literals Input literals.
 * @return {Array.<ol.style.Literal>} Reduced literals.
 */
ol.style.Style.reduceLiterals = function(literals) {
  var reduced = [];
  var literal, stroke, fill, key, value;
  for (var i = 0, ii = literals.length; i < ii; ++i) {
    literal = literals[i];
    if (literal instanceof ol.style.PolygonLiteral) {
      if (goog.isDef(literal.strokeColor) &&
          !goog.isDef(literal.fillColor)) {
        // stroke only, check for previous fill only
        if (fill) {
          for (key in literal) {
            value = literal[key];
            if (goog.isDef(value)) {
              fill[key] = value;
            }
          }
          fill = null;
        } else {
          stroke = literal;
          reduced.push(stroke);
        }
      } else if (goog.isDef(literal.fillColor)
          && !goog.isDef(literal.strokeColor)) {
        // fill only, check for previous stroke only
        if (stroke) {
          for (key in literal) {
            value = literal[key];
            if (goog.isDef(value)) {
              stroke[key] = value;
            }
          }
          stroke = null;
        } else {
          fill = literal;
          reduced.push(fill);
        }
      } else {
        // both stroke and fill, proceed
        reduced.push(literal);
      }
    } else {
      reduced.push(literal);
    }
  }
  return reduced;
};
