/**
 * @module ol/interaction/DragBox
 */
// FIXME draw drag box
import Event from '../events/Event.js';
import {inherits} from '../util.js';
import {always, mouseOnly, mouseActionButton} from '../events/condition.js';
import {UNDEFINED} from '../functions.js';
import PointerInteraction from '../interaction/Pointer.js';
import RenderBox from '../render/Box.js';


/**
 * A function that takes a {@link module:ol/MapBrowserEvent} and two
 * {@link module:ol~Pixel}s and returns a `{boolean}`. If the condition is met,
 * true should be returned.
 * @typedef {function(this: ?, module:ol/MapBrowserEvent, module:ol~Pixel, module:ol~Pixel):boolean} EndCondition
 */


/**
 * @typedef {Object} Options
 * @property {string} [className='ol-dragbox'] CSS class name for styling the box.
 * @property {module:ol/events/condition~Condition} [condition] A function that takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * Default is {@link ol/events/condition~always}.
 * @property {number} [minArea=64] The minimum area of the box in pixel, this value is used by the default
 * `boxEndCondition` function.
 * @property {module:ol/interaction/DragBox~EndCondition} [boxEndCondition] A function that takes a {@link module:ol/MapBrowserEvent~MapBrowserEvent} and two
 * {@link module:ol~Pixel}s to indicate whether a `boxend` event should be fired.
 * Default is `true` if the area of the box is bigger than the `minArea` option.
 */


/**
 * @enum {string}
 */
const DragBoxEventType = {
  /**
   * Triggered upon drag box start.
   * @event module:ol/interaction/DragBox~DragBoxEvent#boxstart
   * @api
   */
  BOXSTART: 'boxstart',

  /**
   * Triggered on drag when box is active.
   * @event module:ol/interaction/DragBox~DragBoxEvent#boxdrag
   * @api
   */
  BOXDRAG: 'boxdrag',

  /**
   * Triggered upon drag box end.
   * @event module:ol/interaction/DragBox~DragBoxEvent#boxend
   * @api
   */
  BOXEND: 'boxend'
};


/**
 * @classdesc
 * Events emitted by {@link module:ol/interaction/DragBox~DragBox} instances are instances of
 * this type.
 *
 * @param {string} type The event type.
 * @param {module:ol/coordinate~Coordinate} coordinate The event coordinate.
 * @param {module:ol/MapBrowserEvent} mapBrowserEvent Originating event.
 * @extends {module:ol/events/Event}
 * @constructor
 */
const DragBoxEvent = function(type, coordinate, mapBrowserEvent) {
  Event.call(this, type);

  /**
   * The coordinate of the drag event.
   * @const
   * @type {module:ol/coordinate~Coordinate}
   * @api
   */
  this.coordinate = coordinate;

  /**
   * @const
   * @type {module:ol/MapBrowserEvent}
   * @api
   */
  this.mapBrowserEvent = mapBrowserEvent;

};

inherits(DragBoxEvent, Event);


/**
 * @classdesc
 * Allows the user to draw a vector box by clicking and dragging on the map,
 * normally combined with an {@link module:ol/events/condition} that limits
 * it to when the shift or other key is held down. This is used, for example,
 * for zooming to a specific area of the map
 * (see {@link module:ol/interaction/DragZoom~DragZoom} and
 * {@link module:ol/interaction/DragRotateAndZoom}).
 *
 * This interaction is only supported for mouse devices.
 *
 * @constructor
 * @extends {module:ol/interaction/Pointer}
 * @fires module:ol/interaction/DragBox~DragBoxEvent
 * @param {module:ol/interaction/DragBox~Options=} opt_options Options.
 * @api
 */
const DragBox = function(opt_options) {

  PointerInteraction.call(this, {
    handleDownEvent: handleDownEvent,
    handleDragEvent: handleDragEvent,
    handleUpEvent: handleUpEvent
  });

  const options = opt_options ? opt_options : {};

  /**
   * @type {module:ol/render/Box}
   * @private
   */
  this.box_ = new RenderBox(options.className || 'ol-dragbox');

  /**
   * @type {number}
   * @private
   */
  this.minArea_ = options.minArea !== undefined ? options.minArea : 64;

  /**
   * @type {module:ol~Pixel}
   * @private
   */
  this.startPixel_ = null;

  /**
   * @private
   * @type {module:ol/events/condition~Condition}
   */
  this.condition_ = options.condition ? options.condition : always;

  /**
   * @private
   * @type {module:ol/interaction/DragBox~EndCondition}
   */
  this.boxEndCondition_ = options.boxEndCondition ?
    options.boxEndCondition : defaultBoxEndCondition;
};

inherits(DragBox, PointerInteraction);


/**
 * The default condition for determining whether the boxend event
 * should fire.
 * @param {module:ol/MapBrowserEvent} mapBrowserEvent The originating MapBrowserEvent
 *     leading to the box end.
 * @param {module:ol~Pixel} startPixel The starting pixel of the box.
 * @param {module:ol~Pixel} endPixel The end pixel of the box.
 * @return {boolean} Whether or not the boxend condition should be fired.
 * @this {module:ol/interaction/DragBox}
 */
function defaultBoxEndCondition(mapBrowserEvent, startPixel, endPixel) {
  const width = endPixel[0] - startPixel[0];
  const height = endPixel[1] - startPixel[1];
  return width * width + height * height >= this.minArea_;
}


/**
 * @param {module:ol/MapBrowserPointerEvent} mapBrowserEvent Event.
 * @this {module:ol/interaction/DragBox}
 */
function handleDragEvent(mapBrowserEvent) {
  if (!mouseOnly(mapBrowserEvent)) {
    return;
  }

  this.box_.setPixels(this.startPixel_, mapBrowserEvent.pixel);

  this.dispatchEvent(new DragBoxEvent(DragBoxEventType.BOXDRAG,
    mapBrowserEvent.coordinate, mapBrowserEvent));
}


/**
 * Returns geometry of last drawn box.
 * @return {module:ol/geom/Polygon} Geometry.
 * @api
 */
DragBox.prototype.getGeometry = function() {
  return this.box_.getGeometry();
};


/**
 * To be overridden by child classes.
 * FIXME: use constructor option instead of relying on overriding.
 * @param {module:ol/MapBrowserEvent} mapBrowserEvent Map browser event.
 * @protected
 */
DragBox.prototype.onBoxEnd = UNDEFINED;


/**
 * @param {module:ol/MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Stop drag sequence?
 * @this {module:ol/interaction/DragBox}
 */
function handleUpEvent(mapBrowserEvent) {
  if (!mouseOnly(mapBrowserEvent)) {
    return true;
  }

  this.box_.setMap(null);

  if (this.boxEndCondition_(mapBrowserEvent,
    this.startPixel_, mapBrowserEvent.pixel)) {
    this.onBoxEnd(mapBrowserEvent);
    this.dispatchEvent(new DragBoxEvent(DragBoxEventType.BOXEND,
      mapBrowserEvent.coordinate, mapBrowserEvent));
  }
  return false;
}


/**
 * @param {module:ol/MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Start drag sequence?
 * @this {module:ol/interaction/DragBox}
 */
function handleDownEvent(mapBrowserEvent) {
  if (!mouseOnly(mapBrowserEvent)) {
    return false;
  }

  if (mouseActionButton(mapBrowserEvent) &&
      this.condition_(mapBrowserEvent)) {
    this.startPixel_ = mapBrowserEvent.pixel;
    this.box_.setMap(mapBrowserEvent.map);
    this.box_.setPixels(this.startPixel_, this.startPixel_);
    this.dispatchEvent(new DragBoxEvent(DragBoxEventType.BOXSTART,
      mapBrowserEvent.coordinate, mapBrowserEvent));
    return true;
  } else {
    return false;
  }
}


export default DragBox;
