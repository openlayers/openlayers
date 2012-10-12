// FIXME draw drag box

goog.provide('ol.interaction.DragZoom');

goog.require('ol.Extent');
goog.require('ol.MapBrowserEvent');
goog.require('ol.control.DragBox');
goog.require('ol.interaction.ConditionType');
goog.require('ol.interaction.Drag');


/**
 * @define {number} Hysterisis pixels.
 */
ol.SHIFT_DRAG_ZOOM_HYSTERESIS_PIXELS = 8;


/**
 * @const {number}
 */
ol.SHIFT_DRAG_ZOOM_HYSTERESIS_PIXELS_SQUARED =
    ol.SHIFT_DRAG_ZOOM_HYSTERESIS_PIXELS *
    ol.SHIFT_DRAG_ZOOM_HYSTERESIS_PIXELS;



/**
 * @constructor
 * @extends {ol.interaction.Drag}
 * @param {ol.interaction.ConditionType} condition Condition.
 */
ol.interaction.DragZoom = function(condition) {

  goog.base(this);

  /**
   * @private
   * @type {ol.interaction.ConditionType}
   */
  this.condition_ = condition;

  /**
   * @type {ol.control.DragBox}
   * @private
   */
  this.dragBox_ = null;


};
goog.inherits(ol.interaction.DragZoom, ol.interaction.Drag);


/**
 * @inheritDoc
 */
ol.interaction.DragZoom.prototype.handleDragEnd =
    function(mapBrowserEvent) {
  this.dragBox_.setMap(null);
  this.dragBox_ = null;
  if (this.deltaX * this.deltaX + this.deltaY * this.deltaY >=
      ol.SHIFT_DRAG_ZOOM_HYSTERESIS_PIXELS_SQUARED) {
    var map = mapBrowserEvent.map;
    var extent = ol.Extent.boundingExtent(
        this.startCoordinate,
        mapBrowserEvent.getCoordinate());
    map.fitExtent(extent);
  }
};


/**
 * @inheritDoc
 */
ol.interaction.DragZoom.prototype.handleDragStart =
    function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  if (browserEvent.isMouseActionButton() && this.condition_(browserEvent)) {
    this.dragBox_ = new ol.control.DragBox({
      map: mapBrowserEvent.map,
      startCoordinate: this.startCoordinate
    });
    return true;
  } else {
    return false;
  }
};
