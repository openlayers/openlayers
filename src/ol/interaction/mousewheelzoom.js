goog.provide('ol.interaction.MouseWheelZoom');

goog.require('goog.events.MouseWheelEvent');
goog.require('goog.events.MouseWheelHandler.EventType');
goog.require('ol.MapBrowserEvent');



/**
 * @constructor
 * @extends {ol.interaction.Interaction}
 */
ol.interaction.MouseWheelZoom = function() {
  goog.base(this);
};
goog.inherits(ol.interaction.MouseWheelZoom, ol.interaction.Interaction);


/**
 * @inheritDoc
 */
ol.interaction.MouseWheelZoom.prototype.handleMapBrowserEvent =
    function(mapBrowserEvent) {
  if (mapBrowserEvent.type ==
      goog.events.MouseWheelHandler.EventType.MOUSEWHEEL) {
    var map = mapBrowserEvent.map;
    var mouseWheelEvent = /** @type {goog.events.MouseWheelEvent} */
        mapBrowserEvent.browserEvent;
    goog.asserts.assert(mouseWheelEvent instanceof goog.events.MouseWheelEvent);
    var anchor = mapBrowserEvent.getCoordinate();
    var oldResolution = map.getResolution();
    var factor = Math.exp(Math.log(2) / 4);
    if (mouseWheelEvent.deltaY < 0) {
      factor = 1 / factor;
    }
    map.zoomToResolution(oldResolution * factor, anchor);
    mapBrowserEvent.preventDefault();
    mouseWheelEvent.preventDefault();
  }
};
