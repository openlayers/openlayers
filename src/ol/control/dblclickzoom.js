goog.provide('ol.control.DblClickZoom');

goog.require('goog.events.EventType');
goog.require('ol.Control');
goog.require('ol.MapBrowserEvent');
goog.require('ol.control.ZoomFunctionType');



/**
 * @constructor
 * @extends {ol.Control}
 * @param {ol.control.ZoomFunctionType} zoomFunction Zoom function.
 */
ol.control.DblClickZoom = function(zoomFunction) {

  goog.base(this);

  /**
   * @private
   * @type {ol.control.ZoomFunctionType}
   */
  this.zoomFunction_ = zoomFunction;

};
goog.inherits(ol.control.DblClickZoom, ol.Control);


/**
 * @inheritDoc
 */
ol.control.DblClickZoom.prototype.handleMapBrowserEvent =
    function(mapBrowserEvent) {
  if (mapBrowserEvent.type == goog.events.EventType.DBLCLICK) {
    var map = mapBrowserEvent.map;
    map.withFrozenRendering(function() {
      // FIXME compute correct center for zoom
      map.setCenter(mapBrowserEvent.getCoordinate());
      var browserEvent = mapBrowserEvent.browserEvent;
      var delta = browserEvent.shiftKey ? -1 : 1;
      var resolution = this.zoomFunction_(map.getResolution(), delta);
      map.setResolution(resolution);
    }, this);
    mapBrowserEvent.preventDefault();
  }
};
