goog.provide('ol.filter.FeatureId');

goog.require('goog.object');
goog.require('ol.filter.Filter');



/**
 * @constructor
 * @extends {ol.filter.Filter}
 * @param {Object.<string>} fids The feature ids to use.
 */
ol.filter.FeatureId = function(fids) {
  goog.base(this);

  /**
   * @type {Object.<string>}
   * @private
   */
  this.fids_ = fids;

};
goog.inherits(ol.filter.FeatureId, ol.filter.Filter);


/**
 * @return {Object.<string>} The feature ids that are part of this filter.
 */
ol.filter.FeatureId.prototype.getFids = function() {
  return this.fids_;
};


/**
 * @inheritDoc
 */
ol.filter.FeatureId.prototype.applies = function(feature) {
  var fid = feature.getFeatureId();
  return goog.isDef(fid) && (goog.object.containsKey(this.fids_, fid));
};
