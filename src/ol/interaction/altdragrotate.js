goog.provide('ol.interaction.AltDragRotate');

goog.require('ol.MapBrowserEvent');
goog.require('ol.interaction.Drag');



/**
 * @constructor
 * @extends {ol.interaction.Drag}
 */
ol.interaction.AltDragRotate = function() {

  goog.base(this);

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
  var offset = mapBrowserEvent.getPixel();
  var theta = Math.atan2(
      size.height / 2 - offset.y,
      offset.x - size.width / 2);
  map.rotate(this.startRotation_, -theta);
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
    var offset = mapBrowserEvent.getPixel();
    var theta = Math.atan2(
        size.height / 2 - offset.y,
        offset.x - size.width / 2);
    this.startRotation_ = (map.getRotation() || 0) + theta;
    return true;
  } else {
    return false;
  }
};
