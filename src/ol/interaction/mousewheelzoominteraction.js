// FIXME works for View2D only

goog.provide('ol.interaction.MouseWheelZoom');

goog.require('goog.events.MouseWheelEvent');
goog.require('goog.events.MouseWheelHandler.EventType');
goog.require('ol.MapBrowserEvent');
goog.require('ol.View2D');



/**
 * @constructor
 * @extends {ol.interaction.Interaction}
 * @param {number} delta The zoom delta applied on each mousewheel.
 */
ol.interaction.MouseWheelZoom = function(delta) {
  /**
   * @private
   * @type {number}
   */
  this.delta_ = delta;

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
        (mapBrowserEvent.browserEvent);
    goog.asserts.assert(mouseWheelEvent instanceof goog.events.MouseWheelEvent);
    var anchor = mapBrowserEvent.getCoordinate();
    var delta = mouseWheelEvent.deltaY < 0 ? this.delta_ : -this.delta_;
    // FIXME works for View2D only
    var view = map.getView();
    goog.asserts.assert(view instanceof ol.View2D);
    map.requestRenderFrame();
    view.zoom(map, delta, anchor);
    mapBrowserEvent.preventDefault();
    mouseWheelEvent.preventDefault();
  }
};
