// FIXME cope with rotation

goog.provide('ol.control.DragPan');

goog.require('ol.Coordinate');
goog.require('ol.MapBrowserEvent');
goog.require('ol.control.CenterConstraint');
goog.require('ol.control.CenterConstraintType');
goog.require('ol.control.Drag');



/**
 * @constructor
 * @extends {ol.control.Drag}
 * @param {ol.control.CenterConstraintType=} opt_centerConstraint
 *     Center constraint.
 */
ol.control.DragPan = function(opt_centerConstraint) {

  goog.base(this);

  /**
   * @private
   * @type {ol.control.CenterConstraintType|undefined}
   */
  this.centerConstraint_ =
      opt_centerConstraint || ol.control.CenterConstraint.none;

};
goog.inherits(ol.control.DragPan, ol.control.Drag);


/**
 * @inheritDoc
 */
ol.control.DragPan.prototype.handleDrag = function(mapBrowserEvent) {
  var map = mapBrowserEvent.map;
  var resolution = map.getResolution();
  var delta =
      new ol.Coordinate(-resolution * this.deltaX, resolution * this.deltaY);
  var center = this.centerConstraint_(this.startCenter, resolution, delta);
  map.setCenter(center);
};


/**
 * @inheritDoc
 */
ol.control.DragPan.prototype.handleDragStart = function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  if (!browserEvent.shiftKey) {
    browserEvent.preventDefault();
    return true;
  } else {
    return false;
  }
};
