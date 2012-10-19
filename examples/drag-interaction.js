goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.Collection');
goog.require('ol.Coordinate');
goog.require('ol.Extent');
goog.require('ol.Map');
goog.require('ol.interaction.Drag');
goog.require('ol.source.MapQuestOpenAerial');



/**
 * @constructor
 * @extends {ol.interaction.Drag}
 * @param {ol.interaction.ConditionType} condition Condition.
 * @param {boolean} enabled Enabled.
 */
var SelectBox = function(condition, enabled) {

  goog.base(this);

  /**
   * @private
   * @type {ol.interaction.ConditionType}
   */
  this.condition_ = condition;

  /**
   * @type {boolean}
   */
  this.enabled = enabled;

};
goog.inherits(SelectBox, ol.interaction.Drag);


/**
 * @inheritDoc
 */
SelectBox.prototype.handleDragEnd = function(mapBrowserEvent) {
  var map = mapBrowserEvent.map;
  var extent = ol.Extent.boundingExtent(
      this.startCoordinate,
      mapBrowserEvent.getCoordinate());
  alert('You selected (' + extent.minX + ', ' + extent.minY + ') to (' +
        extent.maxX + ', ' + extent.maxY + ')');
};


/**
 * @inheritDoc
 */
SelectBox.prototype.handleDragStart = function(mapBrowserEvent) {
  if (this.enabled && this.condition_(mapBrowserEvent.browserEvent)) {
    return {box: true, boxClass: 'selectbox'};
  } else {
    return null;
  }
};


var layer = new ol.layer.TileLayer({
  source: new ol.source.MapQuestOpenAerial()
});
var map = new ol.Map({
  center: new ol.Coordinate(0, 0),
  layers: new ol.Collection([layer]),
  target: 'map',
  zoom: 2
});

var selectBoxInput = goog.dom.getElement('enable-select');
var selectBox = new SelectBox(
    ol.interaction.condition.shiftKeyOnly, selectBoxInput.checked);
goog.events.listen(selectBoxInput, goog.events.EventType.CHANGE, function() {
  selectBox.enabled = selectBoxInput.checked;
});
map.getInteractions().push(selectBox);
