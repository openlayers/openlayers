goog.provide('ol.layer.Vector');

goog.require('ol.Feature');
goog.require('ol.layer.Layer');
goog.require('ol.source.Vector');
goog.require('ol.style.Style');



/**
 * @constructor
 * @extends {ol.layer.Layer}
 * @param {ol.layer.LayerOptions} layerOptions Layer options.
 */
ol.layer.Vector = function(layerOptions) {
  goog.base(this, layerOptions);

  /**
   * @private
   * @type {ol.style.Style}
   */
  this.style_ = goog.isDef(layerOptions.style) ? layerOptions.style : null;

};
goog.inherits(ol.layer.Vector, ol.layer.Layer);


/**
 * @return {ol.source.Vector} Source.
 */
ol.layer.Vector.prototype.getVectorSource = function() {
  return /** @type {ol.source.Vector} */ (this.getSource());
};


/**
 * @param {Array.<ol.Feature>} features Features.
 * @return {Array.<Array>} symbolizers for features.
 */
ol.layer.Vector.prototype.groupFeaturesBySymbolizerLiteral =
    function(features) {
  var uniqueLiterals = {},
      featuresBySymbolizer = [],
      style = this.style_,
      feature, literals, literal, uniqueLiteral, key;
  for (var i = 0, ii = features.length; i < ii; ++i) {
    feature = features[i];
    literals = goog.isNull(style) ?
        ol.style.Style.applyDefaultStyle(feature) :
        style.apply(feature);
    for (var j = 0, jj = literals.length; j < jj; ++j) {
      literal = literals[j];
      for (var l in uniqueLiterals) {
        uniqueLiteral = featuresBySymbolizer[uniqueLiterals[key]][1];
        if (literal.equals(uniqueLiteral)) {
          literal = uniqueLiteral;
          break;
        }
      }
      key = goog.getUid(literal);
      if (!goog.object.containsKey(uniqueLiterals, key)) {
        uniqueLiterals[key] = featuresBySymbolizer.length;
        featuresBySymbolizer.push([[], literal]);
      }
      featuresBySymbolizer[uniqueLiterals[key]][0].push(feature);
    }
  }
  return featuresBySymbolizer;
};
