goog.provide('ol.interaction.Rotate');

goog.require('ol');
goog.require('ol.Collection');
goog.require('ol.array');
goog.require('ol.events.Event');
goog.require('ol.events.condition');
goog.require('ol.extent');
goog.require('ol.functions');
goog.require('ol.interaction.Pointer');

/**
 * @classdesc
 * Interaction for rotating features.
 *
 * @constructor
 * @extends {ol.interaction.Pointer}
 * @fires ol.interaction.Rotate.Event
 * @param {olx.interaction.RotateOptions} options Options.
 * @api
 */
ol.interaction.Rotate = function(options) {
  ol.interaction.Pointer.call(this, {
    handleDownEvent: ol.interaction.Rotate.handleDownEvent_,
    handleDragEvent: ol.interaction.Rotate.handleDragEvent_,
    handleUpEvent: ol.interaction.Rotate.handleUpEvent_
  });

  /**
   * @type {ol.EventsConditionType}
   * @private
   */
  this.condition_ = options.condition ?
      options.condition : ol.events.condition.always;

  /**
   * @type {ol.EventsConditionType}
   * @private
   */
  this.customAnchorCondition_ = options.customAnchorCondition ?
      options.customAnchorCondition : ol.events.condition.never;

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
   * @type {function(ol.layer.Layer): boolean}
   * @private
   */
  this.layerFilter_ = layerFilter;

  /**
   * @private
   * @type {number}
   */
  this.hitTolerance_ = options.hitTolerance ? options.hitTolerance : 0;
  /**
   * @type {ol.EventsConditionType}
   * @private
   */
  this.rotateByStepCondition_ = options.rotateByStepCondition ?
      options.rotateByStepCondition : ol.events.condition.platformModifierKeyOnly;

  /**
   * @type {number}
   * @private
   */
  this.step_ = options.step !== undefined ? options.step : Math.PI / 8;

  /**
   * @type {ol.Coordinate}
   * @private
   */
  this.lastAnchor_ = null;

  /**
   * @type {number}
   * @private
   */
  this.lastAngle_ = 0;

  /**
   * @type {ol.Feature}
   * @private
   */
  this.lastFeature_ = null;

  /**
   * @type {boolean}
   * @private
   */
  this.rotatingFeature_ = false;
};
ol.inherits(ol.interaction.Rotate, ol.interaction.Pointer);


/**
 * @param {ol.MapBrowserPointerEvent} event Event.
 * @return {boolean} Start drag sequence?
 * @this {ol.interaction.Rotate}
 * @private
 */
ol.interaction.Rotate.handleDownEvent_ = function(event) {
  if (!this.condition_(event)) {
    return false;
  }

  this.lastFeature_ = this.featuresAtPixel_(event.pixel, event.map);
  if (!this.lastAnchor_ && this.lastFeature_) {
    var customAnchor = this.customAnchorCondition_(event);

    if (customAnchor) {
      this.lastAnchor_ = event.coordinate;
    } else {
      this.lastAnchor_ = ol.extent.getCenter(
          this.lastFeature_.getGeometry().getExtent());
    }

    this.lastAngle_ = this.getRotateAngle_(event.coordinate, this.lastAnchor_,
        true);

    var features = this.features_ || new ol.Collection([this.lastFeature_]);

    this.dispatchEvent(
        new ol.interaction.Rotate.Event(
            ol.interaction.Rotate.EventType_.ROTATESTART, features,
            event.coordinate));
    return true;
  }
  return false;
};


/**
 * @param {ol.MapBrowserPointerEvent} event Event.
 * @return {boolean} Stop drag sequence?
 * @this {ol.interaction.Rotate}
 * @private
 */
ol.interaction.Rotate.handleUpEvent_ = function(event) {
  if (this.lastAnchor_) {
    this.lastAnchor_ = null;

    var features = this.features_ || new ol.Collection([this.lastFeature_]);

    this.dispatchEvent(
        new ol.interaction.Rotate.Event(
            ol.interaction.Rotate.EventType_.ROTATEEND, features,
            event.coordinate));
    return true;
  }
  return false;
};


/**
 * @param {ol.MapBrowserPointerEvent} event Event.
 * @this {ol.interaction.Rotate}
 * @private
 */
ol.interaction.Rotate.handleDragEvent_ = function(event) {
  if (this.lastAnchor_) {
    var newCoordinate = event.coordinate;

    var newAngle = this.getRotateAngle_(newCoordinate, this.lastAnchor_,
        this.rotateByStepCondition_(event));

    var deltaAngle = newAngle - this.lastAngle_;
    var anchor = this.lastAnchor_;

    var features = this.features_ || new ol.Collection([this.lastFeature_]);

    this.rotatingFeature_ = true;
    features.forEach(function(feature) {
      var geom = feature.getGeometry();
      geom.rotate(deltaAngle, anchor);
      feature.setGeometry(geom);
    });
    this.rotatingFeature_ = false;

    this.lastAngle_ = newAngle;
    this.dispatchEvent(
        new ol.interaction.Rotate.Event(
            ol.interaction.Rotate.EventType_.ROTATING, features,
            newCoordinate));
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
ol.interaction.Rotate.prototype.featuresAtPixel_ = function(pixel, map) {
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
ol.interaction.Rotate.prototype.getHitTolerance = function() {
  return this.hitTolerance_;
};


/**
 * Hit-detection tolerance. Pixels inside the radius around the given position
 * will be checked for features. This only works for the canvas renderer and
 * not for WebGL.
 * @param {number} hitTolerance Hit tolerance in pixels.
 * @api
 */
ol.interaction.Rotate.prototype.setHitTolerance = function(hitTolerance) {
  this.hitTolerance_ = hitTolerance;
};


/**
 * @param {ol.Coordinate} pointer Current pointer coordinate
 * @param {ol.Coordinate} anchor Anchor coordinate
 * @param {boolean} byStep Limit angle by steps
 * @return {number} The angle
 * @private
 */
ol.interaction.Rotate.prototype.getRotateAngle_ = function(pointer, anchor,
    byStep) {
  var angle = Math.atan2(pointer[1] - anchor[1],
      pointer[0] - anchor[0]);

  if (byStep) {
    var step = this.step_;
    angle = Math.round(angle / step) * step;
  }

  return angle;
};


/**
 * @classdesc
 * Events emitted by {@link ol.interaction.Rotate} instances are instances of
 * this type.
 *
 * @constructor
 * @extends {ol.events.Event}
 * @implements {oli.interaction.RotateEvent}
 * @param {ol.interaction.Rotate.EventType_} type Type.
 * @param {ol.Collection.<ol.Feature>} features The features rotated.
 * @param {ol.Coordinate} coordinate The event coordinate.
 */
ol.interaction.Rotate.Event = function(type, features, coordinate) {

  ol.events.Event.call(this, type);

  /**
   * The features being rotated.
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
ol.inherits(ol.interaction.Rotate.Event, ol.events.Event);


/**
 * @enum {string}
 * @private
 */
ol.interaction.Rotate.EventType_ = {
  /**
   * Triggered upon feature rotation start.
   * @event ol.interaction.Rotate.Event#rotatestart
   * @api
   */
  ROTATESTART: 'rotatestart',
  /**
   * Triggered upon feature rotation.
   * @event ol.interaction.Rotate.Event#rotating
   * @api
   */
  ROTATING: 'rotating',
  /**
   * Triggered upon feature rotation end.
   * @event ol.interaction.Rotate.Event#rotateend
   * @api
   */
  ROTATEEND: 'rotateend'
};
