goog.provide('ol3.interaction.KeyboardZoom');

goog.require('goog.events.KeyCodes');
goog.require('goog.events.KeyHandler.EventType');
goog.require('ol3.Interaction');
goog.require('ol3.interaction.ResolutionConstraintType');



/**
 * @constructor
 * @extends {ol3.Interaction}
 * @param {ol3.interaction.Constraints} constraints Constraints.
 */
ol3.interaction.KeyboardZoom = function(constraints) {
  goog.base(this, constraints);
};
goog.inherits(ol3.interaction.KeyboardZoom, ol3.Interaction);


/**
 * @inheritDoc
 */
ol3.interaction.KeyboardZoom.prototype.handleMapBrowserEvent =
    function(mapBrowserEvent) {
  if (mapBrowserEvent.type == goog.events.KeyHandler.EventType.KEY) {
    var keyEvent = /** @type {goog.events.KeyEvent} */
        mapBrowserEvent.browserEvent;
    var charCode = keyEvent.charCode;
    if (charCode == '+'.charCodeAt(0) || charCode == '-'.charCodeAt(0)) {
      var map = mapBrowserEvent.map;
      var resolution = map.getResolution();
      var delta = charCode == '+'.charCodeAt(0) ? 1 : -1;
      this.zoom(map, resolution, delta);
      keyEvent.preventDefault();
      mapBrowserEvent.preventDefault();
    }
  }
};
