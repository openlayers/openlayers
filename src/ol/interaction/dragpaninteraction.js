// FIXME works for View2D only

goog.provide('ol.interaction.DragPan');

goog.require('goog.asserts');
goog.require('ol.Coordinate');
goog.require('ol.MapBrowserEvent');
goog.require('ol.View2D');
goog.require('ol.ViewHint');
goog.require('ol.animation');
goog.require('ol.interaction.ConditionType');
goog.require('ol.interaction.Drag');



/**
 * @constructor
 * @extends {ol.interaction.Drag}
 * @param {ol.interaction.ConditionType} condition Condition.
 * @param {ol.Kinetic=} opt_kinetic Kinetic object.
 */
ol.interaction.DragPan = function(condition, opt_kinetic) {

  goog.base(this);

  /**
   * @private
   * @type {ol.interaction.ConditionType}
   */
  this.condition_ = condition;

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

};
goog.inherits(ol.interaction.DragPan, ol.interaction.Drag);


/**
 * @inheritDoc
 */
ol.interaction.DragPan.prototype.handleDrag = function(mapBrowserEvent) {
  if (this.kinetic_) {
    this.kinetic_.update(mapBrowserEvent.browserEvent);
  }
  var map = mapBrowserEvent.map;
  // FIXME works for View2D only
  var view = map.getView();
  goog.asserts.assert(view instanceof ol.View2D);
  var resolution = view.getResolution();
  var rotation = view.getRotation();
  var delta =
      new ol.Coordinate(-resolution * this.deltaX, resolution * this.deltaY);
  delta.rotate(rotation);
  var newCenter = new ol.Coordinate(
      this.startCenter.x + delta.x, this.startCenter.y + delta.y);
  map.requestRenderFrame();
  view.setCenter(newCenter);
};


/**
 * @inheritDoc
 */
ol.interaction.DragPan.prototype.handleDragEnd = function(mapBrowserEvent) {

  // FIXME works for View2D only

  var map = mapBrowserEvent.map;
  var view = map.getView();
  view.setHint(ol.ViewHint.PANNING, -1);

  if (this.kinetic_ && this.kinetic_.end()) {
    var distance = this.kinetic_.getDistance();
    var angle = this.kinetic_.getAngle();
    var center = view.getCenter();
    this.kineticPreRenderFn_ = ol.animation.createPanFrom({
      source: center,
      duration: this.kinetic_.getDuration(),
      easing: this.kinetic_.getEasingFn()
    });
    map.addPreRenderFunction(this.kineticPreRenderFn_);

    var centerpx = map.getPixelFromCoordinate(center);
    var destpx = new ol.Pixel(
        centerpx.x - distance * Math.cos(angle),
        centerpx.y - distance * Math.sin(angle));
    var dest = map.getCoordinateFromPixel(destpx);
    view.setCenter(dest);
  }
};


/**
 * @inheritDoc
 */
ol.interaction.DragPan.prototype.handleDragStart = function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  if (this.condition_(browserEvent)) {
    if (this.kinetic_) {
      this.kinetic_.begin(browserEvent);
    }
    var map = mapBrowserEvent.map;
    map.requestRenderFrame();
    map.getView().setHint(ol.ViewHint.PANNING, 1);
    return true;
  } else {
    return false;
  }
};


/**
 * @inheritDoc
 */
ol.interaction.DragPan.prototype.handleDown = function(mapBrowserEvent) {
  var map = mapBrowserEvent.map;
  // FIXME works for View2D only
  var view = map.getView();
  goog.asserts.assert(view instanceof ol.View2D);
  goog.asserts.assert(!goog.isNull(mapBrowserEvent.frameState));
  if (!goog.isNull(this.kineticPreRenderFn_) &&
      map.removePreRenderFunction(this.kineticPreRenderFn_)) {
    map.requestRenderFrame();
    view.setCenter(mapBrowserEvent.frameState.view2DState.center);
    this.kineticPreRenderFn_ = null;
  }
};
