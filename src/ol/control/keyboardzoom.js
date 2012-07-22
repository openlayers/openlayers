goog.provide('ol.control.KeyboardZoom');

goog.require('goog.events.KeyCodes');
goog.require('goog.events.KeyHandler.EventType');
goog.require('ol.Control');



/**
 * @constructor
 * @extends {ol.Control}
 */
ol.control.KeyboardZoom = function() {
  goog.base(this);
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
      // FIXME shouldn't use typecast here, better to check that map is defined
      var resolution = /** @type {number} */ map.getResolution();
      if (charCode == '+'.charCodeAt(0)) {
        resolution = resolution / 2;
      } else if (charCode == '-'.charCodeAt(0)) {
        resolution = 2 * resolution;
      }
      map.setResolution(resolution);
      keyEvent.preventDefault();
      mapBrowserEvent.preventDefault();
    }
  }
};
