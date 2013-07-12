// FIXME works for View2D only

goog.provide('ol.interaction.KeyboardPan');

goog.require('goog.asserts');
goog.require('goog.events.KeyCodes');
goog.require('goog.events.KeyHandler.EventType');
goog.require('ol.View2D');
goog.require('ol.coordinate');
goog.require('ol.interaction.ConditionType');
goog.require('ol.interaction.Interaction');
goog.require('ol.interaction.condition');


/**
 * @define {number} Pan duration.
 */
ol.interaction.KEYBOARD_PAN_DURATION = 100;



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
   * @type {ol.interaction.ConditionType}
   */
  this.condition_ = goog.isDef(options.condition) ?
      options.condition : ol.interaction.condition.noModifierKeys;

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
  var stopEvent = false;
  if (mapBrowserEvent.type == goog.events.KeyHandler.EventType.KEY) {
    var keyEvent = /** @type {goog.events.KeyEvent} */
        (mapBrowserEvent.browserEvent);
    var keyCode = keyEvent.keyCode;
    if (this.condition_(keyEvent) && (keyCode == goog.events.KeyCodes.DOWN ||
        keyCode == goog.events.KeyCodes.LEFT ||
        keyCode == goog.events.KeyCodes.RIGHT ||
        keyCode == goog.events.KeyCodes.UP)) {
      var map = mapBrowserEvent.map;
      // FIXME works for View2D only
      var view = map.getView();
      goog.asserts.assertInstanceof(view, ol.View2D);
      var view2DState = view.getView2DState();
      var mapUnitsDelta = view2DState.resolution * this.delta_;
      var deltaX = 0, deltaY = 0;
      if (keyCode == goog.events.KeyCodes.DOWN) {
        deltaY = -mapUnitsDelta;
      } else if (keyCode == goog.events.KeyCodes.LEFT) {
        deltaX = -mapUnitsDelta;
      } else if (keyCode == goog.events.KeyCodes.RIGHT) {
        deltaX = mapUnitsDelta;
      } else {
        deltaY = mapUnitsDelta;
      }
      var delta = [deltaX, deltaY];
      ol.coordinate.rotate(delta, view2DState.rotation);
      ol.interaction.Interaction.pan(
          map, view, delta, ol.interaction.KEYBOARD_PAN_DURATION);
      mapBrowserEvent.preventDefault();
      stopEvent = true;
    }
  }
  return !stopEvent;
};
