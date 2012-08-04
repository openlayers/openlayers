goog.provide('ol.control.KeyboardZoom');

goog.require('goog.events.KeyCodes');
goog.require('goog.events.KeyHandler.EventType');
goog.require('ol.Control');
goog.require('ol.control.ResolutionConstraintType');



/**
 * @constructor
 * @extends {ol.Control}
 * @param {ol.control.Constraints} constraints Constraints.
 */
ol.control.KeyboardZoom = function(constraints) {
  goog.base(this, constraints);
};
goog.inherits(ol.control.KeyboardZoom, ol.Control);


/**
 * @inheritDoc
 */
ol.control.KeyboardZoom.prototype.handleMapBrowserEvent =
    function(mapBrowserEvent) {
  if (mapBrowserEvent.type == goog.events.KeyHandler.EventType.KEY) {
    var keyEvent = /** @type {goog.events.KeyEvent} */
        mapBrowserEvent.browserEvent;
    var charCode = keyEvent.charCode;
    if (charCode == '+'.charCodeAt(0) || charCode == '-'.charCodeAt(0)) {
      var map = mapBrowserEvent.map;
      var delta = charCode == '+'.charCodeAt(0) ? 1 : -1;
      this.zoom(map, delta);
      keyEvent.preventDefault();
      mapBrowserEvent.preventDefault();
    }
  }
};
