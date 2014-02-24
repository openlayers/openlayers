goog.provide('ol.style');
goog.provide('ol.style.Style');

goog.require('goog.object');
goog.require('ol.Feature');
goog.require('ol.expr.Call');
goog.require('ol.expr.Identifier');
goog.require('ol.expr.Literal');
goog.require('ol.expr.functions');
goog.require('ol.geom.GeometryType');
goog.require('ol.style.Fill');
goog.require('ol.style.Literal');
goog.require('ol.style.PolygonLiteral');
goog.require('ol.style.Rule');
goog.require('ol.style.Shape');
goog.require('ol.style.Stroke');
goog.require('ol.style.Symbolizer');



/**
 * @constructor
 * @param {ol.style.StyleOptions} options Style options.
 * @todo stability experimental
 */
ol.style.Style = function(options) {

  /**
   * @type {Array.<ol.style.Rule>}
   * @private
   */
  this.rules_ = goog.isDef(options.rules) ? options.rules : [];

  /**
   * Symbolizers that apply if no rules are given or where none of the given
   * rules apply (these are the "else" symbolizers).
   * @type {Array.<ol.style.Symbolizer>}
   * @private
   */
  this.symbolizers_ = goog.isDef(options.symbolizers) ?
      options.symbolizers : [];

};


/**
 * Create an array of symbolizer literals for a feature.
 * @param {ol.Feature} feature Feature.
 * @param {number} resolution Map resolution.
 * @return {Array.<ol.style.Literal>} Symbolizer literals for the
 *     feature.
 */
ol.style.Style.prototype.createLiterals = function(feature, resolution) {
  var rules = this.rules_,
      symbolizers = [],
      applies = false,
      rule;
  for (var i = 0, ii = rules.length; i < ii; ++i) {
    rule = rules[i];
    if (rule.applies(feature, resolution)) {
      applies = true;
      symbolizers.push.apply(symbolizers, rule.getSymbolizers());
    }
  } if (!applies) {
    // these are the "else" symbolizers
    symbolizers = this.symbolizers_;
  }
  return ol.style.Style.createLiterals(symbolizers, feature);
};


/**
 * The default style.
 * @type {ol.style.Style}
 * @private
 */
ol.style.default_ = null;


/**
 * Get the default style.
 * @return {ol.style.Style} The default style.
 */
ol.style.getDefault = function() {
  if (goog.isNull(ol.style.default_)) {
    ol.style.default_ = new ol.style.Style({
      rules: [
        new ol.style.Rule({
          filter: new ol.expr.Call(
              new ol.expr.Identifier(ol.expr.functions.RENDER_INTENT),
              [new ol.expr.Literal('select')]),
          symbolizers: [
            new ol.style.Shape({
              fill: new ol.style.Fill({
                color: '#ffffff',
                opacity: 0.7
              }),
              stroke: new ol.style.Stroke({
                color: '#696969',
                opacity: 0.9,
                width: 2.0
              })
            }),
            new ol.style.Fill({
              color: '#ffffff',
              opacity: 0.7
            }),
            new ol.style.Stroke({
              color: '#696969',
              opacity: 0.9,
              width: 2.0
            })
          ]
        })
      ],
      symbolizers: [
        new ol.style.Shape({
          fill: new ol.style.Fill(),
          stroke: new ol.style.Stroke()
        }),
        new ol.style.Fill(),
        new ol.style.Stroke()
      ]
    });
  }
  return ol.style.default_;
};


/**
 * Set the default style.
 * @param {ol.style.Style} style The new default style.
 * @return {ol.style.Style} The default style.
 */
ol.style.setDefault = function(style) {
  ol.style.default_ = style;
  return style;
};


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
};


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
      } else if (goog.isDef(literal.fillColor) &&
          !goog.isDef(literal.strokeColor)) {
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
