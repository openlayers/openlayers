goog.provide('ol.control.DragBox');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.style');
goog.require('ol.Coordinate');
goog.require('ol.MapBrowserEvent');
goog.require('ol.MapBrowserEvent.EventType');
goog.require('ol.Pixel');
goog.require('ol.Size');
goog.require('ol.control.Control');


/**
 * @typedef {{map: (ol.Map|undefined),
 *            startCoordinate: ol.Coordinate}}
 */
ol.control.DragBoxOptions;



/**
 * @constructor
 * @extends {ol.control.Control}
 * @param {ol.control.DragBoxOptions} dragBoxOptions Drag box options.
 */
ol.control.DragBox = function(dragBoxOptions) {

  var element = goog.dom.createDom(goog.dom.TagName.DIV, 'ol-dragbox');

  /**
   * @type {ol.Pixel|undefined}
   * @private
   */
  this.startPixel_ = null;

  /**
   * @private
   * @type {ol.Coordinate}
   */
  this.startCoordinate_ = dragBoxOptions.startCoordinate;

  /**
   * @private
   * @type {?number}
   */
  this.dragListenKey_ = null;

  goog.base(this, {
    element: element,
    map: dragBoxOptions.map
  });

};
goog.inherits(ol.control.DragBox, ol.control.Control);


/**
 * @inheritDoc
 */
ol.control.DragBox.prototype.setMap = function(map) {
  if (!goog.isNull(this.dragListenKey_)) {
    goog.events.unlistenByKey(this.dragListenKey_);
    this.dragListenKey_ = null;
  }
  if (!goog.isNull(map)) {
    this.startPixel_ = map.getPixelFromCoordinate(this.startCoordinate_);
    goog.asserts.assert(goog.isDef(this.startPixel_));
    goog.style.setPosition(this.element, this.startPixel_);
    goog.style.setBorderBoxSize(this.element, new ol.Size(0, 0));
    this.dragListenKey_ = goog.events.listen(
        map, ol.MapBrowserEvent.EventType.DRAG, this.updateBox_, false, this);
  }
  goog.base(this, 'setMap', map);
};


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent The event to handle.
 * @private
 */
ol.control.DragBox.prototype.updateBox_ = function(mapBrowserEvent) {
  var map = this.getMap();
  var coordinate = mapBrowserEvent.getCoordinate();
  goog.asserts.assert(goog.isDef(coordinate));
  var currentPixel = map.getPixelFromCoordinate(coordinate);
  goog.style.setPosition(this.element, new ol.Pixel(
      Math.min(currentPixel.x, this.startPixel_.x),
      Math.min(currentPixel.y, this.startPixel_.y)));
  goog.style.setBorderBoxSize(this.element, new ol.Size(
      Math.abs(currentPixel.x - this.startPixel_.x),
      Math.abs(currentPixel.y - this.startPixel_.y)));
};
