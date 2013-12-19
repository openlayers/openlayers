goog.provide('ol.layer.Vector');

goog.require('goog.array');
goog.require('goog.object');
goog.require('ol.Feature');
goog.require('ol.FeatureRenderIntent');
goog.require('ol.layer.Layer');
goog.require('ol.source.Vector');
goog.require('ol.source.VectorEventType');
goog.require('ol.style');
goog.require('ol.style.Style');



/**
 * @constructor
 * @extends {ol.layer.Layer}
 * @param {olx.layer.VectorLayerOptions} options Vector layer options.
 * @todo stability experimental
 */
ol.layer.Vector = function(options) {

  var baseOptions = /** @type {olx.layer.VectorLayerOptions} */
      (goog.object.clone(options));

  /**
   * @private
   * @type {ol.style.Style}
   */
  this.style_ = goog.isDef(options.style) ? options.style : null;
  delete baseOptions.style;

  /**
   * @type {function(Array.<ol.Feature>):string}
   * @private
   */
  this.transformFeatureInfo_ = goog.isDef(options.transformFeatureInfo) ?
      options.transformFeatureInfo : ol.layer.Vector.uidTransformFeatureInfo;
  delete baseOptions.transformFeatureInfo;

  /**
   * True if this is a temporary layer.
   * @type {boolean}
   * @private
   */
  this.temporary_ = false;

  goog.base(this, /** @type {olx.layer.LayerOptions} */ (baseOptions));
};
goog.inherits(ol.layer.Vector, ol.layer.Layer);


/**
 * @return {boolean} Whether this layer is temporary.
 */
ol.layer.Vector.prototype.getTemporary = function() {
  return this.temporary_;
};


/**
 * @return {ol.source.Vector} Source.
 */
ol.layer.Vector.prototype.getVectorSource = function() {
  return /** @type {ol.source.Vector} */ (this.getSource());
};


/**
 * @return {ol.style.Style} This layer's style.
 */
ol.layer.Vector.prototype.getStyle = function() {
  return this.style_;
};


/**
 * Set a style for this layer.
 * @param {ol.style.Style} style Style.
 */
ol.layer.Vector.prototype.setStyle = function(style) {
  this.style_ = style;
  var source = this.getVectorSource();
  if (source) {
    source.dispatchEvent(
        new ol.source.VectorEvent(ol.source.VectorEventType.CHANGE, [], []));
  }
};


/**
 * @return {function(Array.<ol.Feature>):string} Feature info function.
 */
ol.layer.Vector.prototype.getTransformFeatureInfo = function() {
  return this.transformFeatureInfo_;
};


/**
 * @param {boolean} temporary Whether this layer is temporary.
 */
ol.layer.Vector.prototype.setTemporary = function(temporary) {
  this.temporary_ = temporary;
};


/**
 * @param {Array.<ol.Feature>} features Features.
 * @return {string} Feature info.
 */
ol.layer.Vector.uidTransformFeatureInfo = function(features) {
  var uids = goog.array.map(features,
      function(feature) { return goog.getUid(feature); });
  return uids.join(', ');
};


/**
 * @param {ol.Feature} feature Feature.
 * @return {boolean} Whether the feature is selected.
 */
ol.layer.Vector.selectedFeaturesFilter = function(feature) {
  return feature.getRenderIntent() == ol.FeatureRenderIntent.SELECTED;
};
