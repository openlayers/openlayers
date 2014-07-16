goog.provide('ol.interaction.PinchRotate');

goog.require('goog.asserts');
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

  goog.base(this);

  var options = goog.isDef(opt_options) ? opt_options : {};

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
  this.threshold_ = goog.isDef(options.threshold) ? options.threshold : 0.3;

};
goog.inherits(ol.interaction.PinchRotate, ol.interaction.Pointer);


/**
 * @inheritDoc
 */
ol.interaction.PinchRotate.prototype.handlePointerDrag =
    function(mapBrowserEvent) {
  goog.asserts.assert(this.targetPointers.length >= 2);
  var rotationDelta = 0.0;

  var touch0 = this.targetPointers[0];
  var touch1 = this.targetPointers[1];

  // angle between touches
  var angle = Math.atan2(
      touch1.clientY - touch0.clientY,
      touch1.clientX - touch0.clientX);

  if (goog.isDef(this.lastAngle_)) {
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
    var viewState = view.getState();
    map.render();
    ol.interaction.Interaction.rotateWithoutConstraints(map, view,
        viewState.rotation + rotationDelta, this.anchor_);
  }
};


/**
 * @inheritDoc
 */
ol.interaction.PinchRotate.prototype.handlePointerUp =
    function(mapBrowserEvent) {
  if (this.targetPointers.length < 2) {
    var map = mapBrowserEvent.map;
    var view = map.getView();
    view.setHint(ol.ViewHint.INTERACTING, -1);
    if (this.rotating_) {
      var viewState = view.getState();
      ol.interaction.Interaction.rotate(
          map, view, viewState.rotation, this.anchor_,
          ol.ROTATE_ANIMATION_DURATION);
    }
    return false;
  } else {
    return true;
  }
};


/**
 * @inheritDoc
 */
ol.interaction.PinchRotate.prototype.handlePointerDown =
    function(mapBrowserEvent) {
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
