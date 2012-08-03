// FIXME draw drag box

goog.provide('ol.control.ShiftDragZoom');

goog.require('ol.Extent');
goog.require('ol.MapBrowserEvent');
goog.require('ol.control.Drag');
goog.require('ol.control.ResolutionConstraintType');


/**
 * @define {number} Hysterisis pixels.
 */
ol.SHIFT_DRAG_ZOOM_HYSTERESIS_PIXELS = 8;


/**
 * @const {number}
 */
ol.SHIFT_DRAG_ZOOM_HYSTERESIS_PIXELS_SQUARED =
    ol.SHIFT_DRAG_ZOOM_HYSTERESIS_PIXELS * ol.SHIFT_DRAG_ZOOM_HYSTERESIS_PIXELS;



/**
 * @constructor
 * @extends {ol.control.Drag}
 * @param {ol.control.ResolutionConstraintType=} opt_resolutionConstraint
 *     Resolution constraint.
 */
ol.control.ShiftDragZoom = function(opt_resolutionConstraint) {

  goog.base(this);

  /**
   * @private
   * @type {ol.control.ResolutionConstraintType|undefined}
   */
  this.resolutionConstraint_ = opt_resolutionConstraint;

};
goog.inherits(ol.control.ShiftDragZoom, ol.control.Drag);


/**
 * @inheritDoc
 */
ol.control.ShiftDragZoom.prototype.handleDragEnd = function(mapBrowserEvent) {
  if (this.deltaX * this.deltaX + this.deltaY * this.deltaY >=
      ol.SHIFT_DRAG_ZOOM_HYSTERESIS_PIXELS_SQUARED) {
    var map = mapBrowserEvent.map;
    var extent = ol.Extent.boundingExtent(
        this.startCoordinate,
        mapBrowserEvent.getCoordinate());
    var resolution = map.getResolutionForExtent(extent);
    if (goog.isDef(this.resolutionConstraint_)) {
      resolution = this.resolutionConstraint_(resolution, 0);
    }
    map.withFrozenRendering(function() {
      map.setCenter(extent.getCenter());
      map.setResolution(resolution);
    });
  }
};


/**
 * @inheritDoc
 */
ol.control.ShiftDragZoom.prototype.handleDragStart = function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  if (browserEvent.shiftKey) {
    browserEvent.preventDefault();
    return true;
  } else {
    return false;
  }
};
