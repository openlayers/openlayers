goog.provide('ol.control.KeyboardPan');

goog.require('goog.events.KeyCodes');
goog.require('goog.events.KeyHandler.EventType');
goog.require('ol.Control');
goog.require('ol.control.Constraints');



/**
 * @constructor
 * @extends {ol.Control}
 * @param {ol.control.Constraints} constraints Constraints.
 * @param {number} pixelDelta Pixel delta.
 */
ol.control.KeyboardPan = function(constraints, pixelDelta) {

  goog.base(this, constraints);

  /**
   * @private
   * @type {number}
   */
  this.pixelDelta_ = pixelDelta;

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
      var resolution = map.getResolution();
      var delta;
      var mapUnitsDelta = resolution * this.pixelDelta_;
      if (keyCode == goog.events.KeyCodes.DOWN) {
        delta = new ol.Coordinate(0, -mapUnitsDelta);
      } else if (keyCode == goog.events.KeyCodes.LEFT) {
        delta = new ol.Coordinate(-mapUnitsDelta, 0);
      } else if (keyCode == goog.events.KeyCodes.RIGHT) {
        delta = new ol.Coordinate(mapUnitsDelta, 0);
      } else {
        goog.asserts.assert(keyCode == goog.events.KeyCodes.UP);
        delta = new ol.Coordinate(0, mapUnitsDelta);
      }
      this.pan(map, delta);
      keyEvent.preventDefault();
      mapBrowserEvent.preventDefault();
    }
  }
};
