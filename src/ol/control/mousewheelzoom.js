goog.provide('ol.control.MouseWheelZoom');

goog.require('goog.events.MouseWheelEvent');
goog.require('goog.events.MouseWheelHandler.EventType');
goog.require('ol.MapBrowserEvent');



/**
 * @constructor
 * @extends {ol.Control}
 */
ol.control.MouseWheelZoom = function() {
  goog.base(this);
};
goog.inherits(ol.control.MouseWheelZoom, ol.Control);


/**
 * @inheritDoc
 */
ol.control.MouseWheelZoom.prototype.handleMapBrowserEvent = function(event) {
  if (event.type == goog.events.MouseWheelHandler.EventType.MOUSEWHEEL) {
    var map = event.map;
    var mouseWheelEvent = /** @type {goog.events.MouseWheelEvent} */
        event.getBrowserEventObject();
    goog.asserts.assert(mouseWheelEvent instanceof goog.events.MouseWheelEvent);
    if (mouseWheelEvent.deltaY !== 0) {
      map.whileFrozen(function() {
        // FIXME compute correct center for zoom
        map.setCenter(event.getCoordinate());
        var scale = mouseWheelEvent.deltaY < 0 ? 0.5 : 2;
        map.setResolution(scale * map.getResolution());
      });
      event.preventDefault();
      mouseWheelEvent.preventDefault();
    }
  }
};
