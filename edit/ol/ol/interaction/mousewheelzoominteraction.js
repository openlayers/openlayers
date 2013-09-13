// FIXME works for View2D only

goog.provide('ol.interaction.MouseWheelZoom');

goog.require('goog.asserts');
goog.require('goog.events.MouseWheelEvent');
goog.require('goog.events.MouseWheelHandler.EventType');
goog.require('goog.math');
goog.require('ol.Coordinate');
goog.require('ol.interaction.Interaction');


/**
 * @define {number} Animation duration.
 */
ol.interaction.MOUSEWHEELZOOM_ANIMATION_DURATION = 250;


/**
 * @define {number} Maximum delta.
 */
ol.interaction.MOUSEWHEELZOOM_MAXDELTA = 1;


/**
 * @define {number} Timeout duration.
 */
ol.interaction.MOUSEWHEELZOOM_TIMEOUT_DURATION = 80;



/**
 * @constructor
 * @extends {ol.interaction.Interaction}
 */
ol.interaction.MouseWheelZoom = function() {

  goog.base(this);

  /**
   * @private
   * @type {number}
   */
  this.delta_ = 0;

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
goog.inherits(ol.interaction.MouseWheelZoom, ol.interaction.Interaction);


/**
 * @inheritDoc
 */
ol.interaction.MouseWheelZoom.prototype.handleMapBrowserEvent =
    function(mapBrowserEvent) {
  var stopEvent = false;
  if (mapBrowserEvent.type ==
      goog.events.MouseWheelHandler.EventType.MOUSEWHEEL) {
    var map = mapBrowserEvent.map;
    var mouseWheelEvent = /** @type {goog.events.MouseWheelEvent} */
        (mapBrowserEvent.browserEvent);
    goog.asserts.assertInstanceof(mouseWheelEvent, goog.events.MouseWheelEvent);

    this.lastAnchor_ = mapBrowserEvent.getCoordinate();
    this.delta_ += mouseWheelEvent.deltaY / 3;

    if (!goog.isDef(this.startTime_)) {
      this.startTime_ = goog.now();
    }

    var duration = ol.interaction.MOUSEWHEELZOOM_TIMEOUT_DURATION;
    var timeLeft = Math.max(duration - (goog.now() - this.startTime_), 0);

    goog.global.clearTimeout(this.timeoutId_);
    this.timeoutId_ = goog.global.setTimeout(
        goog.bind(this.doZoom_, this, map), timeLeft);

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
  var maxDelta = ol.interaction.MOUSEWHEELZOOM_MAXDELTA;
  var delta = goog.math.clamp(this.delta_, -maxDelta, maxDelta);

  // FIXME works for View2D only
  var view = map.getView().getView2D();

  map.requestRenderFrame();
  ol.interaction.Interaction.zoomByDelta(map, view, -delta, this.lastAnchor_,
      ol.interaction.MOUSEWHEELZOOM_ANIMATION_DURATION);

  this.delta_ = 0;
  this.lastAnchor_ = null;
  this.startTime_ = undefined;
  this.timeoutId_ = undefined;
};
