goog.provide('ol.control.KeyboardPan');

goog.require('goog.events.KeyCodes');
goog.require('goog.events.KeyHandler.EventType');
goog.require('ol.Control');



/**
 * @constructor
 * @extends {ol.Control}
 */
ol.control.KeyboardPan = function() {
  goog.base(this);
};
goog.inherits(ol.control.KeyboardPan, ol.Control);


/**
 * @inheritDoc
 */
ol.control.KeyboardPan.prototype.handleMapBrowserEvent =
    function(mapBrowserEvent) {
  if (mapBrowserEvent.type == goog.events.KeyHandler.EventType.KEY) {
    var keyEvent = /** @type {goog.events.KeyEvent} */
        mapBrowserEvent.browserEvent;
    var keyCode = keyEvent.keyCode;
    if (keyCode == goog.events.KeyCodes.DOWN ||
        keyCode == goog.events.KeyCodes.LEFT ||
        keyCode == goog.events.KeyCodes.RIGHT ||
        keyCode == goog.events.KeyCodes.UP) {
      var map = mapBrowserEvent.map;
      var center = map.getCenter().clone();
      var delta = 16 * map.getResolution();
      if (keyCode == goog.events.KeyCodes.DOWN) {
        center.y -= delta;
      } else if (keyCode == goog.events.KeyCodes.LEFT) {
        center.x -= delta;
      } else if (keyCode == goog.events.KeyCodes.RIGHT) {
        center.x += delta;
      } else if (keyCode == goog.events.KeyCodes.UP) {
        center.y += delta;
      }
      map.setCenter(center);
      keyEvent.preventDefault();
      mapBrowserEvent.preventDefault();
    }
  }
};
