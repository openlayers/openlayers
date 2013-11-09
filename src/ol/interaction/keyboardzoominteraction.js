// FIXME works for View2D only

goog.provide('ol.interaction.KeyboardZoom');

goog.require('goog.asserts');
goog.require('goog.events.KeyHandler.EventType');
goog.require('ol.events.ConditionType');
goog.require('ol.events.condition');
goog.require('ol.interaction.Interaction');



/**
 * Allows the user to zoom the map using keyboard + and -.
 * @constructor
 * @param {ol.interaction.KeyboardZoomOptions=} opt_options Options.
 * @extends {ol.interaction.Interaction}
 * @todo stability experimental
 */
ol.interaction.KeyboardZoom = function(opt_options) {

  goog.base(this);

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @private
   * @type {ol.events.ConditionType}
   */
  this.condition_ = goog.isDef(options.condition) ? options.condition :
          ol.events.condition.targetNotEditable;

  /**
   * @private
   * @type {number}
   */
  this.delta_ = goog.isDef(options.delta) ? options.delta : 1;

  /**
   * @private
   * @type {number}
   */
  this.duration_ = goog.isDef(options.duration) ? options.duration : 100;

};
goog.inherits(ol.interaction.KeyboardZoom, ol.interaction.Interaction);


/**
 * @inheritDoc
 */
ol.interaction.KeyboardZoom.prototype.handleMapBrowserEvent =
    function(mapBrowserEvent) {
  var stopEvent = false;
  if (mapBrowserEvent.type == goog.events.KeyHandler.EventType.KEY) {
    var keyEvent = /** @type {goog.events.KeyEvent} */
        (mapBrowserEvent.browserEvent);
    var charCode = keyEvent.charCode;
    if (this.condition_(mapBrowserEvent) &&
        (charCode == '+'.charCodeAt(0) || charCode == '-'.charCodeAt(0))) {
      var map = mapBrowserEvent.map;
      var delta = (charCode == '+'.charCodeAt(0)) ? this.delta_ : -this.delta_;
      map.requestRenderFrame();
      // FIXME works for View2D only
      var view = map.getView().getView2D();
      ol.interaction.Interaction.zoomByDelta(
          map, view, delta, undefined, this.duration_);
      mapBrowserEvent.preventDefault();
      stopEvent = true;
    }
  }
  return !stopEvent;
};
