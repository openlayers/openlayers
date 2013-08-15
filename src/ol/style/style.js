goog.provide('ol.style.Style');

goog.require('goog.object');
goog.require('ol.Feature');
goog.require('ol.geom.GeometryType');
goog.require('ol.style.Fill');
goog.require('ol.style.Literal');
goog.require('ol.style.PolygonLiteral');
goog.require('ol.style.Rule');
goog.require('ol.style.Shape');
goog.require('ol.style.Stroke');



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
  return ol.style.Style.reduceLiterals_(literals);
};


/**
 * @param {ol.Feature} feature Feature.
 * @return {Array.<ol.style.Literal>} Default symbolizer literals for
 *     the feature.
 */
ol.style.Style.applyDefaultStyle = function(feature) {
  return ol.style.Style.defaults.apply(feature);
};


/**
 * The default style.
 * @type {ol.style.Style}
 */
ol.style.Style.defaults = new ol.style.Style({
  rules: [
    new ol.style.Rule({
      symbolizers: [
        new ol.style.Shape({
          fill: new ol.style.Fill(),
          stroke: new ol.style.Stroke()
        }),
        new ol.style.Fill(),
        new ol.style.Stroke()
      ]    
    })
  ]
});


/**
 * Given an array of symbolizers, generate an array of literals.
 * @param {Array.<ol.style.Symbolizer>} symbolizers List of symbolizers.
 * @param {ol.Feature|ol.geom.GeometryType} featureOrType Feature or geometry
 *     type.
 * @return {Array.<ol.style.Literal>} Array of literals.
 */
ol.style.Style.createLiterals = function(symbolizers, featureOrType) {
  var length = symbolizers.length;
  var literals = new Array(length);
  for (var i = 0; i < length; ++i) {
    literals[i] = symbolizers[i].createLiteral(featureOrType);
  }
  return ol.style.Style.reduceLiterals_(literals);
}


/**
 * Collapse partial polygon symbolizers and remove null symbolizers.
 * @param {Array.<ol.style.Literal>} literals Input literals.
 * @return {Array.<ol.style.Literal>} Reduced literals.
 * @private
 */
ol.style.Style.reduceLiterals_ = function(literals) {
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
    } else if (literal) {
      reduced.push(literal);
    }
  }
  return reduced;
};
