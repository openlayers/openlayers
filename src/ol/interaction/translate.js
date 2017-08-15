goog.provide('ol.interaction.Translate');

goog.require('ol');
goog.require('ol.Collection');
goog.require('ol.Object');
goog.require('ol.events');
goog.require('ol.events.Event');
goog.require('ol.functions');
goog.require('ol.array');
goog.require('ol.interaction.Pointer');
goog.require('ol.interaction.Property');
goog.require('ol.interaction.TranslateEventType');


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

  ol.events.listen(this,
      ol.Object.getChangeEventType(ol.interaction.Property.ACTIVE),
      this.handleActiveChanged_, this);

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
            ol.interaction.TranslateEventType.TRANSLATESTART, features,
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
            ol.interaction.TranslateEventType.TRANSLATEEND, features,
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
            ol.interaction.TranslateEventType.TRANSLATING, features,
            newCoordinate));
  }
};


/**
 * @param {ol.MapBrowserEvent} event Event.
 * @this {ol.interaction.Translate}
 * @private
 */
ol.interaction.Translate.handleMoveEvent_ = function(event) {
  var elem = event.map.getViewport();

  // Change the cursor to grab/grabbing if hovering any of the features managed
  // by the interaction
  if (this.featuresAtPixel_(event.pixel, event.map)) {
    elem.classList.remove(this.lastCoordinate_ ? 'ol-grab' : 'ol-grabbing');
    elem.classList.add(this.lastCoordinate_ ? 'ol-grabbing' : 'ol-grab');
  } else {
    elem.classList.remove('ol-grab', 'ol-grabbing');
  }
};


/**
 * Tests to see if the given coordinates intersects any of our selected
 * features.
 * @param {ol.Pixel} pixel Pixel coordinate to test for intersection.
 * @param {ol.PluggableMap} map Map to test the intersection on.
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
 * @inheritDoc
 */
ol.interaction.Translate.prototype.setMap = function(map) {
  var oldMap = this.getMap();
  ol.interaction.Pointer.prototype.setMap.call(this, map);
  this.updateState_(oldMap);
};


/**
 * @private
 */
ol.interaction.Translate.prototype.handleActiveChanged_ = function() {
  this.updateState_(null);
};


/**
 * @param {ol.PluggableMap} oldMap Old map.
 * @private
 */
ol.interaction.Translate.prototype.updateState_ = function(oldMap) {
  var map = this.getMap();
  var active = this.getActive();
  if (!map || !active) {
    map = map || oldMap;
    if (map) {
      var elem = map.getViewport();
      elem.classList.remove('ol-grab', 'ol-grabbing');
    }
  }
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
