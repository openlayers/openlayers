goog.provide('ol.interaction.MouseWheelZoom');

goog.require('goog.events.MouseWheelEvent');
goog.require('goog.events.MouseWheelHandler.EventType');
goog.require('ol.MapBrowserEvent');
goog.require('ol.interaction.Constraints');



/**
 * @constructor
 * @extends {ol.Interaction}
 * @param {ol.interaction.Constraints} constraints Constraints.
 */
ol.interaction.MouseWheelZoom = function(constraints) {
  goog.base(this, constraints);
};
goog.inherits(ol.interaction.MouseWheelZoom, ol.Interaction);


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
    if (mouseWheelEvent.deltaY !== 0) {
      var delta = mouseWheelEvent.deltaY < 0 ? 1 : -1;
      var resolution = map.getResolution();
      var anchor = mapBrowserEvent.getCoordinate();
      this.zoom(map, resolution, delta, anchor);
      mapBrowserEvent.preventDefault();
      mouseWheelEvent.preventDefault();
    }
  }
};
