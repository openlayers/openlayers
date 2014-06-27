goog.provide('ol.interaction.Pointer');

goog.require('goog.asserts');
goog.require('goog.functions');
goog.require('goog.object');
goog.require('ol.MapBrowserEvent');
goog.require('ol.MapBrowserEvent.EventType');
goog.require('ol.MapBrowserPointerEvent');
goog.require('ol.Pixel');
goog.require('ol.interaction.Interaction');



/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 *
 * @constructor
 * @extends {ol.interaction.Interaction}
 */
ol.interaction.Pointer = function() {

  goog.base(this);

  /**
   * @type {boolean}
   * @protected
   */
  this.handlingDownUpSequence = false;

  /**
   * @type {Object.<number, ol.pointer.PointerEvent>}
   * @private
   */
  this.trackedPointers_ = {};

  /**
   * @type {Array.<ol.pointer.PointerEvent>}
   * @protected
   */
  this.targetPointers = [];

};
goog.inherits(ol.interaction.Pointer, ol.interaction.Interaction);


/**
 * @param {Array.<ol.pointer.PointerEvent>} pointerEvents
 * @return {ol.Pixel} Centroid pixel.
 */
ol.interaction.Pointer.centroid = function(pointerEvents) {
  var length = pointerEvents.length;
  var clientX = 0;
  var clientY = 0;
  for (var i = 0; i < length; i++) {
    clientX += pointerEvents[i].clientX;
    clientY += pointerEvents[i].clientY;
  }
  return [clientX / length, clientY / length];
};


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Whether the event is a pointerdown, pointerdrag
 *     or pointerup event.
 * @private
 */
ol.interaction.Pointer.prototype.isPointerDraggingEvent_ =
    function(mapBrowserEvent) {
  var type = mapBrowserEvent.type;
  return (
      type === ol.MapBrowserEvent.EventType.POINTERDOWN ||
      type === ol.MapBrowserEvent.EventType.POINTERDRAG ||
      type === ol.MapBrowserEvent.EventType.POINTERUP);
};


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @private
 */
ol.interaction.Pointer.prototype.updateTrackedPointers_ =
    function(mapBrowserEvent) {
  if (this.isPointerDraggingEvent_(mapBrowserEvent)) {
    var event = mapBrowserEvent.pointerEvent;

    if (mapBrowserEvent.type == ol.MapBrowserEvent.EventType.POINTERUP) {
      delete this.trackedPointers_[event.pointerId];
    } else if (mapBrowserEvent.type ==
        ol.MapBrowserEvent.EventType.POINTERDOWN) {
      this.trackedPointers_[event.pointerId] = event;
    } else if (event.pointerId in this.trackedPointers_) {
      // update only when there was a pointerdown event for this pointer
      this.trackedPointers_[event.pointerId] = event;
    }
    this.targetPointers = goog.object.getValues(this.trackedPointers_);
  }
};


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @protected
 */
ol.interaction.Pointer.prototype.handlePointerDrag = goog.nullFunction;


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @protected
 * @return {boolean} Capture dragging.
 */
ol.interaction.Pointer.prototype.handlePointerUp = goog.functions.FALSE;


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @protected
 * @return {boolean} Capture dragging.
 */
ol.interaction.Pointer.prototype.handlePointerDown = goog.functions.FALSE;


/**
 * @inheritDoc
 */
ol.interaction.Pointer.prototype.handleMapBrowserEvent =
    function(mapBrowserEvent) {
  if (!(mapBrowserEvent instanceof ol.MapBrowserPointerEvent)) {
    return true;
  }

  var stopEvent = false;
  this.updateTrackedPointers_(mapBrowserEvent);
  if (this.handlingDownUpSequence) {
    if (mapBrowserEvent.type ==
        ol.MapBrowserEvent.EventType.POINTERDRAG) {
      this.handlePointerDrag(mapBrowserEvent);
    } else if (mapBrowserEvent.type ==
        ol.MapBrowserEvent.EventType.POINTERUP) {
      this.handlingDownUpSequence =
          this.handlePointerUp(mapBrowserEvent);
    }
  }
  if (mapBrowserEvent.type == ol.MapBrowserEvent.EventType.POINTERDOWN) {
    var handled = this.handlePointerDown(mapBrowserEvent);
    this.handlingDownUpSequence = handled;
    stopEvent = this.shouldStopEvent(handled);
  }
  return !stopEvent;
};


/**
 * This method allows inheriting classes to stop the event from being
 * passed to further interactions. For example, this is required for
 * interaction `DragRotateAndZoom`.
 *
 * @protected
 * @param {boolean} handled Was the event handled by the interaction?
 * @return {boolean} Should the event be stopped?
 */
ol.interaction.Pointer.prototype.shouldStopEvent = goog.functions.FALSE;
