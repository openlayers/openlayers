// FIXME works for View2D only

goog.provide('ol.interaction.KeyboardZoom');

goog.require('goog.events.KeyCodes');
goog.require('goog.events.KeyHandler.EventType');
goog.require('ol.View2D');
goog.require('ol.interaction.Interaction');



/**
 * @constructor
 * @extends {ol.interaction.Interaction}
 */
ol.interaction.KeyboardZoom = function() {
  goog.base(this);
};
goog.inherits(ol.interaction.KeyboardZoom, ol.interaction.Interaction);


/**
 * @inheritDoc
 */
ol.interaction.KeyboardZoom.prototype.handleMapBrowserEvent =
    function(mapBrowserEvent) {
  if (mapBrowserEvent.type == goog.events.KeyHandler.EventType.KEY) {
    var keyEvent = /** @type {goog.events.KeyEvent} */
        (mapBrowserEvent.browserEvent);
    var charCode = keyEvent.charCode;
    if (charCode == '+'.charCodeAt(0) || charCode == '-'.charCodeAt(0)) {
      var map = mapBrowserEvent.map;
      var delta = (charCode == '+'.charCodeAt(0)) ? 4 : -4;
      // FIXME works for View2D only
      var view = map.getView();
      goog.asserts.assert(view instanceof ol.View2D);
      view.zoom(map, delta);
      keyEvent.preventDefault();
      mapBrowserEvent.preventDefault();
    }
  }
};
