goog.provide('ol.MapBrowserEvent');

goog.require('goog.events.BrowserEvent');
goog.require('ol.Coordinate');
goog.require('ol.MapEvent');



/**
 * @constructor
 * @extends {ol.MapEvent}
 * @param {string} type Event type.
 * @param {ol.Map} map Map.
 * @param {goog.events.BrowserEvent} browserEventObject Browser event object.
 */
ol.MapBrowserEvent = function(type, map, browserEventObject) {

  goog.base(this, type, map);

  /**
   * @private
   * @type {goog.events.BrowserEvent}
   */
  this.browserEventObject_ = browserEventObject;

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
    var browserEventObject = this.getBrowserEventObject();
    var pixel = new ol.Coordinate(
        browserEventObject.offsetX, browserEventObject.offsetY);
    var coordinate = this.map.getCoordinateFromPixel(pixel);
    this.coordinate_ = coordinate;
    return coordinate;
  }
};


/**
 * @return {goog.events.BrowserEvent} Browser event object.
 */
ol.MapBrowserEvent.prototype.getBrowserEventObject = function() {
  return this.browserEventObject_;
};
