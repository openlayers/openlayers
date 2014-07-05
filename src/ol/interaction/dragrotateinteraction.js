goog.provide('ol.interaction.DragRotate');

goog.require('goog.asserts');
goog.require('ol');
goog.require('ol.ViewHint');
goog.require('ol.events.ConditionType');
goog.require('ol.events.condition');
goog.require('ol.interaction.Interaction');
goog.require('ol.interaction.Pointer');



/**
 * @classdesc
 * Allows the user to rotate the map by clicking and dragging on the map,
 * normally combined with an {@link ol.events.condition} that limits
 * it to when the alt and shift keys are held down.
 *
 * This interaction is only supported for mouse devices.
 *
 * @constructor
 * @extends {ol.interaction.Pointer}
 * @param {olx.interaction.DragRotateOptions=} opt_options Options.
 * @api stable
 */
ol.interaction.DragRotate = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  goog.base(this);

  /**
   * @private
   * @type {ol.events.ConditionType}
   */
  this.condition_ = goog.isDef(options.condition) ?
      options.condition : ol.events.condition.altShiftKeysOnly;

  /**
   * @private
   * @type {number|undefined}
   */
  this.lastAngle_ = undefined;

};
goog.inherits(ol.interaction.DragRotate, ol.interaction.Pointer);


/**
 * @inheritDoc
 */
ol.interaction.DragRotate.prototype.handlePointerDrag =
    function(mapBrowserEvent) {
  if (!ol.events.condition.mouseOnly(mapBrowserEvent)) {
    return;
  }

  var map = mapBrowserEvent.map;
  var size = map.getSize();
  var offset = mapBrowserEvent.pixel;
  var theta =
      Math.atan2(size[1] / 2 - offset[1], offset[0] - size[0] / 2);
  if (goog.isDef(this.lastAngle_)) {
    var delta = theta - this.lastAngle_;
    var view = map.getView();
    var viewState = view.getState();
    map.render();
    ol.interaction.Interaction.rotateWithoutConstraints(
        map, view, viewState.rotation - delta);
  }
  this.lastAngle_ = theta;
};


/**
 * @inheritDoc
 */
ol.interaction.DragRotate.prototype.handlePointerUp =
    function(mapBrowserEvent) {
  if (!ol.events.condition.mouseOnly(mapBrowserEvent)) {
    return true;
  }

  var map = mapBrowserEvent.map;
  var view = map.getView();
  view.setHint(ol.ViewHint.INTERACTING, -1);
  var viewState = view.getState();
  ol.interaction.Interaction.rotate(map, view, viewState.rotation,
      undefined, ol.DRAGROTATE_ANIMATION_DURATION);
  return false;
};


/**
 * @inheritDoc
 */
ol.interaction.DragRotate.prototype.handlePointerDown =
    function(mapBrowserEvent) {
  if (!ol.events.condition.mouseOnly(mapBrowserEvent)) {
    return false;
  }

  var browserEvent = mapBrowserEvent.browserEvent;
  if (browserEvent.isMouseActionButton() && this.condition_(mapBrowserEvent)) {
    var map = mapBrowserEvent.map;
    map.getView().setHint(ol.ViewHint.INTERACTING, 1);
    map.render();
    this.lastAngle_ = undefined;
    return true;
  } else {
    return false;
  }
};
