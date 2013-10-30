goog.provide('ol.control.DragBox');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.math.Size');
goog.require('goog.style');
goog.require('ol.Coordinate');
goog.require('ol.MapBrowserEvent');
goog.require('ol.MapBrowserEvent.EventType');
goog.require('ol.Pixel');
goog.require('ol.control.Control');
goog.require('ol.events.ConditionType');
goog.require('ol.events.condition');


/**
 * @typedef {{startCoordinate: ol.Coordinate,
 *            condition: (ol.events.ConditionType|undefined)}}
 */
ol.control.DragBoxOptions;



/**
 * @constructor
 * @extends {ol.control.Control}
 * @param {ol.control.DragBoxOptions} options Drag box options.
 * @todo stability experimental
 */
ol.control.DragBox = function(options) {

  var element = goog.dom.createDom(goog.dom.TagName.DIV, 'ol-dragbox');

  /**
   * @private
   * @type {ol.events.ConditionType}
   */
  this.condition_ = goog.isDef(options.condition) ?
      options.condition : ol.events.condition.always;

  /**
   * @type {ol.Pixel|undefined}
   * @private
   */
  this.startPixel_ = null;

  /**
   * @private
   * @type {ol.Coordinate}
   */
  this.startCoordinate_ = options.startCoordinate;

  goog.base(this, {
    element: element
  });

};
goog.inherits(ol.control.DragBox, ol.control.Control);


/**
 * @inheritDoc
 */
ol.control.DragBox.prototype.setMap = function(map) {
  goog.base(this, 'setMap', map);
  if (!goog.isNull(map)) {
    this.startPixel_ = map.getPixelFromCoordinate(this.startCoordinate_);
    goog.asserts.assert(goog.isDef(this.startPixel_));
    goog.style.setPosition(this.element,
        this.startPixel_[0], this.startPixel_[1]);
    goog.style.setBorderBoxSize(this.element, new goog.math.Size(0, 0));
    this.listenerKeys.push(goog.events.listen(
        map, ol.MapBrowserEvent.EventType.DRAG, this.updateBox_, false, this));
  }
};


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent The event to handle.
 * @private
 */
ol.control.DragBox.prototype.updateBox_ = function(mapBrowserEvent) {
  if (this.condition_(mapBrowserEvent)) {
    var map = this.getMap();
    var coordinate = mapBrowserEvent.getCoordinate();
    goog.asserts.assert(goog.isDef(coordinate));
    var currentPixel = map.getPixelFromCoordinate(coordinate);
    goog.style.setPosition(this.element,
        Math.min(currentPixel[0], this.startPixel_[0]),
        Math.min(currentPixel[1], this.startPixel_[1]));
    goog.style.setBorderBoxSize(this.element, new goog.math.Size(
        Math.abs(currentPixel[0] - this.startPixel_[0]),
        Math.abs(currentPixel[1] - this.startPixel_[1])));
  }
};
