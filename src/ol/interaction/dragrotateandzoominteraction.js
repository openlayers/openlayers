// FIXME works for View2D only

goog.provide('ol.interaction.DragRotateAndZoom');

goog.require('goog.math.Vec2');
goog.require('ol.View2D');
goog.require('ol.interaction.ConditionType');
goog.require('ol.interaction.Drag');



/**
 * @constructor
 * @extends {ol.interaction.Drag}
 * @param {ol.interaction.ConditionType} condition Condition.
 */
ol.interaction.DragRotateAndZoom = function(condition) {

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
  this.startRatio_ = 0;

  /**
   * @private
   * @type {number}
   */
  this.startRotation_ = 0;

};
goog.inherits(ol.interaction.DragRotateAndZoom, ol.interaction.Drag);


/**
 * @inheritDoc
 */
ol.interaction.DragRotateAndZoom.prototype.handleDrag =
    function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  var map = mapBrowserEvent.map;
  var size = map.getSize();
  var delta = new goog.math.Vec2(
      browserEvent.offsetX - size.width / 2,
      size.height / 2 - browserEvent.offsetY);
  var theta = Math.atan2(delta.y, delta.x);
  var resolution = this.startRatio_ * delta.magnitude();
  // FIXME works for View2D only
  var view = map.getView();
  goog.asserts.assert(view instanceof ol.View2D);
  map.requestRenderFrame();
  // FIXME the calls to map.rotate and map.zoomToResolution should use
  // map.withFrozenRendering but an assertion fails :-(
  view.rotate(map, this.startRotation_, -theta);
  view.zoomToResolution(map, resolution);
};


/**
 * @inheritDoc
 */
ol.interaction.DragRotateAndZoom.prototype.handleDragStart =
    function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  var map = mapBrowserEvent.map;
  var view = map.getView().getView2D();
  if (this.condition_(browserEvent)) {
    var resolution = view.getResolution();
    var size = map.getSize();
    var delta = new goog.math.Vec2(
        browserEvent.offsetX - size.width / 2,
        size.height / 2 - browserEvent.offsetY);
    var theta = Math.atan2(delta.y, delta.x);
    this.startRotation_ = (view.getRotation() || 0) + theta;
    this.startRatio_ = resolution / delta.magnitude();
    map.requestRenderFrame();
    return true;
  } else {
    return false;
  }
};
