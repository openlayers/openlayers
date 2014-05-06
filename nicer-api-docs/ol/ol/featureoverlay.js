goog.provide('ol.FeatureOverlay');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.object');
goog.require('ol.Collection');
goog.require('ol.CollectionEventType');
goog.require('ol.Feature');
goog.require('ol.feature');
goog.require('ol.render.EventType');



/**
 * @constructor
 * @param {olx.FeatureOverlayOptions=} opt_options Options.
 * @todo api
 */
ol.FeatureOverlay = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

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
   * @type {ol.style.Style|Array.<ol.style.Style>|ol.feature.StyleFunction}
   */
  this.style_ = null;

  /**
   * @private
   * @type {ol.feature.StyleFunction|undefined}
   */
  this.styleFunction_ = goog.isDef(options.style) ?
      ol.feature.createStyleFunction(options.style) : undefined;

  if (goog.isDef(options.features)) {
    if (goog.isArray(options.features)) {
      this.setFeatures(new ol.Collection(goog.array.clone(options.features)));
    } else {
      goog.asserts.assertInstanceof(options.features, ol.Collection);
      this.setFeatures(options.features);
    }
  } else {
    this.setFeatures(new ol.Collection());
  }

  if (goog.isDef(options.map)) {
    this.setMap(options.map);
  }

};


/**
 * @param {ol.Feature} feature Feature.
 * @todo api
 */
ol.FeatureOverlay.prototype.addFeature = function(feature) {
  this.features_.push(feature);
};


/**
 * @return {ol.Collection} Features collection.
 * @todo api
 */
ol.FeatureOverlay.prototype.getFeatures = function() {
  return this.features_;
};


/**
 * @private
 */
ol.FeatureOverlay.prototype.handleFeatureChange_ = function() {
  this.render_();
};


/**
 * @private
 * @param {ol.CollectionEvent} collectionEvent Collection event.
 */
ol.FeatureOverlay.prototype.handleFeaturesAdd_ = function(collectionEvent) {
  goog.asserts.assert(!goog.isNull(this.featureChangeListenerKeys_));
  var feature = /** @type {ol.Feature} */ (collectionEvent.element);
  this.featureChangeListenerKeys_[goog.getUid(feature).toString()] =
      goog.events.listen(feature, goog.events.EventType.CHANGE,
      this.handleFeatureChange_, false, this);
  this.render_();
};


/**
 * @private
 * @param {ol.CollectionEvent} collectionEvent Collection event.
 */
ol.FeatureOverlay.prototype.handleFeaturesRemove_ = function(collectionEvent) {
  goog.asserts.assert(!goog.isNull(this.featureChangeListenerKeys_));
  var feature = /** @type {ol.Feature} */ (collectionEvent.element);
  var key = goog.getUid(feature).toString();
  goog.events.unlistenByKey(this.featureChangeListenerKeys_[key]);
  delete this.featureChangeListenerKeys_[key];
  this.render_();
};


/**
 * @param {ol.render.Event} event Event.
 * @private
 */
ol.FeatureOverlay.prototype.handleMapPostCompose_ = function(event) {
  if (goog.isNull(this.features_)) {
    return;
  }
  var styleFunction = this.styleFunction_;
  if (!goog.isDef(styleFunction)) {
    styleFunction = ol.feature.defaultStyleFunction;
  }
  var resolution = event.frameState.view2DState.resolution;
  var vectorContext = event.vectorContext;
  var i, ii, styles;
  this.features_.forEach(function(feature) {
    styles = styleFunction(feature, resolution);
    if (!goog.isDefAndNotNull(styles)) {
      return;
    }
    ii = styles.length;
    for (i = 0; i < ii; ++i) {
      vectorContext.drawFeature(feature, styles[i]);
    }
  });
};


/**
 * @param {ol.Feature} feature Feature.
 * @todo api
 */
ol.FeatureOverlay.prototype.removeFeature = function(feature) {
  this.features_.remove(feature);
};


/**
 * @private
 */
ol.FeatureOverlay.prototype.render_ = function() {
  if (!goog.isNull(this.map_)) {
    this.map_.render();
  }
};


/**
 * @param {ol.Collection} features Features collection.
 * @todo api
 */
ol.FeatureOverlay.prototype.setFeatures = function(features) {
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
    features.forEach(function(feature) {
      this.featureChangeListenerKeys_[goog.getUid(feature).toString()] =
          goog.events.listen(feature, goog.events.EventType.CHANGE,
          this.handleFeatureChange_, false, this);
    }, this);
  }
  this.render_();
};


/**
 * @param {ol.Map} map Map.
 * @todo api
 */
ol.FeatureOverlay.prototype.setMap = function(map) {
  if (!goog.isNull(this.postComposeListenerKey_)) {
    goog.events.unlistenByKey(this.postComposeListenerKey_);
    this.postComposeListenerKey_ = null;
  }
  this.render_();
  this.map_ = map;
  if (!goog.isNull(map)) {
    this.postComposeListenerKey_ = goog.events.listen(
        map, ol.render.EventType.POSTCOMPOSE, this.handleMapPostCompose_, false,
        this);
    map.render();
  }
};


/**
 * Set the style for features.  This can be a single style object, an array
 * of styles, or a function that takes a feature and resolution and returns
 * an array of styles.
 * @param {ol.style.Style|Array.<ol.style.Style>|ol.feature.StyleFunction} style
 *     Overlay style.
 * @todo api
 */
ol.FeatureOverlay.prototype.setStyle = function(style) {
  this.style_ = style;
  this.styleFunction_ = ol.feature.createStyleFunction(style);
  this.render_();
};


/**
 * Get the style for features.  This returns whatever was passed to the `style`
 * option at construction or to the `setStyle` method.
 * @return {ol.style.Style|Array.<ol.style.Style>|ol.feature.StyleFunction}
 *     Overlay style.
 * @todo api
 */
ol.FeatureOverlay.prototype.getStyle = function() {
  return this.style_;
};


/**
 * Get the style function.
 * @return {ol.feature.StyleFunction|undefined} Style function.
 * @todo api
 */
ol.FeatureOverlay.prototype.getStyleFunction = function() {
  return this.styleFunction_;
};
