goog.provide('ol.style.Style');

goog.require('ol.Feature');
goog.require('ol.geom.GeometryType');
goog.require('ol.style.Rule');
goog.require('ol.style.SymbolizerLiteral');



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
 * @return {Array.<ol.style.SymbolizerLiteral>} Symbolizer literals for the
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
 * @return {Array.<ol.style.SymbolizerLiteral>} Default symbolizer literals for
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
