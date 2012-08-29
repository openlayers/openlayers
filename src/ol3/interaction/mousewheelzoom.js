goog.provide('ol3.interaction.MouseWheelZoom');

goog.require('goog.events.MouseWheelEvent');
goog.require('goog.events.MouseWheelHandler.EventType');
goog.require('ol3.MapBrowserEvent');
goog.require('ol3.interaction.Constraints');



/**
 * @constructor
 * @extends {ol3.Interaction}
 * @param {ol3.interaction.Constraints} constraints Constraints.
 */
ol3.interaction.MouseWheelZoom = function(constraints) {
  goog.base(this, constraints);
};
goog.inherits(ol3.interaction.MouseWheelZoom, ol3.Interaction);


/**
 * @inheritDoc
 */
ol3.interaction.MouseWheelZoom.prototype.handleMapBrowserEvent =
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
