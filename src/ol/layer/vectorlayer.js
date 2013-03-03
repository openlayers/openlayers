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
      numFeatures = features.length,
      i, j, l, feature, literals, numLiterals, literal, uniqueLiteral, key;
  for (i = 0; i < numFeatures; ++i) {
    feature = features[i];
    literals = feature.getSymbolizerLiterals();
    if (goog.isNull(literals)) {
      literals = goog.isNull(style) ?
          ol.style.Style.applyDefaultStyle(feature) :
          style.apply(feature);
    }
    numLiterals = literals.length;
    for (j = 0; j < numLiterals; ++j) {
      literal = literals[j];
      for (l in uniqueLiterals) {
        uniqueLiteral = featuresBySymbolizer[uniqueLiterals[l]][1];
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
