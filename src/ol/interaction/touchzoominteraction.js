// FIXME works for View2D only

goog.provide('ol.interaction.TouchZoom');

goog.require('goog.asserts');
goog.require('goog.style');
goog.require('ol.Coordinate');
goog.require('ol.interaction.Interaction');
goog.require('ol.interaction.Touch');


/**
 * @define {number} Animation duration.
 */
ol.interaction.TOUCHZOOM_ANIMATION_DURATION = 400;



/**
 * @constructor
 * @extends {ol.interaction.Touch}
 */
ol.interaction.TouchZoom = function() {

  goog.base(this);

  /**
   * @private
   * @type {ol.Coordinate}
   */
  this.anchor_ = null;

  /**
   * @private
   * @type {number|undefined}
   */
  this.lastDistance_ = undefined;

  /**
   * @private
   * @type {number}
   */
  this.lastScaleDelta_ = 1;

};
goog.inherits(ol.interaction.TouchZoom, ol.interaction.Touch);


/**
 * @inheritDoc
 */
ol.interaction.TouchZoom.prototype.handleTouchMove =
    function(mapBrowserEvent) {
  goog.asserts.assert(this.targetTouches.length >= 2);
  var scaleDelta = 1.0;

  var touch0 = this.targetTouches[0];
  var touch1 = this.targetTouches[1];
  var dx = touch0.clientX - touch1.clientX;
  var dy = touch0.clientY - touch1.clientY;

  // distance between touches
  var distance = Math.sqrt(dx * dx + dy * dy);

  if (goog.isDef(this.lastDistance_)) {
    scaleDelta = this.lastDistance_ / distance;
  }
  this.lastDistance_ = distance;
  if (scaleDelta != 1.0) {
    this.lastScaleDelta_ = scaleDelta;
  }

  var map = mapBrowserEvent.map;
  // FIXME works for View2D only
  var view = map.getView().getView2D();
  var view2DState = view.getView2DState();

  // scale anchor point.
  var viewportPosition = goog.style.getClientPosition(map.getViewport());
  var centroid = ol.interaction.Touch.centroid(this.targetTouches);
  centroid[0] -= viewportPosition.x;
  centroid[1] -= viewportPosition.y;
  this.anchor_ = map.getCoordinateFromPixel(centroid);

  // scale, bypass the resolution constraint
  map.requestRenderFrame();
  ol.interaction.Interaction.zoomWithoutConstraints(
      map, view, view2DState.resolution * scaleDelta, this.anchor_);

};


/**
 * @inheritDoc
 */
ol.interaction.TouchZoom.prototype.handleTouchEnd =
    function(mapBrowserEvent) {
  if (this.targetTouches.length < 2) {
    var map = mapBrowserEvent.map;
    // FIXME works for View2D only
    var view = map.getView().getView2D();
    var view2DState = view.getView2DState();
    // Zoom to final resolution, with an animation, and provide a
    // direction not to zoom out/in if user was pinching in/out.
    // Direction is > 0 if pinching out, and < 0 if pinching in.
    var direction = this.lastScaleDelta_ - 1;
    ol.interaction.Interaction.zoom(map, view, view2DState.resolution,
        this.anchor_, ol.interaction.TOUCHZOOM_ANIMATION_DURATION, direction);
    return false;
  } else {
    return true;
  }
};


/**
 * @inheritDoc
 */
ol.interaction.TouchZoom.prototype.handleTouchStart =
    function(mapBrowserEvent) {
  if (this.targetTouches.length >= 2) {
    var map = mapBrowserEvent.map;
    this.anchor_ = null;
    this.lastDistance_ = undefined;
    this.lastScaleDelta_ = 1;
    map.requestRenderFrame();
    return true;
  } else {
    return false;
  }
};
