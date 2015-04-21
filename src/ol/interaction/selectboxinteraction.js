goog.provide('ol.interaction.SelectBox');

goog.require('goog.object');
goog.require('ol.SelectEvent');
goog.require('ol.events.condition');
goog.require('ol.interaction.DragBox');
goog.require('ol.interaction.Select');
goog.require('ol.source.Vector');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');



/**
 * @classdesc
 * Handles selection of vector data. A {@link ol.FeatureOverlay} is maintained
 * internally to store the selected feature(s). Which features are selected is
 * determined by the `condition` option, and optionally the `toggle` or
 * `add`/`remove` options.
 *
 * @constructor
 * @extends {ol.interaction.Select}
 * @param {olx.interaction.SelectBoxOptions=} opt_options Options.
 * @api stable
 */
ol.interaction.SelectBox = function(opt_options) {
  var options = goog.isDef(opt_options) ? opt_options : {};

  /** @type {olx.interaction.SelectOptions} */
  var selectOptions = {
    addCondition: options.addCondition,
    condition: options.condition,
    layers: options.layers,
    style: options.style,
    removeCondition: options.removeCondition,
    toggleCondition: options.toggleCondition,
    filter: options.filter,
    multi: true
  };

  goog.base(this, selectOptions);

  // a DragBox interaction used to select features by drawing boxes
  this.dragBox_ = new ol.interaction.DragBox({
    condition: ol.events.condition.shiftKeyOnly,
    style: options.boxStyle || new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: [0, 0, 255, 1]
      })
    })
  });

  this.dragBox_.on('boxend', function(e) {
    var extent = this.dragBox_.getGeometry().getExtent();

    var vectorSources = [];
    this.getMap().getLayers().forEach(function(layer) {
      var source = layer.getSource();
      if (source instanceof ol.source.Vector) {
        vectorSources.push(source);
      }
    });

    var selected = [];
    vectorSources.forEach(function(source) {
      source.forEachFeatureIntersectingExtent(extent, function(feature) {
        if (this.filter_(feature)) {
          selected.push(feature);
        }
      }, this);
    }, this);

    if (selected.length > 0) {
      this.getFeatures().extend(selected);
      this.dispatchEvent(
          new ol.SelectEvent(ol.SelectEventType.SELECT, selected, []));
    }
  }, this);
};
goog.inherits(ol.interaction.SelectBox, ol.interaction.Select);


/**
 * Remove the DragBoxinteraction from its current map, if any, and attach it
 * to a new map, if any. Pass `null` to just remove the interaction from the
 * current map.
 * @param {ol.Map} map Map.
 * @api stable
 */
ol.interaction.SelectBox.prototype.setMap = function(map) {
  var currentMap = this.getMap();
  if (!goog.isNull(currentMap)) {
    currentMap.removeInteraction(this.dragBox_);
  }
  if (!goog.isNull(map)) {
    map.addInteraction(this.dragBox_);
  }
  goog.base(this, 'setMap', map);
};
