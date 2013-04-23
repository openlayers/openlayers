// FIXME works for View2D only

goog.provide('ol.interaction.DragPan');

goog.require('goog.asserts');
goog.require('ol.Kinetic');
goog.require('ol.Pixel');
goog.require('ol.PreRenderFunction');
goog.require('ol.View2D');
goog.require('ol.ViewHint');
goog.require('ol.coordinate');
goog.require('ol.interaction.ConditionType');
goog.require('ol.interaction.Drag');
goog.require('ol.interaction.condition');



/**
 * @constructor
 * @extends {ol.interaction.Drag}
 * @param {ol.interaction.DragPanOptions=} opt_options Options.
 */
ol.interaction.DragPan = function(opt_options) {

  goog.base(this);

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @private
   * @type {ol.interaction.ConditionType}
   */
  this.condition_ = goog.isDef(options.condition) ?
      options.condition : ol.interaction.condition.noModifierKeys;

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

};
goog.inherits(ol.interaction.DragPan, ol.interaction.Drag);


/**
 * @inheritDoc
 */
ol.interaction.DragPan.prototype.handleDrag = function(mapBrowserEvent) {
  if (this.kinetic_) {
    this.kinetic_.update(
        mapBrowserEvent.browserEvent.clientX,
        mapBrowserEvent.browserEvent.clientY);
  }
  var map = mapBrowserEvent.map;
  // FIXME works for View2D only
  var view = map.getView();
  goog.asserts.assertInstanceof(view, ol.View2D);
  var resolution = view.getResolution();
  var rotation = view.getRotation();
  var newCenter = [-resolution * this.deltaX, resolution * this.deltaY];
  ol.coordinate.rotate(newCenter, rotation);
  ol.coordinate.add(newCenter, this.startCenter);
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
  var interacting = view.setHint(ol.ViewHint.INTERACTING, -1);

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
  } else if (interacting === 0) {
    map.requestRenderFrame();
  }
};


/**
 * @inheritDoc
 */
ol.interaction.DragPan.prototype.handleDragStart = function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  if (this.condition_(browserEvent)) {
    if (this.kinetic_) {
      this.kinetic_.begin();
      this.kinetic_.update(browserEvent.clientX, browserEvent.clientY);
    }
    var map = mapBrowserEvent.map;
    map.requestRenderFrame();
    map.getView().setHint(ol.ViewHint.INTERACTING, 1);
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
  goog.asserts.assertInstanceof(view, ol.View2D);
  goog.asserts.assert(!goog.isNull(mapBrowserEvent.frameState));
  if (!goog.isNull(this.kineticPreRenderFn_) &&
      map.removePreRenderFunction(this.kineticPreRenderFn_)) {
    map.requestRenderFrame();
    view.setCenter(mapBrowserEvent.frameState.view2DState.center);
    this.kineticPreRenderFn_ = null;
  }
};
