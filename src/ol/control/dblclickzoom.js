goog.provide('ol.control.DblClickZoom');

goog.require('goog.events.EventType');
goog.require('ol.Control');
goog.require('ol.MapBrowserEvent');
goog.require('ol.control.Constraints');



/**
 * @constructor
 * @extends {ol.Control}
 * @param {ol.control.Constraints} constraints Constraints.
 */
ol.control.DblClickZoom = function(constraints) {
  goog.base(this, constraints);
};
goog.inherits(ol.control.DblClickZoom, ol.Control);


/**
 * @inheritDoc
 */
ol.control.DblClickZoom.prototype.handleMapBrowserEvent =
    function(mapBrowserEvent) {
  if (mapBrowserEvent.type == goog.events.EventType.DBLCLICK) {
    var map = mapBrowserEvent.map;
    var delta = mapBrowserEvent.browserEvent.shiftKey ? -1 : 1;
    var anchor = mapBrowserEvent.getCoordinate();
    this.zoom(map, delta, anchor);
    mapBrowserEvent.preventDefault();
  }
};
