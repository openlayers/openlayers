// FIXME works for View2D only
goog.provide('ol.interaction.TouchPan');

goog.require('goog.asserts');
goog.require('ol.Coordinate');
goog.require('ol.Kinetic');
goog.require('ol.Pixel');
goog.require('ol.PreRenderFunction');
goog.require('ol.View');
goog.require('ol.ViewHint');
goog.require('ol.interaction.Touch');



/**
 * @constructor
 * @extends {ol.interaction.Touch}
 * @param {ol.Kinetic=} opt_kinetic Kinetic object.
 */
ol.interaction.TouchPan = function(opt_kinetic) {

  goog.base(this);

  /**
   * @private
   * @type {ol.Kinetic|undefined}
   */
  this.kinetic_ = opt_kinetic;

  /**
   * @private
   * @type {?ol.PreRenderFunction}
   */
  this.kineticPreRenderFn_ = null;

  /**
   * @type {ol.Pixel}
   */
  this.lastCentroid = null;

};
goog.inherits(ol.interaction.TouchPan, ol.interaction.Touch);


/**
 * @inheritDoc
 */
ol.interaction.TouchPan.prototype.handleTouchMove = function(mapBrowserEvent) {
  goog.asserts.assert(this.targetTouches.length >= 1);
  var centroid = ol.interaction.Touch.centroid(this.targetTouches);
  if (!goog.isNull(this.lastCentroid)) {
    if (this.kinetic_) {
      this.kinetic_.update(centroid.x, centroid.y);
    }
    var deltaX = this.lastCentroid.x - centroid.x;
    var deltaY = centroid.y - this.lastCentroid.y;
    var view = mapBrowserEvent.map.getView();
    var center = new ol.Coordinate(deltaX, deltaY)
      .scale(view.getResolution())
      .rotate(view.getRotation())
      .add(view.getCenter());
    view.setCenter(center);
  }
  this.lastCentroid = centroid;
};


/**
 * @inheritDoc
 */
ol.interaction.TouchPan.prototype.handleTouchEnd =
    function(mapBrowserEvent) {
  var map = mapBrowserEvent.map;
  var view = map.getView();
  if (this.targetTouches.length == 0) {
    view.setHint(ol.ViewHint.INTERACTING, -1);
    if (this.kinetic_ && this.kinetic_.end()) {
      var distance = this.kinetic_.getDistance();
      var angle = this.kinetic_.getAngle();
      var center = view.getCenter();
      this.kineticPreRenderFn_ = this.kinetic_.pan(center);
      map.addPreRenderFunction(this.kineticPreRenderFn_);
      var centerpx = map.getPixelFromCoordinate(center);
      var destpx = new ol.Pixel(
          centerpx.x - distance * Math.cos(angle),
          centerpx.y - distance * Math.sin(angle));
      var dest = map.getCoordinateFromPixel(destpx);
      view.setCenter(dest);
    }
    return false;
  } else {
    this.lastCentroid = null;
    return true;
  }
};


/**
 * @inheritDoc
 */
ol.interaction.TouchPan.prototype.handleTouchStart =
    function(mapBrowserEvent) {
  if (this.targetTouches.length >= 1) {
    var map = mapBrowserEvent.map;
    var view = map.getView();
    this.lastCentroid = null;
    if (!goog.isNull(this.kineticPreRenderFn_) &&
        map.removePreRenderFunction(this.kineticPreRenderFn_)) {
      map.requestRenderFrame();
      view.setCenter(mapBrowserEvent.frameState.view2DState.center);
      this.kineticPreRenderFn_ = null;
    }
    if (this.kinetic_) {
      this.kinetic_.begin();
    }
    view.setHint(ol.ViewHint.INTERACTING, 1);
    return true;
  } else {
    return false;
  }
};
