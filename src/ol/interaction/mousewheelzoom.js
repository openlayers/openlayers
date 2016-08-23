goog.provide('ol.interaction.MouseWheelZoom');

goog.require('ol');
goog.require('ol.events.EventType');
goog.require('ol.interaction.Interaction');
goog.require('ol.math');


/**
 * @classdesc
 * Allows the user to zoom the map by scrolling the mouse wheel.
 *
 * @constructor
 * @extends {ol.interaction.Interaction}
 * @param {olx.interaction.MouseWheelZoomOptions=} opt_options Options.
 * @api stable
 */
ol.interaction.MouseWheelZoom = function(opt_options) {

  ol.interaction.Interaction.call(this, {
    handleEvent: ol.interaction.MouseWheelZoom.handleEvent
  });

  var options = opt_options || {};

  /**
   * @private
   * @type {number}
   */
  this.delta_ = 0;

  /**
   * @private
   * @type {number}
   */
  this.duration_ = options.duration !== undefined ? options.duration : 250;

  /**
   * @private
   * @type {boolean}
   */
  this.useAnchor_ = options.useAnchor !== undefined ? options.useAnchor : true;

  /**
   * @private
   * @type {?ol.Coordinate}
   */
  this.lastAnchor_ = null;

  /**
   * @private
   * @type {number|undefined}
   */
  this.startTime_ = undefined;

  /**
   * @private
   * @type {number|undefined}
   */
  this.timeoutId_ = undefined;

};
ol.inherits(ol.interaction.MouseWheelZoom, ol.interaction.Interaction);


/**
 * Handles the {@link ol.MapBrowserEvent map browser event} (if it was a
 * mousewheel-event) and eventually zooms the map.
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} `false` to stop event propagation.
 * @this {ol.interaction.MouseWheelZoom}
 * @api
 */
ol.interaction.MouseWheelZoom.handleEvent = function(mapBrowserEvent) {
  var stopEvent = false;
  if (mapBrowserEvent.type == ol.events.EventType.WHEEL ||
      mapBrowserEvent.type == ol.events.EventType.MOUSEWHEEL) {
    var map = mapBrowserEvent.map;
    var wheelEvent = /** @type {WheelEvent} */ (mapBrowserEvent.originalEvent);

    if (this.useAnchor_) {
      this.lastAnchor_ = mapBrowserEvent.coordinate;
    }

    // Delta normalisation inspired by
    // https://github.com/mapbox/mapbox-gl-js/blob/001c7b9/js/ui/handler/scroll_zoom.js
    //TODO There's more good stuff in there for inspiration to improve this interaction.
    var delta;
    if (mapBrowserEvent.type == ol.events.EventType.WHEEL) {
      delta = wheelEvent.deltaY;
      if (ol.has.FIREFOX &&
          wheelEvent.deltaMode === ol.global.WheelEvent.DOM_DELTA_PIXEL) {
        delta /= ol.has.DEVICE_PIXEL_RATIO;
      }
      if (wheelEvent.deltaMode === ol.global.WheelEvent.DOM_DELTA_LINE) {
        delta *= 40;
      }
    } else if (mapBrowserEvent.type == ol.events.EventType.MOUSEWHEEL) {
      delta = -wheelEvent.wheelDeltaY;
      if (ol.has.SAFARI) {
        delta /= 3;
      }
    }

    this.delta_ += delta;

    if (this.startTime_ === undefined) {
      this.startTime_ = Date.now();
    }

    var duration = ol.MOUSEWHEELZOOM_TIMEOUT_DURATION;
    var timeLeft = Math.max(duration - (Date.now() - this.startTime_), 0);

    ol.global.clearTimeout(this.timeoutId_);
    this.timeoutId_ = ol.global.setTimeout(
        this.doZoom_.bind(this, map), timeLeft);

    mapBrowserEvent.preventDefault();
    stopEvent = true;
  }
  return !stopEvent;
};


/**
 * @private
 * @param {ol.Map} map Map.
 */
ol.interaction.MouseWheelZoom.prototype.doZoom_ = function(map) {
  var maxDelta = ol.MOUSEWHEELZOOM_MAXDELTA;
  var delta = ol.math.clamp(this.delta_, -maxDelta, maxDelta);

  var view = map.getView();

  ol.interaction.Interaction.zoomByDelta(map, view, -delta, this.lastAnchor_,
      this.duration_);

  this.delta_ = 0;
  this.lastAnchor_ = null;
  this.startTime_ = undefined;
  this.timeoutId_ = undefined;
};


/**
 * Enable or disable using the mouse's location as an anchor when zooming
 * @param {boolean} useAnchor true to zoom to the mouse's location, false
 * to zoom to the center of the map
 * @api
 */
ol.interaction.MouseWheelZoom.prototype.setMouseAnchor = function(useAnchor) {
  this.useAnchor_ = useAnchor;
  if (!useAnchor) {
    this.lastAnchor_ = null;
  }
};
