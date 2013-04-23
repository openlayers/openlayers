goog.provide('ol.interaction.DragRotate');

goog.require('goog.asserts');
goog.require('ol.View2D');
goog.require('ol.ViewHint');
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
  var browserEvent = mapBrowserEvent.browserEvent;
  var map = mapBrowserEvent.map;
  var size = map.getSize();
  var offset = mapBrowserEvent.getPixel();
  var theta = Math.atan2(size.height / 2 - offset.y, offset.x - size.width / 2);
  if (goog.isDef(this.lastAngle_)) {
    var delta = theta - this.lastAngle_;
    var view = map.getView();
    // FIXME supports View2D only
    goog.asserts.assertInstanceof(view, ol.View2D);
    map.requestRenderFrame();
    ol.interaction.Interaction.rotateWithoutConstraints(
        map, view, view.getRotation() - delta);
  }
  this.lastAngle_ = theta;
};


/**
 * @inheritDoc
 */
ol.interaction.DragRotate.prototype.handleDragEnd = function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  var map = mapBrowserEvent.map;
  // FIXME supports View2D only
  var view = map.getView();
  goog.asserts.assertInstanceof(view, ol.View2D);
  ol.interaction.Interaction.rotate(map, view, view.getRotation(), undefined,
      ol.interaction.DRAGROTATE_ANIMATION_DURATION);
  view.setHint(ol.ViewHint.INTERACTING, -1);
};


/**
 * @inheritDoc
 */
ol.interaction.DragRotate.prototype.handleDragStart =
    function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  if (browserEvent.isMouseActionButton() && this.condition_(browserEvent)) {
    var map = mapBrowserEvent.map;
    // FIXME supports View2D only
    var view = map.getView();
    goog.asserts.assertInstanceof(view, ol.View2D);
    map.requestRenderFrame();
    this.lastAngle_ = undefined;
    view.setHint(ol.ViewHint.INTERACTING, 1);
    return true;
  } else {
    return false;
  }
};
