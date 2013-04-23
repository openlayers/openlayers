// FIXME works for View2D only
goog.provide('ol.interaction.TouchPan');

goog.require('goog.asserts');
goog.require('ol.Kinetic');
goog.require('ol.Pixel');
goog.require('ol.PreRenderFunction');
goog.require('ol.View');
goog.require('ol.ViewHint');
goog.require('ol.coordinate');
goog.require('ol.interaction.Touch');



/**
 * @constructor
 * @extends {ol.interaction.Touch}
 * @param {ol.interaction.TouchPanOptions=} opt_options Options.
 */
ol.interaction.TouchPan = function(opt_options) {

  goog.base(this);

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @private
   * @type {ol.Kinetic|undefined}
   */
  this.kinetic_ = options.kinetic;

  /**
   * @private
   * @type {?ol.PreRenderFunction}
   */
  this.kineticPreRenderFn_ = null;

  /**
   * @type {ol.Pixel}
   */
  this.lastCentroid = null;

  /**
   * @private
   * @type {boolean}
   */
  this.noKinetic_ = false;

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
    var map = mapBrowserEvent.map;
    var view = map.getView();
    var center = [deltaX, deltaY];
    ol.coordinate.scale(center, view.getResolution());
    ol.coordinate.rotate(center, view.getRotation());
    ol.coordinate.add(center, view.getCenter());
    map.requestRenderFrame();
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
    var interacting = view.setHint(ol.ViewHint.INTERACTING, -1);
    if (!this.noKinetic_ && this.kinetic_ && this.kinetic_.end()) {
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
    } else if (interacting === 0) {
      map.requestRenderFrame();
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
  if (this.targetTouches.length > 0) {
    var map = mapBrowserEvent.map;
    var view = map.getView();
    this.lastCentroid = null;
    map.requestRenderFrame();
    if (!goog.isNull(this.kineticPreRenderFn_) &&
        map.removePreRenderFunction(this.kineticPreRenderFn_)) {
      view.setCenter(mapBrowserEvent.frameState.view2DState.center);
      this.kineticPreRenderFn_ = null;
    }
    if (this.kinetic_) {
      this.kinetic_.begin();
    }
    view.setHint(ol.ViewHint.INTERACTING, 1);
    // No kinetic as soon as more than one fingers on the screen is
    // detected. This is to prevent nasty pans after pinch.
    this.noKinetic_ = this.targetTouches.length > 1;
    return true;
  } else {
    return false;
  }
};
