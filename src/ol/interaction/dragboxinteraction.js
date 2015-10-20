// FIXME draw drag box
goog.provide('ol.DragBoxEvent');
goog.provide('ol.interaction.DragBox');

goog.require('goog.events.Event');
goog.require('ol');
goog.require('ol.events.ConditionType');
goog.require('ol.events.condition');
goog.require('ol.interaction.Pointer');
goog.require('ol.render.Box');


/**
 * @const
 * @type {number}
 */
ol.DRAG_BOX_HYSTERESIS_PIXELS_SQUARED =
    ol.DRAG_BOX_HYSTERESIS_PIXELS *
    ol.DRAG_BOX_HYSTERESIS_PIXELS;


/**
 * @enum {string}
 */
ol.DragBoxEventType = {
  /**
   * Triggered upon drag box start.
   * @event ol.DragBoxEvent#boxstart
   * @api stable
   */
  BOXSTART: 'boxstart',
  /**
   * Triggered upon drag box end.
   * @event ol.DragBoxEvent#boxend
   * @api stable
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
 * @extends {goog.events.Event}
 * @constructor
 * @implements {oli.DragBoxEvent}
 */
ol.DragBoxEvent = function(type, coordinate) {
  goog.base(this, type);

  /**
   * The coordinate of the drag event.
   * @const
   * @type {ol.Coordinate}
   * @api stable
   */
  this.coordinate = coordinate;

};
goog.inherits(ol.DragBoxEvent, goog.events.Event);



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
 * @fires ol.DragBoxEvent
 * @param {olx.interaction.DragBoxOptions=} opt_options Options.
 * @api stable
 */
ol.interaction.DragBox = function(opt_options) {

  goog.base(this, {
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
   * @type {ol.Pixel}
   * @private
   */
  this.startPixel_ = null;

  /**
   * @private
   * @type {ol.events.ConditionType}
   */
  this.condition_ = options.condition ?
      options.condition : ol.events.condition.always;

};
goog.inherits(ol.interaction.DragBox, ol.interaction.Pointer);


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
};


/**
 * Returns geometry of last drawn box.
 * @return {ol.geom.Polygon} Geometry.
 * @api stable
 */
ol.interaction.DragBox.prototype.getGeometry = function() {
  return this.box_.getGeometry();
};


/**
 * To be overriden by child classes.
 * FIXME: use constructor option instead of relying on overridding.
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

  var deltaX = mapBrowserEvent.pixel[0] - this.startPixel_[0];
  var deltaY = mapBrowserEvent.pixel[1] - this.startPixel_[1];

  if (deltaX * deltaX + deltaY * deltaY >=
      ol.DRAG_BOX_HYSTERESIS_PIXELS_SQUARED) {
    this.onBoxEnd(mapBrowserEvent);
    this.dispatchEvent(new ol.DragBoxEvent(ol.DragBoxEventType.BOXEND,
        mapBrowserEvent.coordinate));
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

  var browserEvent = mapBrowserEvent.browserEvent;
  if (browserEvent.isMouseActionButton() && this.condition_(mapBrowserEvent)) {
    this.startPixel_ = mapBrowserEvent.pixel;
    this.box_.setMap(mapBrowserEvent.map);
    this.box_.setPixels(this.startPixel_, this.startPixel_);
    this.dispatchEvent(new ol.DragBoxEvent(ol.DragBoxEventType.BOXSTART,
        mapBrowserEvent.coordinate));
    return true;
  } else {
    return false;
  }
};
