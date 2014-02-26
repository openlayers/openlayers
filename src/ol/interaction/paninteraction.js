// FIXME works for View2D only
goog.provide('ol.interaction.Pan');

goog.require('goog.asserts');
goog.require('ol.Kinetic');
goog.require('ol.Pixel');
goog.require('ol.PreRenderFunction');
goog.require('ol.View2D');
goog.require('ol.coordinate');
goog.require('ol.events.condition');
goog.require('ol.interaction.PointerInteraction');



/**
 * Allows the user to pan the map by touching and dragging
 * on a touch screen.
 * @constructor
 * @extends {ol.interaction.PointerInteraction}
 * @param {olx.interaction.PanOptions=} opt_options Options.
 * @todo stability experimental
 */
ol.interaction.Pan = function(opt_options) {

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
   * @type {ol.events.ConditionType}
   */
  this.condition_ = goog.isDef(opt_options.condition) ?
      opt_options.condition : ol.events.condition.noModifierKeys;

  /**
   * @private
   * @type {boolean}
   */
  this.noKinetic_ = false;

};
goog.inherits(ol.interaction.Pan, ol.interaction.PointerInteraction);


/**
 * @inheritDoc
 */
ol.interaction.Pan.prototype.handlePointerDrag = function(mapBrowserEvent) {
  goog.asserts.assert(this.targetTouches.length >= 1);
  var centroid = ol.interaction.PointerInteraction.centroid(this.targetTouches);
  if (!goog.isNull(this.lastCentroid)) {
    if (this.kinetic_) {
      this.kinetic_.update(centroid[0], centroid[1]);
    }
    var deltaX = this.lastCentroid[0] - centroid[0];
    var deltaY = centroid[1] - this.lastCentroid[1];
    var map = mapBrowserEvent.map;
    var view2D = map.getView().getView2D();
    goog.asserts.assertInstanceof(view2D, ol.View2D);
    var view2DState = view2D.getView2DState();
    var center = [deltaX, deltaY];
    ol.coordinate.scale(center, view2DState.resolution);
    ol.coordinate.rotate(center, view2DState.rotation);
    ol.coordinate.add(center, view2DState.center);
    center = view2D.constrainCenter(center);
    map.render();
    view2D.setCenter(center);
  }
  this.lastCentroid = centroid;
};


/**
 * @inheritDoc
 */
ol.interaction.Pan.prototype.handlePointerUp =
    function(mapBrowserEvent) {
  var map = mapBrowserEvent.map;
  var view2D = map.getView().getView2D();
  goog.asserts.assertInstanceof(view2D, ol.View2D);
  if (this.targetTouches.length === 0) {
    if (!this.noKinetic_ && this.kinetic_ && this.kinetic_.end()) {
      var distance = this.kinetic_.getDistance();
      var angle = this.kinetic_.getAngle();
      var center = view2D.getCenter();
      goog.asserts.assert(goog.isDef(center));
      this.kineticPreRenderFn_ = this.kinetic_.pan(center);
      map.beforeRender(this.kineticPreRenderFn_);
      var centerpx = map.getPixelFromCoordinate(center);
      var dest = map.getCoordinateFromPixel([
        centerpx[0] - distance * Math.cos(angle),
        centerpx[1] - distance * Math.sin(angle)
      ]);
      dest = view2D.constrainCenter(dest);
      view2D.setCenter(dest);
    }
    map.render();
    return false;
  } else {
    this.lastCentroid = null;
    return true;
  }
};


/**
 * @inheritDoc
 */
ol.interaction.Pan.prototype.handlePointerDown =
    function(mapBrowserEvent) {
  if (this.targetTouches.length > 0 && this.condition_(mapBrowserEvent)) {
    var map = mapBrowserEvent.map;
    var view2D = map.getView().getView2D();
    goog.asserts.assertInstanceof(view2D, ol.View2D);
    this.lastCentroid = null;
    map.render();
    if (!goog.isNull(this.kineticPreRenderFn_) &&
        map.removePreRenderFunction(this.kineticPreRenderFn_)) {
      view2D.setCenter(mapBrowserEvent.frameState.view2DState.center);
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
