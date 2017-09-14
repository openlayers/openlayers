goog.provide('ol.interaction.PinchRotate');

goog.require('ol');
goog.require('ol.ViewHint');
goog.require('ol.functions');
goog.require('ol.interaction.Interaction');
goog.require('ol.interaction.Pointer');
goog.require('ol.RotationConstraint');


/**
 * @classdesc
 * Allows the user to rotate the map by twisting with two fingers
 * on a touch screen.
 *
 * @constructor
 * @extends {ol.interaction.Pointer}
 * @param {olx.interaction.PinchRotateOptions=} opt_options Options.
 * @api
 */
ol.interaction.PinchRotate = function(opt_options) {

  ol.interaction.Pointer.call(this, {
    handleDownEvent: ol.interaction.PinchRotate.handleDownEvent_,
    handleDragEvent: ol.interaction.PinchRotate.handleDragEvent_,
    handleUpEvent: ol.interaction.PinchRotate.handleUpEvent_
  });

  var options = opt_options || {};

  /**
   * @private
   * @type {ol.Coordinate}
   */
  this.anchor_ = null;

  /**
   * @private
   * @type {number|undefined}
   */
  this.lastAngle_ = undefined;

  /**
   * @private
   * @type {boolean}
   */
  this.rotating_ = false;

  /**
   * @private
   * @type {number}
   */
  this.rotationDelta_ = 0.0;

  /**
   * @private
   * @type {number}
   */
  this.threshold_ = options.threshold !== undefined ? options.threshold : 0.3;

  /**
   * @private
   * @type {number}
   */
  this.duration_ = options.duration !== undefined ? options.duration : 250;

};
ol.inherits(ol.interaction.PinchRotate, ol.interaction.Pointer);


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @this {ol.interaction.PinchRotate}
 * @private
 */
ol.interaction.PinchRotate.handleDragEvent_ = function(mapBrowserEvent) {
  var rotationDelta = 0.0;

  var touch0 = this.targetPointers[0];
  var touch1 = this.targetPointers[1];

  // angle between touches
  var angle = Math.atan2(
      touch1.clientY - touch0.clientY,
      touch1.clientX - touch0.clientX);

  if (this.lastAngle_ !== undefined) {
    var delta = angle - this.lastAngle_;
    this.rotationDelta_ += delta;
    if (!this.rotating_ &&
        Math.abs(this.rotationDelta_) > this.threshold_) {
      this.rotating_ = true;
    }
    rotationDelta = delta;
  }
  this.lastAngle_ = angle;

  var map = mapBrowserEvent.map;
  var view = map.getView();
  if (view.getConstraints().rotation === ol.RotationConstraint.disable) {
    return;
  }

  // rotate anchor point.
  // FIXME: should be the intersection point between the lines:
  //     touch0,touch1 and previousTouch0,previousTouch1
  var viewportPosition = map.getViewport().getBoundingClientRect();
  var centroid = ol.interaction.Pointer.centroid(this.targetPointers);
  centroid[0] -= viewportPosition.left;
  centroid[1] -= viewportPosition.top;
  this.anchor_ = map.getCoordinateFromPixel(centroid);

  // rotate
  if (this.rotating_) {
    var rotation = view.getRotation();
    map.render();
    ol.interaction.Interaction.rotateWithoutConstraints(view,
        rotation + rotationDelta, this.anchor_);
  }
};


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Stop drag sequence?
 * @this {ol.interaction.PinchRotate}
 * @private
 */
ol.interaction.PinchRotate.handleUpEvent_ = function(mapBrowserEvent) {
  if (this.targetPointers.length < 2) {
    var map = mapBrowserEvent.map;
    var view = map.getView();
    view.setHint(ol.ViewHint.INTERACTING, -1);
    if (this.rotating_) {
      var rotation = view.getRotation();
      ol.interaction.Interaction.rotate(
          view, rotation, this.anchor_, this.duration_);
    }
    return false;
  } else {
    return true;
  }
};


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Start drag sequence?
 * @this {ol.interaction.PinchRotate}
 * @private
 */
ol.interaction.PinchRotate.handleDownEvent_ = function(mapBrowserEvent) {
  if (this.targetPointers.length >= 2) {
    var map = mapBrowserEvent.map;
    this.anchor_ = null;
    this.lastAngle_ = undefined;
    this.rotating_ = false;
    this.rotationDelta_ = 0.0;
    if (!this.handlingDownUpSequence) {
      map.getView().setHint(ol.ViewHint.INTERACTING, 1);
    }
    return true;
  } else {
    return false;
  }
};


/**
 * @inheritDoc
 */
ol.interaction.PinchRotate.prototype.shouldStopEvent = ol.functions.FALSE;
