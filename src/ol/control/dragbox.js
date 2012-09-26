goog.provide('ol.control.DragBox');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.style');
goog.require('ol.Size');
goog.require('ol.control.Control');



/**
 * @constructor
 * @extends {ol.control.Control}
 * @param {ol.Map} map Map.
 * @param {ol.Coordinate=} opt_startCoordinate start coordinate of the box.
 *     If not provided, call {@link startBox} to start the box.
 */
ol.control.DragBox = function(map, opt_startCoordinate) {

  goog.base(this, map);

  /**
   * @type {Element}
   * @private
   */
  this.divElement_ = goog.dom.createDom(goog.dom.TagName.DIV, 'ol-dragbox');

  /**
   * @type {ol.Pixel|undefined}
   * @private
   */
  this.startPixel_ = null;

  if (goog.isDef(opt_startCoordinate)) {
    this.startBox(opt_startCoordinate);
  }

};
goog.inherits(ol.control.DragBox, ol.control.Control);


/**
 * @inheritDoc
 */
ol.control.DragBox.prototype.getElement = function() {
  return this.divElement_;
};


/**
 * Adds a box to the map, at the specified coordinate. Dragging will change
 * the size of the box.
 * @param {ol.Coordinate} startCoordinate The coordinate to start the box at.
 */
ol.control.DragBox.prototype.startBox = function(startCoordinate) {
  var map = this.getMap();
  this.startPixel_ = map.getPixelFromCoordinate(startCoordinate);
  goog.asserts.assert(goog.isDef(this.startPixel_));
  goog.style.setPosition(this.divElement_, this.startPixel_);
  goog.style.setBorderBoxSize(this.divElement_, new ol.Size(0, 0));
  goog.dom.append(/** @type {!Node} */ (map.getViewport()), this.divElement_);
  goog.events.listen(
      map, ol.MapBrowserEvent.EventType.DRAG,
      this.updateBox_, false, this);
  goog.events.listen(
      map, ol.MapBrowserEvent.EventType.DRAGEND,
      this.finalizeBox_, false, this);
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
  goog.style.setPosition(this.divElement_, new ol.Pixel(
      Math.min(currentPixel.x, this.startPixel_.x),
      Math.min(currentPixel.y, this.startPixel_.y)));
  goog.style.setBorderBoxSize(this.divElement_, new ol.Size(
      Math.abs(currentPixel.x - this.startPixel_.x),
      Math.abs(currentPixel.y - this.startPixel_.y)));
};


/**
 * @private
 */
ol.control.DragBox.prototype.finalizeBox_ = function() {
  var map = this.getMap();
  goog.events.unlisten(
      map, ol.MapBrowserEvent.EventType.DRAG,
      this.updateBox_, false, this);
  goog.events.unlisten(
      map, ol.MapBrowserEvent.EventType.DRAGEND,
      this.finalizeBox_, false, this);
};


/**
 * Removes the box from the map.
 */
ol.control.DragBox.prototype.removeBox = function() {
  goog.dom.removeNode(this.divElement_);
};


/**
 * @inheritDoc
 */
ol.control.DragBox.prototype.disposeInternal = function() {
  this.finalizeBox_();
  this.removeBox();
  delete this.divElement_;
  delete this.startPixel_;
  goog.base(this, 'disposeInternal');
};
