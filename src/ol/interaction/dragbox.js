// FIXME draw drag box
import _ol_events_Event_ from '../events/event';
import _ol_ from '../index';
import _ol_events_condition_ from '../events/condition';
import _ol_interaction_Pointer_ from '../interaction/pointer';
import _ol_render_Box_ from '../render/box';

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
var _ol_interaction_DragBox_ = function(opt_options) {

  _ol_interaction_Pointer_.call(this, {
    handleDownEvent: _ol_interaction_DragBox_.handleDownEvent_,
    handleDragEvent: _ol_interaction_DragBox_.handleDragEvent_,
    handleUpEvent: _ol_interaction_DragBox_.handleUpEvent_
  });

  var options = opt_options ? opt_options : {};

  /**
   * @type {ol.render.Box}
   * @private
   */
  this.box_ = new _ol_render_Box_(options.className || 'ol-dragbox');

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
    options.condition : _ol_events_condition_.always;

  /**
   * @private
   * @type {ol.DragBoxEndConditionType}
   */
  this.boxEndCondition_ = options.boxEndCondition ?
    options.boxEndCondition : _ol_interaction_DragBox_.defaultBoxEndCondition;
};

_ol_.inherits(_ol_interaction_DragBox_, _ol_interaction_Pointer_);


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
_ol_interaction_DragBox_.defaultBoxEndCondition = function(mapBrowserEvent, startPixel, endPixel) {
  var width = endPixel[0] - startPixel[0];
  var height = endPixel[1] - startPixel[1];
  return width * width + height * height >= this.minArea_;
};


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @this {ol.interaction.DragBox}
 * @private
 */
_ol_interaction_DragBox_.handleDragEvent_ = function(mapBrowserEvent) {
  if (!_ol_events_condition_.mouseOnly(mapBrowserEvent)) {
    return;
  }

  this.box_.setPixels(this.startPixel_, mapBrowserEvent.pixel);

  this.dispatchEvent(new _ol_interaction_DragBox_.Event(_ol_interaction_DragBox_.EventType_.BOXDRAG,
      mapBrowserEvent.coordinate, mapBrowserEvent));
};


/**
 * Returns geometry of last drawn box.
 * @return {ol.geom.Polygon} Geometry.
 * @api
 */
_ol_interaction_DragBox_.prototype.getGeometry = function() {
  return this.box_.getGeometry();
};


/**
 * To be overridden by child classes.
 * FIXME: use constructor option instead of relying on overriding.
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @protected
 */
_ol_interaction_DragBox_.prototype.onBoxEnd = _ol_.nullFunction;


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Stop drag sequence?
 * @this {ol.interaction.DragBox}
 * @private
 */
_ol_interaction_DragBox_.handleUpEvent_ = function(mapBrowserEvent) {
  if (!_ol_events_condition_.mouseOnly(mapBrowserEvent)) {
    return true;
  }

  this.box_.setMap(null);

  if (this.boxEndCondition_(mapBrowserEvent,
      this.startPixel_, mapBrowserEvent.pixel)) {
    this.onBoxEnd(mapBrowserEvent);
    this.dispatchEvent(new _ol_interaction_DragBox_.Event(_ol_interaction_DragBox_.EventType_.BOXEND,
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
_ol_interaction_DragBox_.handleDownEvent_ = function(mapBrowserEvent) {
  if (!_ol_events_condition_.mouseOnly(mapBrowserEvent)) {
    return false;
  }

  if (_ol_events_condition_.mouseActionButton(mapBrowserEvent) &&
      this.condition_(mapBrowserEvent)) {
    this.startPixel_ = mapBrowserEvent.pixel;
    this.box_.setMap(mapBrowserEvent.map);
    this.box_.setPixels(this.startPixel_, this.startPixel_);
    this.dispatchEvent(new _ol_interaction_DragBox_.Event(_ol_interaction_DragBox_.EventType_.BOXSTART,
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
_ol_interaction_DragBox_.EventType_ = {
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
_ol_interaction_DragBox_.Event = function(type, coordinate, mapBrowserEvent) {
  _ol_events_Event_.call(this, type);

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
_ol_.inherits(_ol_interaction_DragBox_.Event, _ol_events_Event_);
export default _ol_interaction_DragBox_;
