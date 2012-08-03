goog.provide('ol.control.KeyboardPan');

goog.require('goog.events.KeyCodes');
goog.require('goog.events.KeyHandler.EventType');
goog.require('ol.Control');
goog.require('ol.control.CenterConstraint');
goog.require('ol.control.CenterConstraintType');



/**
 * @constructor
 * @extends {ol.Control}
 * @param {ol.control.CenterConstraintType=} opt_centerConstraint
 *     Center constraint.
 */
ol.control.KeyboardPan = function(opt_centerConstraint) {

  goog.base(this);

  /**
   * @private
   * @type {ol.control.CenterConstraintType}
   */
  this.centerConstraint_ = opt_centerConstraint ||
      ol.control.CenterConstraint.none;

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
      var resolution = map.getResolution();
      var delta;
      if (keyCode == goog.events.KeyCodes.DOWN) {
        delta = new ol.Coordinate(0, -16 * resolution);
      } else if (keyCode == goog.events.KeyCodes.LEFT) {
        delta = new ol.Coordinate(-16 * resolution, 0);
      } else if (keyCode == goog.events.KeyCodes.RIGHT) {
        delta = new ol.Coordinate(16 * resolution, 0);
      } else {
        goog.asserts.assert(keyCode == goog.events.KeyCodes.UP);
        delta = new ol.Coordinate(0, 16 * resolution);
      }
      center = this.centerConstraint_(center, resolution, delta);
      map.setCenter(center);
      keyEvent.preventDefault();
      mapBrowserEvent.preventDefault();
    }
  }
};
