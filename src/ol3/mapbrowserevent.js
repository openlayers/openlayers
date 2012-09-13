goog.provide('ol3.MapBrowserEvent');

goog.require('goog.events.BrowserEvent');
goog.require('goog.style');
goog.require('ol3.Coordinate');
goog.require('ol3.MapEvent');
goog.require('ol3.Pixel');



/**
 * @constructor
 * @extends {ol3.MapEvent}
 * @param {string} type Event type.
 * @param {ol3.Map} map Map.
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 */
ol3.MapBrowserEvent = function(type, map, browserEvent) {

  goog.base(this, type, map);

  /**
   * @type {goog.events.BrowserEvent}
   */
  this.browserEvent = browserEvent;

  /**
   * @private
   * @type {ol3.Coordinate|undefined}
   */
  this.coordinate_ = undefined;

};
goog.inherits(ol3.MapBrowserEvent, ol3.MapEvent);


/**
 * @return {ol3.Coordinate|undefined} Coordinate.
 */
ol3.MapBrowserEvent.prototype.getCoordinate = function() {
  if (goog.isDef(this.coordinate_)) {
    return this.coordinate_;
  } else {
    var map = this.map;
    var browserEvent = this.browserEvent;
    var eventPosition = goog.style.getRelativePosition(
        browserEvent, map.getViewport());
    var pixel = new ol3.Pixel(eventPosition.x, eventPosition.y);
    var coordinate = map.getCoordinateFromPixel(pixel);
    this.coordinate_ = coordinate;
    return coordinate;
  }
};
