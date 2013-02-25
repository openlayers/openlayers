// FIXME works for View2D only

goog.provide('ol.interaction.TouchRotate');

goog.require('goog.asserts');
goog.require('ol.View');
goog.require('ol.ViewHint');
goog.require('ol.interaction.Touch');



/**
 * @constructor
 * @extends {ol.interaction.Touch}
 * @param {number=} opt_threshold Minimal angle to start a rotation.
 *     Default to 0.3 (radian).
 */
ol.interaction.TouchRotate = function(opt_threshold) {

  goog.base(this);

  /**
   * @private
   * @type {number|undefined}
   */
  this.lastAngle_;

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
  this.threshold_ = goog.isDef(opt_threshold) ? opt_threshold : 0.3;

};
goog.inherits(ol.interaction.TouchRotate, ol.interaction.Touch);


/**
 * @inheritDoc
 */
ol.interaction.TouchRotate.prototype.handleTouchMove =
    function(mapBrowserEvent) {
  goog.asserts.assert(this.targetTouches.length >= 2);
  var rotationDelta = 0.0;

  var touch0 = this.targetTouches[0];
  var touch1 = this.targetTouches[1];
  var dx = touch0.clientX - touch1.clientX;
  var dy = touch0.clientY - touch1.clientY;

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
  var view = map.getView();

  // rotate anchor point.
  // FIXME: should be the intersection point between the lines:
  //     touch0,touch1 and previousTouch0,previousTouch1
  var viewportPosition = goog.style.getClientPosition(map.getViewport());
  var centroid = ol.interaction.Touch.centroid(this.targetTouches);
  centroid.x -= viewportPosition.x;
  centroid.y -= viewportPosition.y;
  var anchor = map.getCoordinateFromPixel(centroid);

  // rotate
  if (this.rotating_) {
    view.rotate(map, view.getRotation() + rotationDelta, anchor);
  }
};


/**
 * @inheritDoc
 */
ol.interaction.TouchRotate.prototype.handleTouchEnd =
    function(mapBrowserEvent) {
  if (this.targetTouches.length < 2) {
    var map = mapBrowserEvent.map;
    var view = map.getView();
    view.setHint(ol.ViewHint.PANNING, -1);
    return false;
  } else {
    return true;
  }
};


/**
 * @inheritDoc
 */
ol.interaction.TouchRotate.prototype.handleTouchStart =
    function(mapBrowserEvent) {
  if (this.targetTouches.length >= 2) {
    var view = mapBrowserEvent.map.getView();
    this.lastAngle_ = undefined;
    this.rotating_ = false;
    this.rotationDelta_ = 0.0;
    view.setHint(ol.ViewHint.PANNING, 1);
    return true;
  } else {
    return false;
  }
};
