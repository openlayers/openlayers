// FIXME factor out key precondition (shift et. al)

goog.provide('ol.interaction.Interaction');

goog.require('ol.MapBrowserEvent');



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
