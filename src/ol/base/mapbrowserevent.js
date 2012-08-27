goog.provide('ol.MapBrowserEvent');

goog.require('goog.events.BrowserEvent');
goog.require('goog.style');
goog.require('ol.Coordinate');
goog.require('ol.MapEvent');
goog.require('ol.Pixel');



/**
 * @constructor
 * @extends {ol.MapEvent}
 * @param {string} type Event type.
 * @param {ol.Map} map Map.
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 */
ol.MapBrowserEvent = function(type, map, browserEvent) {

  goog.base(this, type, map);

  /**
   * @type {goog.events.BrowserEvent}
   */
  this.browserEvent = browserEvent;

  /**
   * @private
   * @type {ol.Coordinate|undefined}
   */
  this.coordinate_ = undefined;

};
goog.inherits(ol.MapBrowserEvent, ol.MapEvent);


/**
 * @return {ol.Coordinate|undefined} Coordinate.
 */
ol.MapBrowserEvent.prototype.getCoordinate = function() {
  if (goog.isDef(this.coordinate_)) {
    return this.coordinate_;
  } else {
    var map = this.map;
    var browserEvent = this.browserEvent;
    var eventPosition = goog.style.getRelativePosition(
        browserEvent, map.getViewport());
    var pixel = new ol.Pixel(eventPosition.x, eventPosition.y);
    var coordinate = map.getCoordinateFromPixel(pixel);
    this.coordinate_ = coordinate;
    return coordinate;
  }
};
