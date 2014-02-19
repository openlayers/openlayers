goog.provide('ol.interaction.PointerInteraction');

goog.require('goog.asserts');
goog.require('goog.functions');
goog.require('goog.object');
goog.require('ol.MapBrowserEvent');
goog.require('ol.MapBrowserEvent.EventType');
goog.require('ol.Pixel');
goog.require('ol.ViewHint');
goog.require('ol.interaction.Interaction');



/**
 * Base class for touch interactions.
 * @constructor
 * @extends {ol.interaction.Interaction}
 */
ol.interaction.PointerInteraction = function() {

  goog.base(this);

  /**
   * @type {boolean}
   * @private
   */
  this.handled_ = false;

  /**
   * @type {Object}
   * @private
   */
  this.trackedTouches_ = {};

  /**
   * @type {Array.<Object>}
   * @protected
   */
  this.targetTouches = [];

};
goog.inherits(ol.interaction.PointerInteraction, ol.interaction.Interaction);


/**
 * @param {Array.<Object>} touches TouchEvents.
 * @return {ol.Pixel} Centroid pixel.
 */
ol.interaction.PointerInteraction.centroid = function(touches) {
  var length = touches.length;
  var clientX = 0;
  var clientY = 0;
  for (var i = 0; i < length; i++) {
    clientX += touches[i].clientX;
    clientY += touches[i].clientY;
  }
  return [clientX / length, clientY / length];
};


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Event.
 * @return {boolean} Whether the event is a touchstart, touchmove
 *     or touchend event.
 * @private
 */
ol.interaction.PointerInteraction.isTouchEvent_ = function(mapBrowserEvent) {
  var type = mapBrowserEvent.type;
  return (
      type === ol.MapBrowserEvent.EventType.POINTERDOWN ||
      type === ol.MapBrowserEvent.EventType.POINTERMOVE ||
      type === ol.MapBrowserEvent.EventType.POINTERUP);
};


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Event.
 * @private
 */
ol.interaction.PointerInteraction.prototype.updateTrackedTouches_ =
    function(mapBrowserEvent) {
  if (ol.interaction.PointerInteraction.isTouchEvent_(mapBrowserEvent)) {
    var event = mapBrowserEvent.pointerEvent;

    if (mapBrowserEvent.type == ol.MapBrowserEvent.EventType.POINTERUP) {
      delete this.trackedTouches_[event.pointerId];
    } else if (mapBrowserEvent.type ==
        ol.MapBrowserEvent.EventType.POINTERDOWN) {
      this.trackedTouches_[event.pointerId] = event;
    } else if (event.pointerId in this.trackedTouches_) {
      // update only when there was a pointerdown event for this pointer
      this.trackedTouches_[event.pointerId] = event;
    }
    this.targetTouches = goog.object.getValues(this.trackedTouches_);
  }
};


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Event.
 * @protected
 */
ol.interaction.PointerInteraction.prototype.handlePointerMove =
    goog.nullFunction;


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Event.
 * @protected
 * @return {boolean} Capture dragging.
 */
ol.interaction.PointerInteraction.prototype.handlePointerUp =
    goog.functions.FALSE;


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Event.
 * @protected
 * @return {boolean} Capture dragging.
 */
ol.interaction.PointerInteraction.prototype.handlePointerDown =
    goog.functions.FALSE;


/**
 * @inheritDoc
 */
ol.interaction.PointerInteraction.prototype.handleMapBrowserEvent =
    function(mapBrowserEvent) {
  var view = mapBrowserEvent.map.getView();
  this.updateTrackedTouches_(mapBrowserEvent);
  if (this.handled_) {
    if (mapBrowserEvent.type == ol.MapBrowserEvent.EventType.POINTERMOVE) {
      this.handlePointerMove(mapBrowserEvent);
    } else if (mapBrowserEvent.type == ol.MapBrowserEvent.EventType.POINTERUP) {
      this.handled_ = this.handlePointerUp(mapBrowserEvent);
      if (!this.handled_) {
        view.setHint(ol.ViewHint.INTERACTING, -1);
      }
    }
  }
  if (mapBrowserEvent.type == ol.MapBrowserEvent.EventType.POINTERDOWN) {
    var handled = this.handlePointerDown(mapBrowserEvent);
    if (!this.handled_ && handled) {
      view.setHint(ol.ViewHint.INTERACTING, 1);
    }
    this.handled_ = handled;
  }
  return true;
};
