goog.provide('ol3.interaction.DblClickZoom');

goog.require('goog.events.EventType');
goog.require('ol3.Interaction');
goog.require('ol3.MapBrowserEvent');
goog.require('ol3.interaction.Constraints');



/**
 * @constructor
 * @extends {ol3.Interaction}
 * @param {ol3.interaction.Constraints} constraints Constraints.
 */
ol3.interaction.DblClickZoom = function(constraints) {
  goog.base(this, constraints);
};
goog.inherits(ol3.interaction.DblClickZoom, ol3.Interaction);


/**
 * @inheritDoc
 */
ol3.interaction.DblClickZoom.prototype.handleMapBrowserEvent =
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
