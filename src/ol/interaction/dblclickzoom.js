goog.provide('ol.interaction.DblClickZoom');

goog.require('ol.MapBrowserEvent');
goog.require('ol.MapBrowserEvent.EventType');
goog.require('ol.interaction.Constraints');
goog.require('ol.interaction.Interaction');



/**
 * @constructor
 * @extends {ol.interaction.Interaction}
 * @param {ol.interaction.Constraints} constraints Constraints.
 */
ol.interaction.DblClickZoom = function(constraints) {
  goog.base(this, constraints);
};
goog.inherits(ol.interaction.DblClickZoom, ol.interaction.Interaction);


/**
 * @inheritDoc
 */
ol.interaction.DblClickZoom.prototype.handleMapBrowserEvent =
    function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  if (mapBrowserEvent.type == ol.MapBrowserEvent.EventType.DBLCLICK &&
      mapBrowserEvent.isMouseActionButton()) {
    var map = mapBrowserEvent.map;
    var resolution = map.getResolution();
    var delta = mapBrowserEvent.browserEvent.shiftKey ? -1 : 1;
    var anchor = mapBrowserEvent.getCoordinate();
    this.zoom(map, resolution, delta, anchor);
    mapBrowserEvent.preventDefault();
  }
};
