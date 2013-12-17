goog.provide('ol.render.FeaturesOverlay');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.object');
goog.require('ol.Collection');
goog.require('ol.CollectionEventType');
goog.require('ol.Feature');
goog.require('ol.render.EventType');
goog.require('ol.style.StyleFunction');



/**
 * @constructor
 */
ol.render.FeaturesOverlay = function() {

  /**
   * @private
   * @type {ol.Collection}
   */
  this.features_ = null;

  /**
   * @private
   * @type {Array.<goog.events.Key>}
   */
  this.featuresListenerKeys_ = null;

  /**
   * @private
   * @type {Object.<string, goog.events.Key>}
   */
  this.featureChangeListenerKeys_ = null;

  /**
   * @private
   * @type {ol.Map}
   */
  this.map_ = null;

  /**
   * @private
   * @type {goog.events.Key}
   */
  this.postComposeListenerKey_ = null;

  /**
   * @private
   * @type {ol.style.StyleFunction|undefined}
   */
  this.styleFunction_ = undefined;

};


/**
 * @return {ol.Collection} Features collection.
 */
ol.render.FeaturesOverlay.prototype.getFeatures = function() {
  return this.features_;
};


/**
 * @private
 */
ol.render.FeaturesOverlay.prototype.handleFeatureChange_ = function() {
  this.requestRenderFrame_();
};


/**
 * @private
 * @param {ol.CollectionEvent} collectionEvent Collection event.
 */
ol.render.FeaturesOverlay.prototype.handleFeaturesAdd_ =
    function(collectionEvent) {
  goog.asserts.assert(!goog.isNull(this.featureChangeListenerKeys_));
  var feature = /** @type {ol.Feature} */ (collectionEvent.getElement());
  this.featureChangeListenerKeys_[goog.getUid(feature).toString()] =
      goog.events.listen(feature, goog.events.EventType.CHANGE,
      this.handleFeatureChange_, false, this);
  this.requestRenderFrame_();
};


/**
 * @private
 * @param {ol.CollectionEvent} collectionEvent Collection event.
 */
ol.render.FeaturesOverlay.prototype.handleFeaturesRemove_ =
    function(collectionEvent) {
  goog.asserts.assert(!goog.isNull(this.featureChangeListenerKeys_));
  var feature = /** @type {ol.Feature} */ (collectionEvent.getElement());
  var key = goog.getUid(feature).toString();
  goog.events.unlistenByKey(this.featureChangeListenerKeys_[key]);
  delete this.featureChangeListenerKeys_[key];
  this.requestRenderFrame_();
};


/**
 * @param {ol.render.Event} event Event.
 * @private
 */
ol.render.FeaturesOverlay.prototype.handleMapPostCompose_ = function(event) {
  if (goog.isNull(this.features_) || !goog.isDef(this.styleFunction_)) {
    return;
  }
  var resolution = event.getFrameState().view2DState.resolution;
  var render = event.getRender();
  var i, ii, feature, styles;
  this.features_.forEach(function(feature) {
    styles = this.styleFunction_(feature, resolution);
    ii = styles.length;
    for (i = 0; i < ii; ++i) {
      render.drawFeature(feature, styles[i]);
    }
  }, this);
};


/**
 * @private
 */
ol.render.FeaturesOverlay.prototype.requestRenderFrame_ = function() {
  if (!goog.isNull(this.map_)) {
    this.map_.requestRenderFrame();
  }
};


/**
 * @param {ol.Collection} features Features collection.
 */
ol.render.FeaturesOverlay.prototype.setFeatures = function(features) {
  if (!goog.isNull(this.featuresListenerKeys_)) {
    goog.array.forEach(this.featuresListenerKeys_, goog.events.unlistenByKey);
    this.featuresListenerKeys_ = null;
  }
  if (!goog.isNull(this.featureChangeListenerKeys_)) {
    goog.array.forEach(
        goog.object.getValues(this.featureChangeListenerKeys_),
        goog.events.unlistenByKey);
    this.featureChangeListenerKeys_ = null;
  }
  this.features_ = features;
  if (!goog.isNull(features)) {
    this.featuresListenerKeys_ = [
      goog.events.listen(features, ol.CollectionEventType.ADD,
          this.handleFeaturesAdd_, false, this),
      goog.events.listen(features, ol.CollectionEventType.REMOVE,
          this.handleFeaturesRemove_, false, this)
    ];
    this.featureChangeListenerKeys_ = {};
    var featuresArray = features.getArray();
    var i, ii = featuresArray.length;
    var feature;
    for (i = 0; i < ii; ++i) {
      feature = featuresArray[i];
      this.featureChangeListenerKeys_[goog.getUid(feature).toString()] =
          goog.events.listen(feature, goog.events.EventType.CHANGE,
          this.handleFeatureChange_, false, this);
    }
  }
  this.requestRenderFrame_();
};


/**
 * @param {ol.Map} map Map.
 */
ol.render.FeaturesOverlay.prototype.setMap = function(map) {
  if (!goog.isNull(this.postComposeListenerKey_)) {
    goog.events.unlistenByKey(this.postComposeListenerKey_);
    this.postComposeListenerKey_ = null;
  }
  this.requestRenderFrame_();
  this.map_ = map;
  if (!goog.isNull(map)) {
    this.postComposeListenerKey_ = goog.events.listen(
        map, ol.render.EventType.POSTCOMPOSE, this.handleMapPostCompose_, false,
        this);
    map.requestRenderFrame();
  }
};


/**
 * @param {ol.style.StyleFunction} styleFunction Style function.
 */
ol.render.FeaturesOverlay.prototype.setStyleFunction = function(styleFunction) {
  this.styleFunction_ = styleFunction;
  this.requestRenderFrame_();
};
