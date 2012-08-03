goog.provide('ol.control.MouseWheelZoom');

goog.require('goog.events.MouseWheelEvent');
goog.require('goog.events.MouseWheelHandler.EventType');
goog.require('ol.MapBrowserEvent');
goog.require('ol.control.ResolutionConstraintType');



/**
 * @constructor
 * @extends {ol.Control}
 * @param {ol.control.ResolutionConstraintType} resolutionConstraint
 *     Resolution constraint.
 */
ol.control.MouseWheelZoom = function(resolutionConstraint) {

  goog.base(this);

  /**
   * @private
   * @type {ol.control.ResolutionConstraintType}
   */
  this.resolutionConstraint_ = resolutionConstraint;

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
      map.withFrozenRendering(function() {
        // FIXME compute correct center for zoom
        map.setCenter(mapBrowserEvent.getCoordinate());
        var delta = mouseWheelEvent.deltaY < 0 ? 1 : -1;
        var resolution = this.resolutionConstraint_(map.getResolution(), delta);
        map.setResolution(resolution);
      }, this);
      mapBrowserEvent.preventDefault();
      mouseWheelEvent.preventDefault();
    }
  }
};
