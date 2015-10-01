goog.provide('ol.interaction.DoubleClickZoom');

goog.require('goog.asserts');
goog.require('ol.MapBrowserEvent');
goog.require('ol.MapBrowserEvent.EventType');
goog.require('ol.interaction.Interaction');



/**
 * @classdesc
 * Allows the user to zoom by double-clicking on the map.
 *
 * @constructor
 * @extends {ol.interaction.Interaction}
 * @param {olx.interaction.DoubleClickZoomOptions=} opt_options Options.
 * @api stable
 */
ol.interaction.DoubleClickZoom = function(opt_options) {

  var options = opt_options ? opt_options : {};

  /**
   * @private
   * @type {number}
   */
  this.delta_ = options.delta ? options.delta : 1;

  goog.base(this, {
    handleEvent: ol.interaction.DoubleClickZoom.handleEvent
  });

  /**
   * @private
   * @type {number}
   */
  this.duration_ = options.duration ? options.duration : 250;

};
goog.inherits(ol.interaction.DoubleClickZoom, ol.interaction.Interaction);


/**
 * Handles the {@link ol.MapBrowserEvent map browser event} (if it was a
 * doubleclick) and eventually zooms the map.
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} `false` to stop event propagation.
 * @this {ol.interaction.DoubleClickZoom}
 * @api
 */
ol.interaction.DoubleClickZoom.handleEvent = function(mapBrowserEvent) {
  var stopEvent = false;
  var browserEvent = mapBrowserEvent.browserEvent;
  if (mapBrowserEvent.type == ol.MapBrowserEvent.EventType.DBLCLICK) {
    var map = mapBrowserEvent.map;
    var anchor = mapBrowserEvent.coordinate;
    var delta = browserEvent.shiftKey ? -this.delta_ : this.delta_;
    var view = map.getView();
    goog.asserts.assert(view, 'map must have a view');
    ol.interaction.Interaction.zoomByDelta(
        map, view, delta, anchor, this.duration_);
    mapBrowserEvent.preventDefault();
    stopEvent = true;
  }
  return !stopEvent;
};
