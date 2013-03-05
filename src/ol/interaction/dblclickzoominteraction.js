// FIXME works for View2D only

goog.provide('ol.interaction.DblClickZoom');

goog.require('ol.MapBrowserEvent');
goog.require('ol.MapBrowserEvent.EventType');
goog.require('ol.View2D');
goog.require('ol.interaction.Interaction');


/**
 * @define {number} Animation duration.
 */
ol.interaction.DBLCLICKZOOM_ANIMATION_DURATION = 250;



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
    // FIXME works for View2D only
    var view = map.getView();
    goog.asserts.assert(view instanceof ol.View2D);
    view.zoomByDelta(map, delta, anchor,
        ol.interaction.DBLCLICKZOOM_ANIMATION_DURATION);
    mapBrowserEvent.preventDefault();
    browserEvent.preventDefault();
  }
};
