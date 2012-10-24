goog.provide('ol.interaction.DblClickZoom');

goog.require('ol.MapBrowserEvent');
goog.require('ol.MapBrowserEvent.EventType');
goog.require('ol.interaction.Interaction');



/**
 * @constructor
 * @extends {ol.interaction.Interaction}
 * @param {number} delta The zoom delta applied on each double click.
 */
ol.interaction.DblClickZoom = function(delta) {
  /**
   * @private
   * @type {number}
   */
  this.delta_ = delta;

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
    var delta = mapBrowserEvent.browserEvent.shiftKey ?
        -this.delta_ : this.delta_;
    map.zoom(delta, anchor);
    mapBrowserEvent.preventDefault();
    browserEvent.preventDefault();
  }
};
