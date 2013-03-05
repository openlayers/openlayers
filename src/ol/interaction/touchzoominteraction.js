// FIXME works for View2D only

goog.provide('ol.interaction.TouchZoom');

goog.require('goog.asserts');
goog.require('ol.View');
goog.require('ol.ViewHint');
goog.require('ol.interaction.Touch');


/**
 * @define {number} Animation duration.
 */
ol.interaction.TOUCHZOOM_ANIMATION_DURATION = 250;



/**
 * @constructor
 * @extends {ol.interaction.Touch}
 */
ol.interaction.TouchZoom = function() {

  goog.base(this);

  /**
   * @private
   * @type {number|undefined}
   */
  this.lastDistance_;

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

  var map = mapBrowserEvent.map;
  var view = map.getView();

  // scale anchor point.
  var viewportPosition = goog.style.getClientPosition(map.getViewport());
  var centroid = ol.interaction.Touch.centroid(this.targetTouches);
  centroid.x -= viewportPosition.x;
  centroid.y -= viewportPosition.y;
  var anchor = map.getCoordinateFromPixel(centroid);

  // scale, bypass the resolution constraint
  view.zoomWithoutConstraints(map, view.getResolution() * scaleDelta, anchor);

};


/**
 * @inheritDoc
 */
ol.interaction.TouchZoom.prototype.handleTouchEnd =
    function(mapBrowserEvent) {
  if (this.targetTouches.length < 2) {
    var map = mapBrowserEvent.map;
    var view = map.getView();
    // take the resolution constraint into account
    view.zoom(map, view.getResolution(), undefined,
        ol.interaction.TOUCHZOOM_ANIMATION_DURATION);
    view.setHint(ol.ViewHint.INTERACTING, -1);
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
    var view = mapBrowserEvent.map.getView();
    this.lastDistance_ = undefined;
    view.setHint(ol.ViewHint.INTERACTING, 1);
    return true;
  } else {
    return false;
  }
};
