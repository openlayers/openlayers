goog.provide('ol.control.DblClickZoom');

goog.require('goog.events.EventType');
goog.require('ol.Control');
goog.require('ol.MapBrowserEvent');



/**
 * @constructor
 * @extends {ol.Control}
 */
ol.control.DblClickZoom = function() {
  goog.base(this);
};
goog.inherits(ol.control.DblClickZoom, ol.Control);


/**
 * @inheritDoc
 */
ol.control.DblClickZoom.prototype.handleMapBrowserEvent =
    function(mapBrowserEvent) {
  if (mapBrowserEvent.type == goog.events.EventType.DBLCLICK) {
    var map = mapBrowserEvent.map;
    map.whileFrozen(function() {
      // FIXME compute correct center for zoom
      map.setCenter(mapBrowserEvent.getCoordinate());
      var browserEvent = mapBrowserEvent.browserEvent;
      var scale = browserEvent.shiftKey ? 2 : 0.5;
      map.setResolution(scale * map.getResolution());
    });
    mapBrowserEvent.preventDefault();
  }
};
