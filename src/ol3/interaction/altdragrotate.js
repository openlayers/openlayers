goog.provide('ol3.interaction.AltDragRotate');

goog.require('ol3.MapBrowserEvent');
goog.require('ol3.interaction.Drag');



/**
 * @constructor
 * @extends {ol3.interaction.Drag}
 * @param {ol3.interaction.Constraints} constraints Constraints.
 */
ol3.interaction.AltDragRotate = function(constraints) {

  goog.base(this, constraints);

  /**
   * @private
   * @type {number}
   */
  this.startRotation_ = 0;

};
goog.inherits(ol3.interaction.AltDragRotate, ol3.interaction.Drag);


/**
 * @inheritDoc
 */
ol3.interaction.AltDragRotate.prototype.handleDrag = function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  var map = mapBrowserEvent.map;
  var size = map.getSize();
  var theta = Math.atan2(
      size.height / 2 - browserEvent.offsetY,
      browserEvent.offsetX - size.width / 2);
  this.rotate(map, this.startRotation_, -theta);
};


/**
 * @inheritDoc
 */
ol3.interaction.AltDragRotate.prototype.handleDragStart =
    function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  var map = mapBrowserEvent.map;
  if (browserEvent.isMouseActionButton() && browserEvent.altKey &&
      map.canRotate()) {
    var size = map.getSize();
    var theta = Math.atan2(
        size.height / 2 - browserEvent.offsetY,
        browserEvent.offsetX - size.width / 2);
    this.startRotation_ = (map.getRotation() || 0) + theta;
    browserEvent.preventDefault();
    return true;
  } else {
    return false;
  }
};
