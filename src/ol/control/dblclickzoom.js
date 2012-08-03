goog.provide('ol.control.DblClickZoom');

goog.require('goog.events.EventType');
goog.require('ol.Control');
goog.require('ol.MapBrowserEvent');
goog.require('ol.control.ResolutionConstraintType');



/**
 * @constructor
 * @extends {ol.Control}
 * @param {ol.control.ResolutionConstraintType} resolutionConstraint
 *     Resolution constraint.
 */
ol.control.DblClickZoom = function(resolutionConstraint) {

  goog.base(this);

  /**
   * @private
   * @type {ol.control.ResolutionConstraintType}
   */
  this.resolutionConstraint_ = resolutionConstraint;

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
      var resolution = this.resolutionConstraint_(map.getResolution(), delta);
      map.setResolution(resolution);
    }, this);
    mapBrowserEvent.preventDefault();
  }
};
