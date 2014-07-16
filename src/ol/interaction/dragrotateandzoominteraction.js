goog.provide('ol.interaction.DragRotateAndZoom');

goog.require('goog.asserts');
goog.require('goog.functions');
goog.require('goog.math.Vec2');
goog.require('ol');
goog.require('ol.ViewHint');
goog.require('ol.events.ConditionType');
goog.require('ol.events.condition');
goog.require('ol.interaction.Interaction');
goog.require('ol.interaction.Pointer');



/**
 * @classdesc
 * Allows the user to zoom and rotate the map by clicking and dragging
 * on the map.  By default, this interaction is limited to when the shift
 * key is held down.
 *
 * This interaction is only supported for mouse devices.
 *
 * And this interaction is not included in the default interactions.
 *
 * @constructor
 * @extends {ol.interaction.Pointer}
 * @param {olx.interaction.DragRotateAndZoomOptions=} opt_options Options.
 * @api stable
 */
ol.interaction.DragRotateAndZoom = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  goog.base(this);

  /**
   * @private
   * @type {ol.events.ConditionType}
   */
  this.condition_ = goog.isDef(options.condition) ?
      options.condition : ol.events.condition.shiftKeyOnly;

  /**
   * @private
   * @type {number|undefined}
   */
  this.lastAngle_ = undefined;

  /**
   * @private
   * @type {number|undefined}
   */
  this.lastMagnitude_ = undefined;

  /**
   * @private
   * @type {number}
   */
  this.lastScaleDelta_ = 0;

};
goog.inherits(ol.interaction.DragRotateAndZoom,
    ol.interaction.Pointer);


/**
 * @inheritDoc
 */
ol.interaction.DragRotateAndZoom.prototype.handlePointerDrag =
    function(mapBrowserEvent) {
  if (!ol.events.condition.mouseOnly(mapBrowserEvent)) {
    return;
  }

  var map = mapBrowserEvent.map;
  var size = map.getSize();
  var offset = mapBrowserEvent.pixel;
  var delta = new goog.math.Vec2(
      offset[0] - size[0] / 2,
      size[1] / 2 - offset[1]);
  var theta = Math.atan2(delta.y, delta.x);
  var magnitude = delta.magnitude();
  var view = map.getView();
  var viewState = view.getState();
  map.render();
  if (goog.isDef(this.lastAngle_)) {
    var angleDelta = theta - this.lastAngle_;
    ol.interaction.Interaction.rotateWithoutConstraints(
        map, view, viewState.rotation - angleDelta);
  }
  this.lastAngle_ = theta;
  if (goog.isDef(this.lastMagnitude_)) {
    var resolution = this.lastMagnitude_ * (viewState.resolution / magnitude);
    ol.interaction.Interaction.zoomWithoutConstraints(map, view, resolution);
  }
  if (goog.isDef(this.lastMagnitude_)) {
    this.lastScaleDelta_ = this.lastMagnitude_ / magnitude;
  }
  this.lastMagnitude_ = magnitude;
};


/**
 * @inheritDoc
 */
ol.interaction.DragRotateAndZoom.prototype.handlePointerUp =
    function(mapBrowserEvent) {
  if (!ol.events.condition.mouseOnly(mapBrowserEvent)) {
    return true;
  }

  var map = mapBrowserEvent.map;
  var view = map.getView();
  view.setHint(ol.ViewHint.INTERACTING, -1);
  var viewState = view.getState();
  var direction = this.lastScaleDelta_ - 1;
  ol.interaction.Interaction.rotate(map, view, viewState.rotation);
  ol.interaction.Interaction.zoom(map, view, viewState.resolution,
      undefined, ol.DRAGROTATEANDZOOM_ANIMATION_DURATION,
      direction);
  this.lastScaleDelta_ = 0;
  return false;
};


/**
 * @inheritDoc
 */
ol.interaction.DragRotateAndZoom.prototype.handlePointerDown =
    function(mapBrowserEvent) {
  if (!ol.events.condition.mouseOnly(mapBrowserEvent)) {
    return false;
  }

  if (this.condition_(mapBrowserEvent)) {
    mapBrowserEvent.map.getView().setHint(ol.ViewHint.INTERACTING, 1);
    this.lastAngle_ = undefined;
    this.lastMagnitude_ = undefined;
    return true;
  } else {
    return false;
  }
};


/**
 * @inheritDoc
 * Stop the event if it was handled, so that interaction `DragZoom`
 * does not interfere.
 */
ol.interaction.DragRotateAndZoom.prototype.shouldStopEvent =
    goog.functions.identity;
