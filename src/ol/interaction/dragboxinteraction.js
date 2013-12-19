// FIXME draw drag box
// FIXME works for View2D only

goog.provide('ol.DragBoxEvent');
goog.provide('ol.interaction.DragBox');

goog.require('goog.asserts');
goog.require('goog.events.Event');
goog.require('ol.events.ConditionType');
goog.require('ol.events.condition');
goog.require('ol.interaction.Drag');
goog.require('ol.render.Box');


/**
 * @define {number} Hysterisis pixels.
 */
ol.DRAG_BOX_HYSTERESIS_PIXELS = 8;


/**
 * @const {number}
 */
ol.DRAG_BOX_HYSTERESIS_PIXELS_SQUARED =
    ol.DRAG_BOX_HYSTERESIS_PIXELS *
    ol.DRAG_BOX_HYSTERESIS_PIXELS;


/**
 * @enum {string}
 */
ol.DragBoxEventType = {
  BOXSTART: 'boxstart',
  BOXEND: 'boxend'
};



/**
 * Object representing a dragbox event.
 *
 * @param {string} type The event type.
 * @param {ol.Coordinate} coordinate The event coordinate.
 * @extends {goog.events.Event}
 * @constructor
 */
ol.DragBoxEvent = function(type, coordinate) {
  goog.base(this, type);

  /**
   * The coordinate of the drag event.
   * @type {ol.Coordinate}
   * @private
   */
  this.coordinate_ = coordinate;

};
goog.inherits(ol.DragBoxEvent, goog.events.Event);


/**
 * Get the name of the property associated with this event.
 * @return {ol.Coordinate} Event coordinate.
 */
ol.DragBoxEvent.prototype.getCoordinate = function() {
  return this.coordinate_;
};



/**
 * @constructor
 * @extends {ol.interaction.Drag}
 * @param {olx.interaction.DragBoxOptions=} opt_options Options.
 * @todo stability experimental
 */
ol.interaction.DragBox = function(opt_options) {

  goog.base(this);

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @private
   * @type {ol.style.Style}
   */
  var style = goog.isDef(options.style) ? options.style : null;

  /**
   * @type {ol.render.Box}
   * @private
   */
  this.box_ = new ol.render.Box(style);

  /**
   * @private
   * @type {ol.events.ConditionType}
   */
  this.condition_ = goog.isDef(options.condition) ?
      options.condition : ol.events.condition.always;

};
goog.inherits(ol.interaction.DragBox, ol.interaction.Drag);


/**
 * @inheritDoc
 */
ol.interaction.DragBox.prototype.handleDrag = function(mapBrowserEvent) {
  this.box_.setCoordinates(
      this.startCoordinate, mapBrowserEvent.getCoordinate());
};


/**
 * Returns geometry of last drawn box.
 * @return {ol.geom.Geometry} Geometry.
 */
ol.interaction.DragBox.prototype.getGeometry = function() {
  return this.box_.getGeometry();
};


/**
 * To be overriden by child classes.
 * @protected
 */
ol.interaction.DragBox.prototype.onBoxEnd = goog.nullFunction;


/**
 * @inheritDoc
 */
ol.interaction.DragBox.prototype.handleDragEnd =
    function(mapBrowserEvent) {
  this.box_.setMap(null);
  if (this.deltaX * this.deltaX + this.deltaY * this.deltaY >=
      ol.DRAG_BOX_HYSTERESIS_PIXELS_SQUARED) {
    this.onBoxEnd(mapBrowserEvent);
    this.dispatchEvent(new ol.DragBoxEvent(ol.DragBoxEventType.BOXEND,
        mapBrowserEvent.getCoordinate()));
  }
};


/**
 * @inheritDoc
 */
ol.interaction.DragBox.prototype.handleDragStart =
    function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  if (browserEvent.isMouseActionButton() && this.condition_(mapBrowserEvent)) {
    this.box_.setCoordinates(this.startCoordinate, this.startCoordinate);
    this.box_.setMap(mapBrowserEvent.map);
    this.dispatchEvent(new ol.DragBoxEvent(ol.DragBoxEventType.BOXSTART,
        mapBrowserEvent.getCoordinate()));
    return true;
  } else {
    return false;
  }
};
