goog.provide('ol.interaction.Translate');

goog.require('ol');
goog.require('ol.Collection');
goog.require('ol.events.Event');
goog.require('ol.functions');
goog.require('ol.array');
goog.require('ol.interaction.Pointer');


/**
 * @classdesc
 * Interaction for translating (moving) features.
 *
 * @constructor
 * @extends {ol.interaction.Pointer}
 * @fires ol.interaction.Translate.Event
 * @param {olx.interaction.TranslateOptions=} opt_options Options.
 * @api
 */
ol.interaction.Translate = function(opt_options) {
  ol.interaction.Pointer.call(this, {
    handleDownEvent: ol.interaction.Translate.handleDownEvent_,
    handleDragEvent: ol.interaction.Translate.handleDragEvent_,
    handleMoveEvent: ol.interaction.Translate.handleMoveEvent_,
    handleUpEvent: ol.interaction.Translate.handleUpEvent_
  });

  var options = opt_options ? opt_options : {};

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
   * @private
   * @type {number}
   */
  this.hitTolerance_ = options.hitTolerance ? options.hitTolerance : 0;

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

    var features = this.features_ || new ol.Collection([this.lastFeature_]);

    this.dispatchEvent(
        new ol.interaction.Translate.Event(
            ol.interaction.Translate.EventType.TRANSLATESTART, features,
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

    var features = this.features_ || new ol.Collection([this.lastFeature_]);

    this.dispatchEvent(
        new ol.interaction.Translate.Event(
            ol.interaction.Translate.EventType.TRANSLATEEND, features,
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

    var features = this.features_ || new ol.Collection([this.lastFeature_]);

    features.forEach(function(feature) {
      var geom = feature.getGeometry();
      geom.translate(deltaX, deltaY);
      feature.setGeometry(geom);
    });

    this.lastCoordinate_ = newCoordinate;
    this.dispatchEvent(
        new ol.interaction.Translate.Event(
            ol.interaction.Translate.EventType.TRANSLATING, features,
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
  return map.forEachFeatureAtPixel(pixel,
      function(feature) {
        if (!this.features_ ||
            ol.array.includes(this.features_.getArray(), feature)) {
          return feature;
        }
      }.bind(this), {
        layerFilter: this.layerFilter_,
        hitTolerance: this.hitTolerance_
      });
};


/**
 * Returns the Hit-detection tolerance.
 * @returns {number} Hit tolerance in pixels.
 * @api
 */
ol.interaction.Translate.prototype.getHitTolerance = function() {
  return this.hitTolerance_;
};


/**
 * Hit-detection tolerance. Pixels inside the radius around the given position
 * will be checked for features. This only works for the canvas renderer and
 * not for WebGL.
 * @param {number} hitTolerance Hit tolerance in pixels.
 * @api
 */
ol.interaction.Translate.prototype.setHitTolerance = function(hitTolerance) {
  this.hitTolerance_ = hitTolerance;
};


/**
 * @classdesc
 * Events emitted by {@link ol.interaction.Translate} instances are instances of
 * this type.
 *
 * @constructor
 * @extends {ol.events.Event}
 * @implements {oli.interaction.TranslateEvent}
 * @param {ol.interaction.Translate.EventType} type Type.
 * @param {ol.Collection.<ol.Feature>} features The features translated.
 * @param {ol.Coordinate} coordinate The event coordinate.
 */
ol.interaction.Translate.Event = function(type, features, coordinate) {

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
ol.inherits(ol.interaction.Translate.Event, ol.events.Event);


/**
 * @enum {string}
 */
ol.interaction.Translate.EventType = {
  /**
   * Triggered upon feature translation start.
   * @event ol.interaction.Translate.Event#translatestart
   * @api
   */
  TRANSLATESTART: 'translatestart',
  /**
   * Triggered upon feature translation.
   * @event ol.interaction.Translate.Event#translating
   * @api
   */
  TRANSLATING: 'translating',
  /**
   * Triggered upon feature translation end.
   * @event ol.interaction.Translate.Event#translateend
   * @api
   */
  TRANSLATEEND: 'translateend'
};
