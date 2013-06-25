goog.provide('ol.interaction.DragRotate');

goog.require('goog.asserts');
goog.require('ol.interaction.ConditionType');
goog.require('ol.interaction.Drag');
goog.require('ol.interaction.Interaction');
goog.require('ol.interaction.condition');


/**
 * @define {number} Animation duration.
 */
ol.interaction.DRAGROTATE_ANIMATION_DURATION = 250;



/**
 * @constructor
 * @extends {ol.interaction.Drag}
 * @param {ol.interaction.DragRotateOptions=} opt_options Options.
 */
ol.interaction.DragRotate = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  goog.base(this);

  /**
   * @private
   * @type {ol.interaction.ConditionType}
   */
  this.condition_ = goog.isDef(options.condition) ?
      options.condition : ol.interaction.condition.altShiftKeysOnly;

  /**
   * @private
   * @type {number|undefined}
   */
  this.lastAngle_ = undefined;

};
goog.inherits(ol.interaction.DragRotate, ol.interaction.Drag);


/**
 * @inheritDoc
 */
ol.interaction.DragRotate.prototype.handleDrag = function(mapBrowserEvent) {
  var map = mapBrowserEvent.map;
  var size = map.getSize();
  var offset = mapBrowserEvent.getPixel();
  var theta =
      Math.atan2(size[1] / 2 - offset[1], offset[0] - size[0] / 2);
  if (goog.isDef(this.lastAngle_)) {
    var delta = theta - this.lastAngle_;
    // FIXME works for View2D only
    var view = map.getView().getView2D();
    var view2DState = view.getView2DState();
    map.requestRenderFrame();
    ol.interaction.Interaction.rotateWithoutConstraints(
        map, view, view2DState.rotation - delta);
  }
  this.lastAngle_ = theta;
};


/**
 * @inheritDoc
 */
ol.interaction.DragRotate.prototype.handleDragEnd = function(mapBrowserEvent) {
  var map = mapBrowserEvent.map;
  // FIXME works for View2D only
  var view = map.getView().getView2D();
  var view2DState = view.getView2DState();
  ol.interaction.Interaction.rotate(map, view, view2DState.rotation, undefined,
      ol.interaction.DRAGROTATE_ANIMATION_DURATION);
};


/**
 * @inheritDoc
 */
ol.interaction.DragRotate.prototype.handleDragStart =
    function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  if (browserEvent.isMouseActionButton() && this.condition_(browserEvent)) {
    var map = mapBrowserEvent.map;
    map.requestRenderFrame();
    this.lastAngle_ = undefined;
    return true;
  } else {
    return false;
  }
};
