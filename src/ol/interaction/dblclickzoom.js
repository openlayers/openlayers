goog.provide('ol.interaction.DblClickZoom');

goog.require('ol.MapBrowserEvent');
goog.require('ol.MapBrowserEvent.EventType');
goog.require('ol.interaction.Interaction');



/**
 * @constructor
 * @extends {ol.interaction.Interaction}
 */
ol.interaction.DblClickZoom = function() {
  goog.base(this);
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
    var anchor = mapBrowserEvent.getCoordinate();
    var delta = mapBrowserEvent.browserEvent.shiftKey ? -4 : 4;
    map.zoom(delta, anchor);
    mapBrowserEvent.preventDefault();
  }
};
