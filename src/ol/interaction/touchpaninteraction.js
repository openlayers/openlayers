// FIXME works for View2D only
goog.provide('ol.interaction.TouchPan');

goog.require('goog.asserts');
goog.require('ol.Kinetic');
goog.require('ol.Pixel');
goog.require('ol.PreRenderFunction');
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
      this.kinetic_.update(centroid[0], centroid[1]);
    }
    var deltaX = this.lastCentroid[0] - centroid[0];
    var deltaY = centroid[1] - this.lastCentroid[1];
    var map = mapBrowserEvent.map;
    var view = map.getView().getView2D();
    var view2DState = view.getView2DState();
    var center = [deltaX, deltaY];
    ol.coordinate.scale(center, view2DState.resolution);
    ol.coordinate.rotate(center, view2DState.rotation);
    ol.coordinate.add(center, view2DState.center);
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
  if (this.targetTouches.length === 0) {
    if (!this.noKinetic_ && this.kinetic_ && this.kinetic_.end()) {
      var distance = this.kinetic_.getDistance();
      var angle = this.kinetic_.getAngle();
      var center = view.getCenter();
      this.kineticPreRenderFn_ = this.kinetic_.pan(center);
      map.addPreRenderFunction(this.kineticPreRenderFn_);
      var centerpx = map.getPixelFromCoordinate(center);
      var dest = map.getCoordinateFromPixel([
        centerpx[0] - distance * Math.cos(angle),
        centerpx[1] - distance * Math.sin(angle)
      ]);
      view.setCenter(dest);
    }
    map.requestRenderFrame();
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
    // No kinetic as soon as more than one fingers on the screen is
    // detected. This is to prevent nasty pans after pinch.
    this.noKinetic_ = this.targetTouches.length > 1;
    return true;
  } else {
    return false;
  }
};
