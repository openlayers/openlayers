// FIXME draw drag box
// FIXME works for View2D only

goog.provide('ol.interaction.DragZoom');

goog.require('goog.asserts');
goog.require('ol.Size');
goog.require('ol.View2D');
goog.require('ol.control.DragBox');
goog.require('ol.events.ConditionType');
goog.require('ol.events.condition');
goog.require('ol.extent');
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
 * Allows the user to zoom the map by clicking and dragging on the map,
 * normally combined with an {@link ol.events.condition} that limits
 * it to when the shift key is held down.
 * @constructor
 * @extends {ol.interaction.Drag}
 * @param {ol.interaction.DragZoomOptions=} opt_options Options.
 * @todo stability experimental
 */
ol.interaction.DragZoom = function(opt_options) {

  goog.base(this);

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @private
   * @type {ol.events.ConditionType}
   */
  this.condition_ = goog.isDef(options.condition) ?
      options.condition : ol.events.condition.shiftKeyOnly;

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
    var extent = ol.extent.boundingExtent(
        [this.startCoordinate, mapBrowserEvent.getCoordinate()]);
    map.withFrozenRendering(function() {
      // FIXME works for View2D only
      var view = map.getView();
      goog.asserts.assertInstanceof(view, ol.View2D);
      var mapSize = /** @type {ol.Size} */ (map.getSize());
      view.fitExtent(extent, mapSize);
      // FIXME we should preserve rotation
      view.setRotation(0);
    });
  }
};


/**
 * @inheritDoc
 */
ol.interaction.DragZoom.prototype.handleDragStart =
    function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  if (browserEvent.isMouseActionButton() && this.condition_(mapBrowserEvent)) {
    this.dragBox_ = new ol.control.DragBox({
      startCoordinate: this.startCoordinate
    });
    this.dragBox_.setMap(mapBrowserEvent.map);
    return true;
  } else {
    return false;
  }
};
