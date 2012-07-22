// FIXME add keyboard pan
// FIXME add snap-to-pixel pan strategy
// FIXME add rotation control

goog.provide('ol.Control');

goog.require('ol.MapBrowserEvent');



/**
 * @constructor
 */
ol.Control = function() {
};


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 */
ol.Control.prototype.handleMapBrowserEvent = goog.abstractMethod;
