// FIXME works for View2D only

goog.provide('ol.interaction.DragPan');

goog.require('goog.asserts');
goog.require('ol.Coordinate');
goog.require('ol.MapBrowserEvent');
goog.require('ol.View2D');
goog.require('ol.ViewHint');
goog.require('ol.interaction.ConditionType');
goog.require('ol.interaction.Drag');



/**
 * @constructor
 * @extends {ol.interaction.Drag}
 * @param {ol.interaction.ConditionType} condition Condition.
 */
ol.interaction.DragPan = function(condition) {

  goog.base(this);

  /**
   * @private
   * @type {ol.interaction.ConditionType}
   */
  this.condition_ = condition;

};
goog.inherits(ol.interaction.DragPan, ol.interaction.Drag);


/**
 * @inheritDoc
 */
ol.interaction.DragPan.prototype.handleDrag = function(mapBrowserEvent) {
  var map = mapBrowserEvent.map;
  // FIXME works for View2D only
  var view = map.getView();
  goog.asserts.assert(view instanceof ol.View2D);
  var resolution = view.getResolution();
  var rotation = view.getRotation();
  var delta =
      new ol.Coordinate(-resolution * this.deltaX, resolution * this.deltaY);
  if (map.canRotate() && goog.isDef(rotation)) {
    delta.rotate(rotation);
  }
  var newCenter = new ol.Coordinate(
      this.startCenter.x + delta.x, this.startCenter.y + delta.y);
  map.requestRenderFrame();
  view.setCenter(newCenter);
};


/**
 * @inheritDoc
 */
ol.interaction.DragPan.prototype.handleDragStart = function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  if (this.condition_(browserEvent)) {
    mapBrowserEvent.map.requestRenderFrame();
    return true;
  } else {
    return false;
  }
};
