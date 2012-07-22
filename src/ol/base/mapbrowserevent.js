goog.provide('ol.MapBrowserEvent');

goog.require('goog.events.BrowserEvent');
goog.require('ol.Coordinate');
goog.require('ol.MapEvent');



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

};
goog.inherits(ol.MapBrowserEvent, ol.MapEvent);


/**
 * @private
 * @type {ol.Coordinate}
 */
ol.MapBrowserEvent.prototype.coordinate_;


/**
 * @return {ol.Coordinate} Coordinate.
 */
ol.MapBrowserEvent.prototype.getCoordinate = function() {
  if (goog.isDef(this.coordinate_)) {
    return this.coordinate_;
  } else {
    var browserEvent = this.browserEvent;
    var pixel = new ol.Coordinate(browserEvent.offsetX, browserEvent.offsetY);
    var coordinate = this.map.getCoordinateFromPixel(pixel);
    this.coordinate_ = coordinate;
    return coordinate;
  }
};
