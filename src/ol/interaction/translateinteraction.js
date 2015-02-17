goog.provide('ol.interaction.Translate');

goog.require('ol.interaction.Pointer');



/**
 * @classdesc
 * Interaction for translating (moving) features.
 *
 * @constructor
 * @extends {ol.interaction.Pointer}
 * @param {olx.interaction.TranslateOptions} options Options.
 * @api
 */
ol.interaction.Translate = function(options) {
  goog.base(this, {
    handleDownEvent: ol.interaction.Translate.handleDownEvent_,
    handleDragEvent: ol.interaction.Translate.handleDragEvent_,
    handleUpEvent: ol.interaction.Translate.handleUpEvent_
  });

  /**
    * The last position we translated to.
    * @type {ol.Coordinate}
    * @private
    */
  this.lastCoordinate_ = null;


  /**
   * @type {ol.Collection.<ol.Feature>|undefined}
   * @private
   */
  this.features_ = options.features;

  /**
   * @type {ol.Feature}
   * @private
   */
  this.lastFeature_ = null;
};
goog.inherits(ol.interaction.Translate, ol.interaction.Pointer);


/**
 * @param {ol.MapBrowserPointerEvent} event Event.
 * @return {boolean} Start drag sequence?
 * @this {ol.interaction.Translate}
 * @private
 */
ol.interaction.Translate.handleDownEvent_ = function(event) {
  this.lastFeature_ = this.featuresAtPixel_(event.pixel, event.map);
  if (goog.isNull(this.lastCoordinate_) && this.lastFeature_) {
    this.lastCoordinate_ = event.coordinate;
    return true;
  }
  return false;
};


/**
 * @param {ol.MapBrowserPointerEvent} event Event.
 * @return {boolean} Stop drag sequence?
 * @this {ol.interaction.Translate}
 * @private
 */
ol.interaction.Translate.handleUpEvent_ = function(event) {
  if (!goog.isNull(this.lastCoordinate_)) {
    this.lastCoordinate_ = null;
    return true;
  }
  return false;
};


/**
 * @param {ol.MapBrowserPointerEvent} event Event.
 * @this {ol.interaction.Translate}
 * @private
 */
ol.interaction.Translate.handleDragEvent_ = function(event) {
  if (!goog.isNull(this.lastCoordinate_)) {
    var newCoordinate = event.coordinate;
    var deltaX = newCoordinate[0] - this.lastCoordinate_[0];
    var deltaY = newCoordinate[1] - this.lastCoordinate_[1];

    if (goog.isDef(this.features_)) {
      this.features_.forEach(function(feature) {
        var geom = feature.getGeometry();
        geom.translate(deltaX, deltaY);
        feature.setGeometry(geom);
      });
    } else if (goog.isDef(this.lastFeature_)) {
      var geom = this.lastFeature_.getGeometry();
      geom.translate(deltaX, deltaY);
      this.lastFeature_.setGeometry(geom);
    }

    this.lastCoordinate_ = newCoordinate;
  }
};


/**
 * Tests to see if the given coordinates intersects any of our selected
 * features.
 * @param {ol.Pixel} pixel Pixel coordinate to test for intersection.
 * @param {ol.Map} map Map to test the intersection on.
 * @return {ol.Feature} Returns the feature found at the specified pixel
 * coordinates.
 * @private
 */
ol.interaction.Translate.prototype.featuresAtPixel_ = function(pixel, map) {
  var found = null;

  var intersectingFeature = map.forEachFeatureAtPixel(pixel,
      function(feature) {
        return feature;
      });

  if (goog.isDef(this.features_)) {
    this.features_.forEach(function(feature) {
      if (!found && feature == intersectingFeature) {
        found = intersectingFeature;
      }
    });
  } else {
    found = intersectingFeature;
  }
  return found;
};
