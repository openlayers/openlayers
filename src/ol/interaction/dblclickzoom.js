goog.provide('ol.interaction.DblClickZoom');

goog.require('goog.events.EventType');
goog.require('ol.Interaction');
goog.require('ol.MapBrowserEvent');
goog.require('ol.interaction.Constraints');



/**
 * @constructor
 * @extends {ol.Interaction}
 * @param {ol.interaction.Constraints} constraints Constraints.
 */
ol.interaction.DblClickZoom = function(constraints) {
  goog.base(this, constraints);
};
goog.inherits(ol.interaction.DblClickZoom, ol.Interaction);


/**
 * @inheritDoc
 */
ol.interaction.DblClickZoom.prototype.handleMapBrowserEvent =
    function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  if (browserEvent.type == goog.events.EventType.DBLCLICK &&
      browserEvent.isMouseActionButton()) {
    var map = mapBrowserEvent.map;
    var resolution = map.getResolution();
    var delta = mapBrowserEvent.browserEvent.shiftKey ? -1 : 1;
    var anchor = mapBrowserEvent.getCoordinate();
    this.zoom(map, resolution, delta, anchor);
    mapBrowserEvent.preventDefault();
  }
};
