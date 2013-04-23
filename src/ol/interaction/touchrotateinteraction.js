// FIXME works for View2D only

goog.provide('ol.interaction.TouchRotate');

goog.require('goog.asserts');
goog.require('goog.style');
goog.require('ol.Coordinate');
goog.require('ol.View');
goog.require('ol.ViewHint');
goog.require('ol.interaction.Interaction');
goog.require('ol.interaction.Touch');


/**
 * @define {number} Animation duration.
 */
ol.interaction.TOUCHROTATE_ANIMATION_DURATION = 250;



/**
 * @constructor
 * @extends {ol.interaction.Touch}
 * @param {ol.interaction.TouchRotateOptions=} opt_options Options.
 */
ol.interaction.TouchRotate = function(opt_options) {

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

  // rotate anchor point.
  // FIXME: should be the intersection point between the lines:
  //     touch0,touch1 and previousTouch0,previousTouch1
  var viewportPosition = goog.style.getClientPosition(map.getViewport());
  var centroid = ol.interaction.Touch.centroid(this.targetTouches);
  centroid.x -= viewportPosition.x;
  centroid.y -= viewportPosition.y;
  this.anchor_ = map.getCoordinateFromPixel(centroid);

  // rotate
  if (this.rotating_) {
    var view = map.getView().getView2D();
    map.requestRenderFrame();
    ol.interaction.Interaction.rotateWithoutConstraints(map, view,
        view.getRotation() + rotationDelta, this.anchor_);
  }
};


/**
 * @inheritDoc
 */
ol.interaction.TouchRotate.prototype.handleTouchEnd =
    function(mapBrowserEvent) {
  if (this.targetTouches.length < 2) {
    var map = mapBrowserEvent.map;
    var view = map.getView().getView2D();
    if (this.rotating_) {
      ol.interaction.Interaction.rotate(
          map, view, view.getRotation(), this.anchor_,
          ol.interaction.TOUCHROTATE_ANIMATION_DURATION);
    }
    view.setHint(ol.ViewHint.INTERACTING, -1);
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
    var map = mapBrowserEvent.map;
    var view = map.getView();
    this.anchor_ = null;
    this.lastAngle_ = undefined;
    this.rotating_ = false;
    this.rotationDelta_ = 0.0;
    map.requestRenderFrame();
    view.setHint(ol.ViewHint.INTERACTING, 1);
    return true;
  } else {
    return false;
  }
};
