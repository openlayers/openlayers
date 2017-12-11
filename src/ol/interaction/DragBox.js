// FIXME draw drag box
goog.provide('ol.interaction.DragBox');

goog.require('ol.events.Event');
goog.require('ol');
goog.require('ol.events.condition');
goog.require('ol.interaction.Pointer');
goog.require('ol.render.Box');


/**
 * @classdesc
 * Allows the user to draw a vector box by clicking and dragging on the map,
 * normally combined with an {@link ol.events.condition} that limits
 * it to when the shift or other key is held down. This is used, for example,
 * for zooming to a specific area of the map
 * (see {@link ol.interaction.DragZoom} and
 * {@link ol.interaction.DragRotateAndZoom}).
 *
 * This interaction is only supported for mouse devices.
 *
 * @constructor
 * @extends {ol.interaction.Pointer}
 * @fires ol.interaction.DragBox.Event
 * @param {olx.interaction.DragBoxOptions=} opt_options Options.
 * @api
 */
ol.interaction.DragBox = function(opt_options) {

  ol.interaction.Pointer.call(this, {
    handleDownEvent: ol.interaction.DragBox.handleDownEvent_,
    handleDragEvent: ol.interaction.DragBox.handleDragEvent_,
    handleUpEvent: ol.interaction.DragBox.handleUpEvent_
  });

  var options = opt_options ? opt_options : {};

  /**
   * @type {ol.render.Box}
   * @private
   */
  this.box_ = new ol.render.Box(options.className || 'ol-dragbox');

  /**
   * @type {number}
   * @private
   */
  this.minArea_ = options.minArea !== undefined ? options.minArea : 64;

  /**
   * @type {ol.Pixel}
   * @private
   */
  this.startPixel_ = null;

  /**
   * @private
   * @type {ol.EventsConditionType}
   */
  this.condition_ = options.condition ?
    options.condition : ol.events.condition.always;

  /**
   * @private
   * @type {ol.DragBoxEndConditionType}
   */
  this.boxEndCondition_ = options.boxEndCondition ?
    options.boxEndCondition : ol.interaction.DragBox.defaultBoxEndCondition;
};
ol.inherits(ol.interaction.DragBox, ol.interaction.Pointer);


/**
 * The default condition for determining whether the boxend event
 * should fire.
 * @param {ol.MapBrowserEvent} mapBrowserEvent The originating MapBrowserEvent
 *     leading to the box end.
 * @param {ol.Pixel} startPixel The starting pixel of the box.
 * @param {ol.Pixel} endPixel The end pixel of the box.
 * @return {boolean} Whether or not the boxend condition should be fired.
 * @this {ol.interaction.DragBox}
 */
ol.interaction.DragBox.defaultBoxEndCondition = function(mapBrowserEvent, startPixel, endPixel) {
  var width = endPixel[0] - startPixel[0];
  var height = endPixel[1] - startPixel[1];
  return width * width + height * height >= this.minArea_;
};


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @this {ol.interaction.DragBox}
 * @private
 */
ol.interaction.DragBox.handleDragEvent_ = function(mapBrowserEvent) {
  if (!ol.events.condition.mouseOnly(mapBrowserEvent)) {
    return;
  }

  this.box_.setPixels(this.startPixel_, mapBrowserEvent.pixel);

  this.dispatchEvent(new ol.interaction.DragBox.Event(ol.interaction.DragBox.EventType_.BOXDRAG,
      mapBrowserEvent.coordinate, mapBrowserEvent));
};


/**
 * Returns geometry of last drawn box.
 * @return {ol.geom.Polygon} Geometry.
 * @api
 */
ol.interaction.DragBox.prototype.getGeometry = function() {
  return this.box_.getGeometry();
};


/**
 * To be overridden by child classes.
 * FIXME: use constructor option instead of relying on overriding.
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @protected
 */
ol.interaction.DragBox.prototype.onBoxEnd = ol.nullFunction;


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Stop drag sequence?
 * @this {ol.interaction.DragBox}
 * @private
 */
ol.interaction.DragBox.handleUpEvent_ = function(mapBrowserEvent) {
  if (!ol.events.condition.mouseOnly(mapBrowserEvent)) {
    return true;
  }

  this.box_.setMap(null);

  if (this.boxEndCondition_(mapBrowserEvent,
      this.startPixel_, mapBrowserEvent.pixel)) {
    this.onBoxEnd(mapBrowserEvent);
    this.dispatchEvent(new ol.interaction.DragBox.Event(ol.interaction.DragBox.EventType_.BOXEND,
        mapBrowserEvent.coordinate, mapBrowserEvent));
  }
  return false;
};


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Start drag sequence?
 * @this {ol.interaction.DragBox}
 * @private
 */
ol.interaction.DragBox.handleDownEvent_ = function(mapBrowserEvent) {
  if (!ol.events.condition.mouseOnly(mapBrowserEvent)) {
    return false;
  }

  if (ol.events.condition.mouseActionButton(mapBrowserEvent) &&
      this.condition_(mapBrowserEvent)) {
    this.startPixel_ = mapBrowserEvent.pixel;
    this.box_.setMap(mapBrowserEvent.map);
    this.box_.setPixels(this.startPixel_, this.startPixel_);
    this.dispatchEvent(new ol.interaction.DragBox.Event(ol.interaction.DragBox.EventType_.BOXSTART,
        mapBrowserEvent.coordinate, mapBrowserEvent));
    return true;
  } else {
    return false;
  }
};


/**
 * @enum {string}
 * @private
 */
ol.interaction.DragBox.EventType_ = {
  /**
   * Triggered upon drag box start.
   * @event ol.interaction.DragBox.Event#boxstart
   * @api
   */
  BOXSTART: 'boxstart',

  /**
   * Triggered on drag when box is active.
   * @event ol.interaction.DragBox.Event#boxdrag
   * @api
   */
  BOXDRAG: 'boxdrag',

  /**
   * Triggered upon drag box end.
   * @event ol.interaction.DragBox.Event#boxend
   * @api
   */
  BOXEND: 'boxend'
};


/**
 * @classdesc
 * Events emitted by {@link ol.interaction.DragBox} instances are instances of
 * this type.
 *
 * @param {string} type The event type.
 * @param {ol.Coordinate} coordinate The event coordinate.
 * @param {ol.MapBrowserEvent} mapBrowserEvent Originating event.
 * @extends {ol.events.Event}
 * @constructor
 * @implements {oli.DragBoxEvent}
 */
ol.interaction.DragBox.Event = function(type, coordinate, mapBrowserEvent) {
  ol.events.Event.call(this, type);

  /**
   * The coordinate of the drag event.
   * @const
   * @type {ol.Coordinate}
   * @api
   */
  this.coordinate = coordinate;

  /**
   * @const
   * @type {ol.MapBrowserEvent}
   * @api
   */
  this.mapBrowserEvent = mapBrowserEvent;

};
ol.inherits(ol.interaction.DragBox.Event, ol.events.Event);
