goog.provide('ol.interaction.AltDragRotate');

goog.require('ol.MapBrowserEvent');
goog.require('ol.interaction.Drag');



/**
 * @constructor
 * @extends {ol.interaction.Drag}
 * @param {ol.interaction.Constraints} constraints Constraints.
 */
ol.interaction.AltDragRotate = function(constraints) {

  goog.base(this, constraints);

  /**
   * @private
   * @type {number}
   */
  this.startRotation_ = 0;

};
goog.inherits(ol.interaction.AltDragRotate, ol.interaction.Drag);


/**
 * @inheritDoc
 */
ol.interaction.AltDragRotate.prototype.handleDrag = function(mapBrowserEvent) {
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
ol.interaction.AltDragRotate.prototype.handleDragStart =
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
    return true;
  } else {
    return false;
  }
};
