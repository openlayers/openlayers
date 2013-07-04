// FIXME factor out key precondition (shift et. al)

goog.provide('ol.interaction.Interaction');

goog.require('ol.MapBrowserEvent');
goog.require('ol.animation');
goog.require('ol.easing');



/**
 * @constructor
 */
ol.interaction.Interaction = function() {
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
 * @param {ol.Map} map Map.
 * @param {ol.View2D} view View.
 * @param {ol.Coordinate} delta Delta.
 * @param {number=} opt_duration Duration.
 */
ol.interaction.Interaction.pan = function(
    map, view, delta, opt_duration) {
  var currentCenter = view.getCenter();
  if (goog.isDef(currentCenter)) {
    if (goog.isDef(opt_duration)) {
      map.addPreRenderFunction(ol.animation.pan({
        source: currentCenter,
        duration: opt_duration,
        easing: ol.easing.linear
      }));
    }
    view.setCenter([currentCenter[0] + delta[0], currentCenter[1] + delta[1]]);
  }
};


/**
 * @param {ol.Map} map Map.
 * @param {ol.View2D} view View.
 * @param {number|undefined} rotation Rotation.
 * @param {ol.Coordinate=} opt_anchor Anchor coordinate.
 * @param {number=} opt_duration Duration.
 */
ol.interaction.Interaction.rotate =
    function(map, view, rotation, opt_anchor, opt_duration) {
  rotation = view.constrainRotation(rotation, 0);
  ol.interaction.Interaction.rotateWithoutConstraints(
      map, view, rotation, opt_anchor, opt_duration);
};


/**
 * @param {ol.Map} map Map.
 * @param {ol.View2D} view View.
 * @param {number|undefined} rotation Rotation.
 * @param {ol.Coordinate=} opt_anchor Anchor coordinate.
 * @param {number=} opt_duration Duration.
 */
ol.interaction.Interaction.rotateWithoutConstraints =
    function(map, view, rotation, opt_anchor, opt_duration) {
  if (goog.isDefAndNotNull(rotation)) {
    var currentRotation = view.getRotation();
    var currentCenter = view.getCenter();
    if (goog.isDef(currentRotation) && goog.isDef(currentCenter) &&
        goog.isDef(opt_duration)) {
      map.addPreRenderFunction(ol.animation.rotate({
        rotation: currentRotation,
        duration: opt_duration,
        easing: ol.easing.easeOut
      }));
      if (goog.isDef(opt_anchor)) {
        map.addPreRenderFunction(ol.animation.pan({
          source: currentCenter,
          duration: opt_duration,
          easing: ol.easing.easeOut
        }));
      }
    }
    if (goog.isDefAndNotNull(opt_anchor)) {
      var center = view.calculateCenterRotate(rotation, opt_anchor);
      map.withFrozenRendering(function() {
        view.setCenter(center);
        view.setRotation(rotation);
      });
    } else {
      view.setRotation(rotation);
    }
  }
};


/**
 * @param {ol.Map} map Map.
 * @param {ol.View2D} view View.
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
  resolution = view.constrainResolution(resolution, 0, opt_direction);
  ol.interaction.Interaction.zoomWithoutConstraints(
      map, view, resolution, opt_anchor, opt_duration);
};


/**
 * @param {ol.Map} map Map.
 * @param {ol.View2D} view View.
 * @param {number} delta Delta from previous zoom level.
 * @param {ol.Coordinate=} opt_anchor Anchor coordinate.
 * @param {number=} opt_duration Duration.
 */
ol.interaction.Interaction.zoomByDelta =
    function(map, view, delta, opt_anchor, opt_duration) {
  var currentResolution = view.getResolution();
  var resolution = view.constrainResolution(currentResolution, delta, 0);
  ol.interaction.Interaction.zoomWithoutConstraints(
      map, view, resolution, opt_anchor, opt_duration);
};


/**
 * @param {ol.Map} map Map.
 * @param {ol.View2D} view View.
 * @param {number|undefined} resolution Resolution to go to.
 * @param {ol.Coordinate=} opt_anchor Anchor coordinate.
 * @param {number=} opt_duration Duration.
 */
ol.interaction.Interaction.zoomWithoutConstraints =
    function(map, view, resolution, opt_anchor, opt_duration) {
  if (goog.isDefAndNotNull(resolution)) {
    var currentResolution = view.getResolution();
    var currentCenter = view.getCenter();
    if (goog.isDef(currentResolution) && goog.isDef(currentCenter) &&
        goog.isDef(opt_duration)) {
      map.addPreRenderFunction(ol.animation.zoom({
        resolution: currentResolution,
        duration: opt_duration,
        easing: ol.easing.easeOut
      }));
      if (goog.isDef(opt_anchor)) {
        map.addPreRenderFunction(ol.animation.pan({
          source: currentCenter,
          duration: opt_duration,
          easing: ol.easing.easeOut
        }));
      }
    }
    if (goog.isDefAndNotNull(opt_anchor)) {
      var center = view.calculateCenterZoom(resolution, opt_anchor);
      map.withFrozenRendering(function() {
        view.setCenter(center);
        view.setResolution(resolution);
      });
    } else {
      view.setResolution(resolution);
    }
  }
};
