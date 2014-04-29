// FIXME draw drag box
// FIXME works for View2D only

goog.provide('ol.DragBoxEvent');
goog.provide('ol.interaction.DragBox');

goog.require('goog.asserts');
goog.require('goog.events.Event');
goog.require('goog.functions');
goog.require('ol.events.ConditionType');
goog.require('ol.events.condition');
goog.require('ol.interaction.Pointer');
goog.require('ol.render.Box');


/**
 * @define {number} Hysterisis pixels.
 */
ol.DRAG_BOX_HYSTERESIS_PIXELS = 8;


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
   * @todo api
   */
  BOXSTART: 'boxstart',
  /**
   * Triggered upon drag box end.
   * @event ol.DragBoxEvent#boxstart
   * @todo api
   */
  BOXEND: 'boxend'
};



/**
 * Object representing a dragbox event.
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
   */
  this.coordinate = coordinate;

};
goog.inherits(ol.DragBoxEvent, goog.events.Event);



/**
 * Allows the user to zoom the map by clicking and dragging on the map,
 * normally combined with an {@link ol.events.condition} that limits
 * it to when the shift key is held down.
 *
 * This interaction is only supported for mouse devices.
 *
 * @constructor
 * @extends {ol.interaction.Pointer}
 * @fires {@link ol.DragBoxEvent} ol.DragBoxEvent
 * @param {olx.interaction.DragBoxOptions=} opt_options Options.
 * @todo api
 */
ol.interaction.DragBox = function(opt_options) {

  goog.base(this);

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @private
   * @type {ol.style.Style}
   */
  var style = goog.isDef(options.style) ? options.style : null;

  /**
   * @type {ol.render.Box}
   * @private
   */
  this.box_ = new ol.render.Box(style);

  /**
   * @type {ol.Pixel}
   * @private
   */
  this.startPixel_ = null;

  /**
   * @private
   * @type {ol.events.ConditionType}
   */
  this.condition_ = goog.isDef(options.condition) ?
      options.condition : ol.events.condition.always;

};
goog.inherits(ol.interaction.DragBox, ol.interaction.Pointer);


/**
 * @inheritDoc
 */
ol.interaction.DragBox.prototype.handlePointerDrag = function(mapBrowserEvent) {
  if (!ol.events.condition.mouseOnly(mapBrowserEvent)) {
    return;
  }

  this.box_.setPixels(this.startPixel_, mapBrowserEvent.pixel);
};


/**
 * Returns geometry of last drawn box.
 * @return {ol.geom.Geometry} Geometry.
 * @todo api
 */
ol.interaction.DragBox.prototype.getGeometry = function() {
  return this.box_.getGeometry();
};


/**
 * To be overriden by child classes.
 * @protected
 */
ol.interaction.DragBox.prototype.onBoxEnd = goog.nullFunction;


/**
 * @inheritDoc
 */
ol.interaction.DragBox.prototype.handlePointerUp =
    function(mapBrowserEvent) {
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
 * @inheritDoc
 */
ol.interaction.DragBox.prototype.handlePointerDown =
    function(mapBrowserEvent) {
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


/**
 * @inheritDoc
 */
ol.interaction.DragBox.prototype.shouldStopEvent = goog.functions.identity;
