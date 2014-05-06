// FIXME factor out key precondition (shift et. al)

goog.provide('ol.interaction.Interaction');

goog.require('goog.asserts');
goog.require('ol.MapBrowserEvent');
goog.require('ol.Observable');
goog.require('ol.View2D');
goog.require('ol.animation');
goog.require('ol.easing');



/**
 * @constructor
 * @extends {ol.Observable}
 */
ol.interaction.Interaction = function() {
  goog.base(this);

  /**
   * @private
   * @type {ol.Map}
   */
  this.map_ = null;

};
goog.inherits(ol.interaction.Interaction, ol.Observable);


/**
 * Get the map associated with this interaction.
 * @return {ol.Map} Map.
 */
ol.interaction.Interaction.prototype.getMap = function() {
  return this.map_;
};


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} Whether the map browser event should continue
 *     through the chain of interactions. false means stop, true
 *     means continue.
 */
ol.interaction.Interaction.prototype.handleMapBrowserEvent =
    goog.abstractMethod;


/**
 * Remove the interaction from its current map and attach it to the new map.
 * Subclasses may set up event handlers to get notified about changes to
 * the map here.
 * @param {ol.Map} map Map.
 */
ol.interaction.Interaction.prototype.setMap = function(map) {
  this.map_ = map;
};


/**
 * @param {ol.Map} map Map.
 * @param {ol.IView2D} view View.
 * @param {ol.Coordinate} delta Delta.
 * @param {number=} opt_duration Duration.
 */
ol.interaction.Interaction.pan = function(
    map, view, delta, opt_duration) {
  goog.asserts.assertInstanceof(view, ol.View2D);
  var currentCenter = view.getCenter();
  if (goog.isDef(currentCenter)) {
    if (goog.isDef(opt_duration) && opt_duration > 0) {
      map.beforeRender(ol.animation.pan({
        source: currentCenter,
        duration: opt_duration,
        easing: ol.easing.linear
      }));
    }
    var center = view.constrainCenter(
        [currentCenter[0] + delta[0], currentCenter[1] + delta[1]]);
    view.setCenter(center);
  }
};


/**
 * @param {ol.Map} map Map.
 * @param {ol.IView2D} view View.
 * @param {number|undefined} rotation Rotation.
 * @param {ol.Coordinate=} opt_anchor Anchor coordinate.
 * @param {number=} opt_duration Duration.
 */
ol.interaction.Interaction.rotate =
    function(map, view, rotation, opt_anchor, opt_duration) {
  goog.asserts.assertInstanceof(view, ol.View2D);
  rotation = view.constrainRotation(rotation, 0);
  ol.interaction.Interaction.rotateWithoutConstraints(
      map, view, rotation, opt_anchor, opt_duration);
};


/**
 * @param {ol.Map} map Map.
 * @param {ol.IView2D} view View.
 * @param {number|undefined} rotation Rotation.
 * @param {ol.Coordinate=} opt_anchor Anchor coordinate.
 * @param {number=} opt_duration Duration.
 */
ol.interaction.Interaction.rotateWithoutConstraints =
    function(map, view, rotation, opt_anchor, opt_duration) {
  goog.asserts.assertInstanceof(view, ol.View2D);
  if (goog.isDefAndNotNull(rotation)) {
    var currentRotation = view.getRotation();
    var currentCenter = view.getCenter();
    if (goog.isDef(currentRotation) && goog.isDef(currentCenter) &&
        goog.isDef(opt_duration) && opt_duration > 0) {
      map.beforeRender(ol.animation.rotate({
        rotation: currentRotation,
        duration: opt_duration,
        easing: ol.easing.easeOut
      }));
      if (goog.isDef(opt_anchor)) {
        map.beforeRender(ol.animation.pan({
          source: currentCenter,
          duration: opt_duration,
          easing: ol.easing.easeOut
        }));
      }
    }
    goog.asserts.assertInstanceof(view, ol.View2D);
    view.rotate(rotation, opt_anchor);
  }
};


/**
 * @param {ol.Map} map Map.
 * @param {ol.IView2D} view View.
 * @param {number|undefined} resolution Resolution to go to.
 * @param {ol.Coordinate=} opt_anchor Anchor coordinate.
 * @param {number=} opt_duration Duration.
 * @param {number=} opt_direction Zooming direction; > 0 indicates
 *     zooming out, in which case the constraints system will select
 *     the largest nearest resolution; < 0 indicates zooming in, in
 *     which case the constraints system will select the smallest
 *     nearest resolution; == 0 indicates that the zooming direction
 *     is unknown/not relevant, in which case the constraints system
 *     will select the nearest resolution. If not defined 0 is
 *     assumed.
 */
ol.interaction.Interaction.zoom =
    function(map, view, resolution, opt_anchor, opt_duration, opt_direction) {
  goog.asserts.assertInstanceof(view, ol.View2D);
  resolution = view.constrainResolution(resolution, 0, opt_direction);
  ol.interaction.Interaction.zoomWithoutConstraints(
      map, view, resolution, opt_anchor, opt_duration);
};


/**
 * @param {ol.Map} map Map.
 * @param {ol.IView2D} view View.
 * @param {number} delta Delta from previous zoom level.
 * @param {ol.Coordinate=} opt_anchor Anchor coordinate.
 * @param {number=} opt_duration Duration.
 */
ol.interaction.Interaction.zoomByDelta =
    function(map, view, delta, opt_anchor, opt_duration) {
  goog.asserts.assertInstanceof(view, ol.View2D);
  var currentResolution = view.getResolution();
  var resolution = view.constrainResolution(currentResolution, delta, 0);
  ol.interaction.Interaction.zoomWithoutConstraints(
      map, view, resolution, opt_anchor, opt_duration);
};


/**
 * @param {ol.Map} map Map.
 * @param {ol.IView2D} view View.
 * @param {number|undefined} resolution Resolution to go to.
 * @param {ol.Coordinate=} opt_anchor Anchor coordinate.
 * @param {number=} opt_duration Duration.
 */
ol.interaction.Interaction.zoomWithoutConstraints =
    function(map, view, resolution, opt_anchor, opt_duration) {
  goog.asserts.assertInstanceof(view, ol.View2D);
  if (goog.isDefAndNotNull(resolution)) {
    var currentResolution = view.getResolution();
    var currentCenter = view.getCenter();
    if (goog.isDef(currentResolution) && goog.isDef(currentCenter) &&
        goog.isDef(opt_duration) && opt_duration > 0) {
      map.beforeRender(ol.animation.zoom({
        resolution: currentResolution,
        duration: opt_duration,
        easing: ol.easing.easeOut
      }));
      if (goog.isDef(opt_anchor)) {
        map.beforeRender(ol.animation.pan({
          source: currentCenter,
          duration: opt_duration,
          easing: ol.easing.easeOut
        }));
      }
    }
    goog.asserts.assertInstanceof(view, ol.View2D);
    if (goog.isDefAndNotNull(opt_anchor)) {
      var center = view.calculateCenterZoom(resolution, opt_anchor);
      view.setCenter(center);
    }
    view.setResolution(resolution);
  }
};
