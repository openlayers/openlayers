// FIXME draw drag box
// FIXME works for View2D only

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
    map.withFrozenRendering(function() {
      // FIXME works for View2D only
      var view = map.getView();
      goog.asserts.assert(view instanceof ol.View2D);
      var mapSize = /** @type {ol.Size} */ (map.getSize());
      view.fitExtent(extent, mapSize);
      if (map.canRotate()) {
        // FIXME we don't set the rotation if the map doesn't
        // support rotation, this will prevent any map using
        // that view from rotating, which may not be desired
        view.setRotation(0);
      }
    });
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
