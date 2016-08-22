goog.provide('ol.interaction.Translate');
goog.provide('ol.interaction.TranslateEvent');

goog.require('ol');
goog.require('ol.events.Event');
goog.require('ol.array');
goog.require('ol.interaction.Pointer');


/**
 * @enum {string}
 */
ol.interaction.TranslateEventType = {
  /**
   * Triggered upon feature translation start.
   * @event ol.interaction.TranslateEvent#translatestart
   * @api
   */
  TRANSLATESTART: 'translatestart',
  /**
   * Triggered upon feature translation.
   * @event ol.interaction.TranslateEvent#translating
   * @api
   */
  TRANSLATING: 'translating',
  /**
   * Triggered upon feature translation end.
   * @event ol.interaction.TranslateEvent#translateend
   * @api
   */
  TRANSLATEEND: 'translateend'
};


/**
 * @classdesc
 * Events emitted by {@link ol.interaction.Translate} instances are instances of
 * this type.
 *
 * @constructor
 * @extends {ol.events.Event}
 * @implements {oli.interaction.TranslateEvent}
 * @param {ol.interaction.TranslateEventType} type Type.
 * @param {ol.Collection.<ol.Feature>} features The features translated.
 * @param {ol.Coordinate} coordinate The event coordinate.
 */
ol.interaction.TranslateEvent = function(type, features, coordinate) {

  ol.events.Event.call(this, type);

  /**
   * The features being translated.
   * @type {ol.Collection.<ol.Feature>}
   * @api
   */
  this.features = features;

  /**
   * The coordinate of the drag event.
   * @const
   * @type {ol.Coordinate}
   * @api
   */
  this.coordinate = coordinate;
};
ol.inherits(ol.interaction.TranslateEvent, ol.events.Event);


/**
 * @classdesc
 * Interaction for translating (moving) features.
 *
 * @constructor
 * @extends {ol.interaction.Pointer}
 * @fires ol.interaction.TranslateEvent
 * @param {olx.interaction.TranslateOptions} options Options.
 * @api
 */
ol.interaction.Translate = function(options) {
  ol.interaction.Pointer.call(this, {
    handleDownEvent: ol.interaction.Translate.handleDownEvent_,
    handleDragEvent: ol.interaction.Translate.handleDragEvent_,
    handleMoveEvent: ol.interaction.Translate.handleMoveEvent_,
    handleUpEvent: ol.interaction.Translate.handleUpEvent_
  });


  /**
   * @type {string|undefined}
   * @private
   */
  this.previousCursor_ = undefined;


  /**
   * The last position we translated to.
   * @type {ol.Coordinate}
   * @private
   */
  this.lastCoordinate_ = null;


  /**
   * @type {ol.Collection.<ol.Feature>}
   * @private
   */
  this.features_ = options.features !== undefined ? options.features : null;

  /** @type {function(ol.layer.Layer): boolean} */
  var layerFilter;
  if (options.layers) {
    if (typeof options.layers === 'function') {
      layerFilter = options.layers;
    } else {
      var layers = options.layers;
      layerFilter = function(layer) {
        return ol.array.includes(layers, layer);
      };
    }
  } else {
    layerFilter = ol.functions.TRUE;
  }

  /**
   * @private
   * @type {function(ol.layer.Layer): boolean}
   */
  this.layerFilter_ = layerFilter;

  /**
   * @type {ol.Feature}
   * @private
   */
  this.lastFeature_ = null;
};
ol.inherits(ol.interaction.Translate, ol.interaction.Pointer);


/**
 * @param {ol.MapBrowserPointerEvent} event Event.
 * @return {boolean} Start drag sequence?
 * @this {ol.interaction.Translate}
 * @private
 */
ol.interaction.Translate.handleDownEvent_ = function(event) {
  this.lastFeature_ = this.featuresAtPixel_(event.pixel, event.map);
  if (!this.lastCoordinate_ && this.lastFeature_) {
    this.lastCoordinate_ = event.coordinate;
    ol.interaction.Translate.handleMoveEvent_.call(this, event);
    this.dispatchEvent(
        new ol.interaction.TranslateEvent(
            ol.interaction.TranslateEventType.TRANSLATESTART, this.features_,
            event.coordinate));
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
  if (this.lastCoordinate_) {
    this.lastCoordinate_ = null;
    ol.interaction.Translate.handleMoveEvent_.call(this, event);
    this.dispatchEvent(
        new ol.interaction.TranslateEvent(
            ol.interaction.TranslateEventType.TRANSLATEEND, this.features_,
            event.coordinate));
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
  if (this.lastCoordinate_) {
    var newCoordinate = event.coordinate;
    var deltaX = newCoordinate[0] - this.lastCoordinate_[0];
    var deltaY = newCoordinate[1] - this.lastCoordinate_[1];

    if (this.features_) {
      this.features_.forEach(function(feature) {
        var geom = feature.getGeometry();
        geom.translate(deltaX, deltaY);
        feature.setGeometry(geom);
      });
    } else if (this.lastFeature_) {
      var geom = this.lastFeature_.getGeometry();
      geom.translate(deltaX, deltaY);
      this.lastFeature_.setGeometry(geom);
    }

    this.lastCoordinate_ = newCoordinate;
    this.dispatchEvent(
        new ol.interaction.TranslateEvent(
            ol.interaction.TranslateEventType.TRANSLATING, this.features_,
            newCoordinate));
  }
};


/**
 * @param {ol.MapBrowserEvent} event Event.
 * @this {ol.interaction.Translate}
 * @private
 */
ol.interaction.Translate.handleMoveEvent_ = function(event) {
  var elem = event.map.getTargetElement();

  // Change the cursor to grab/grabbing if hovering any of the features managed
  // by the interaction
  if (this.featuresAtPixel_(event.pixel, event.map)) {
    this.previousCursor_ = elem.style.cursor;
    // WebKit browsers don't support the grab icons without a prefix
    elem.style.cursor = this.lastCoordinate_ ?
        '-webkit-grabbing' : '-webkit-grab';

    // Thankfully, attempting to set the standard ones will silently fail,
    // keeping the prefixed icons
    elem.style.cursor = this.lastCoordinate_ ?  'grabbing' : 'grab';
  } else {
    elem.style.cursor = this.previousCursor_ !== undefined ?
        this.previousCursor_ : '';
    this.previousCursor_ = undefined;
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
      }, this, this.layerFilter_);

  if (this.features_ &&
      ol.array.includes(this.features_.getArray(), intersectingFeature)) {
    found = intersectingFeature;
  }

  return found;
};
