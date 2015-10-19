goog.provide('ol.interaction.PinchRotate');

goog.require('goog.asserts');
goog.require('goog.functions');
goog.require('goog.style');
goog.require('ol');
goog.require('ol.Coordinate');
goog.require('ol.ViewHint');
goog.require('ol.interaction.Interaction');
goog.require('ol.interaction.Pointer');



/**
 * @classdesc
 * Allows the user to rotate the map by twisting with two fingers
 * on a touch screen.
 *
 * @constructor
 * @extends {ol.interaction.Pointer}
 * @param {olx.interaction.PinchRotateOptions=} opt_options Options.
 * @api stable
 */
ol.interaction.PinchRotate = function(opt_options) {

  goog.base(this, {
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
goog.inherits(ol.interaction.PinchRotate, ol.interaction.Pointer);


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @this {ol.interaction.PinchRotate}
 * @private
 */
ol.interaction.PinchRotate.handleDragEvent_ = function(mapBrowserEvent) {
  goog.asserts.assert(this.targetPointers.length >= 2,
      'length of this.targetPointers should be greater than or equal to 2');
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

  // rotate anchor point.
  // FIXME: should be the intersection point between the lines:
  //     touch0,touch1 and previousTouch0,previousTouch1
  var viewportPosition = goog.style.getClientPosition(map.getViewport());
  var centroid =
      ol.interaction.Pointer.centroid(this.targetPointers);
  centroid[0] -= viewportPosition.x;
  centroid[1] -= viewportPosition.y;
  this.anchor_ = map.getCoordinateFromPixel(centroid);

  // rotate
  if (this.rotating_) {
    var view = map.getView();
    var rotation = view.getRotation();
    map.render();
    ol.interaction.Interaction.rotateWithoutConstraints(map, view,
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
          map, view, rotation, this.anchor_, this.duration_);
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
    map.render();
    return true;
  } else {
    return false;
  }
};


/**
 * @inheritDoc
 */
ol.interaction.PinchRotate.prototype.shouldStopEvent = goog.functions.FALSE;
