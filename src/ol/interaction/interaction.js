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
      map.requestRenderFrame();
      map.addPreRenderFunction(ol.animation.pan({
        source: currentCenter,
        duration: opt_duration,
        easing: ol.easing.linear
      }));
    }
    view.setCenter([currentCenter[0] + delta[0], currentCenter[1] + delta[1]]);
  }
};
