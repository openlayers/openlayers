goog.provide('ol.control.MouseWheelZoom');

goog.require('goog.events.MouseWheelEvent');
goog.require('goog.events.MouseWheelHandler.EventType');
goog.require('ol.MapBrowserEvent');
goog.require('ol.control.Constraints');



/**
 * @constructor
 * @extends {ol.Control}
 * @param {ol.control.Constraints} constraints Constraints.
 */
ol.control.MouseWheelZoom = function(constraints) {
  goog.base(this, constraints);
};
goog.inherits(ol.control.MouseWheelZoom, ol.Control);


/**
 * @inheritDoc
 */
ol.control.MouseWheelZoom.prototype.handleMapBrowserEvent =
    function(mapBrowserEvent) {
  if (mapBrowserEvent.type ==
      goog.events.MouseWheelHandler.EventType.MOUSEWHEEL) {
    var map = mapBrowserEvent.map;
    var mouseWheelEvent = /** @type {goog.events.MouseWheelEvent} */
        mapBrowserEvent.browserEvent;
    goog.asserts.assert(mouseWheelEvent instanceof goog.events.MouseWheelEvent);
    if (mouseWheelEvent.deltaY !== 0) {
      var delta = mouseWheelEvent.deltaY < 0 ? 1 : -1;
      var anchor = mapBrowserEvent.getCoordinate();
      this.zoom(map, delta, anchor);
      mapBrowserEvent.preventDefault();
      mouseWheelEvent.preventDefault();
    }
  }
};
