// FIXME works for View2D only

goog.provide('ol.interaction.KeyboardPan');

goog.require('goog.events.KeyCodes');
goog.require('goog.events.KeyHandler.EventType');
goog.require('ol.Coordinate');
goog.require('ol.View2D');
goog.require('ol.interaction.Interaction');



/**
 * @constructor
 * @extends {ol.interaction.Interaction}
 * @param {ol.interaction.KeyboardPanOptions=} opt_options Options.
 */
ol.interaction.KeyboardPan = function(opt_options) {

  goog.base(this);

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @private
   * @type {number}
   */
  this.delta_ = goog.isDef(options.delta) ? options.delta : 128;

};
goog.inherits(ol.interaction.KeyboardPan, ol.interaction.Interaction);


/**
 * @inheritDoc
 */
ol.interaction.KeyboardPan.prototype.handleMapBrowserEvent =
    function(mapBrowserEvent) {
  if (mapBrowserEvent.type == goog.events.KeyHandler.EventType.KEY) {
    var keyEvent = /** @type {goog.events.KeyEvent} */
        (mapBrowserEvent.browserEvent);
    var keyCode = keyEvent.keyCode;
    if (keyCode == goog.events.KeyCodes.DOWN ||
        keyCode == goog.events.KeyCodes.LEFT ||
        keyCode == goog.events.KeyCodes.RIGHT ||
        keyCode == goog.events.KeyCodes.UP) {
      var map = mapBrowserEvent.map;
      // FIXME works for View2D only
      var view = map.getView();
      goog.asserts.assert(view instanceof ol.View2D);
      var resolution = view.getResolution();
      var delta;
      var mapUnitsDelta = resolution * this.delta_;
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
      var oldCenter = view.getCenter();
      var newCenter = new ol.Coordinate(
          oldCenter.x + delta.x, oldCenter.y + delta.y);
      view.setCenter(newCenter);
      keyEvent.preventDefault();
      mapBrowserEvent.preventDefault();
    }
  }
};
