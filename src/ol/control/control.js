// FIXME factor out key precondition (shift et. al)

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
