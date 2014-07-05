goog.provide('ol.interaction.KeyboardZoom');

goog.require('goog.asserts');
goog.require('goog.events.KeyHandler.EventType');
goog.require('ol.events.ConditionType');
goog.require('ol.events.condition');
goog.require('ol.interaction.Interaction');



/**
 * @classdesc
 * Allows the user to zoom the map using keyboard + and -.
 * Note that, although this interaction is by default included in maps,
 * the keys can only be used when browser focus is on the element to which
 * the keyboard events are attached. By default, this is the map div,
 * though you can change this with the `keyboardEventTarget` in
 * {@link ol.Map}. `document` never loses focus but, for any other element,
 * focus will have to be on, and returned to, this element if the keys are to
 * function.
 * See also {@link ol.interaction.KeyboardPan}.
 *
 * @constructor
 * @param {olx.interaction.KeyboardZoomOptions=} opt_options Options.
 * @extends {ol.interaction.Interaction}
 * @api stable
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
      map.render();
      var view = map.getView();
      goog.asserts.assert(goog.isDef(view));
      ol.interaction.Interaction.zoomByDelta(
          map, view, delta, undefined, this.duration_);
      mapBrowserEvent.preventDefault();
      stopEvent = true;
    }
  }
  return !stopEvent;
};
