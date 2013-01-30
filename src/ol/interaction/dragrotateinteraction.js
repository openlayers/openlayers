goog.provide('ol.interaction.DragRotate');

goog.require('ol.MapBrowserEvent');
goog.require('ol.View2D');
goog.require('ol.interaction.ConditionType');
goog.require('ol.interaction.Drag');



/**
 * @constructor
 * @extends {ol.interaction.Drag}
 * @param {ol.interaction.ConditionType} condition Condition.
 */
ol.interaction.DragRotate = function(condition) {

  goog.base(this);

  /**
   * @private
   * @type {ol.interaction.ConditionType}
   */
  this.condition_ = condition;

  /**
   * @private
   * @type {number}
   */
  this.startRotation_ = 0;

};
goog.inherits(ol.interaction.DragRotate, ol.interaction.Drag);


/**
 * @inheritDoc
 */
ol.interaction.DragRotate.prototype.handleDrag = function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  var map = mapBrowserEvent.map;
  var size = map.getSize();
  var offset = mapBrowserEvent.getPixel();
  var theta = Math.atan2(
      size.height / 2 - offset.y,
      offset.x - size.width / 2);
  // FIXME supports View2D only
  var view = map.getView();
  goog.asserts.assert(view instanceof ol.View2D);
  map.requestRenderFrame();
  view.rotate(map, this.startRotation_, -theta);
};


/**
 * @inheritDoc
 */
ol.interaction.DragRotate.prototype.handleDragStart =
    function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  var map = mapBrowserEvent.map;
  // FIXME supports View2D only
  var view = map.getView();
  goog.asserts.assert(view instanceof ol.View2D);
  if (browserEvent.isMouseActionButton() && this.condition_(browserEvent)) {
    map.requestRenderFrame();
    var size = map.getSize();
    var offset = mapBrowserEvent.getPixel();
    var theta = Math.atan2(
        size.height / 2 - offset.y,
        offset.x - size.width / 2);
    this.startRotation_ = (view.getRotation() || 0) + theta;
    return true;
  } else {
    return false;
  }
};
