goog.require('ol.FeatureOverlay');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.events.condition');
goog.require('ol.interaction');
goog.require('ol.interaction.Draw');
goog.require('ol.interaction.Modify');
goog.require('ol.layer.Tile');
goog.require('ol.source.MapQuest');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');

var raster = new ol.layer.Tile({
  source: new ol.source.MapQuest({layer: 'sat'})
});

var map = new ol.Map({
  layers: [raster],
  target: 'map',
  view: new ol.View({
    center: [-11000000, 4600000],
    zoom: 4
  })
});

// The features are not added to a regular vector layer/source,
// but to a feature overlay which holds a collection of features.
// This collection is passed to the modify and also the draw
// interaction, so that both can add or modify features.
var featureOverlay = new ol.FeatureOverlay({
  style: new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(255, 255, 255, 0.2)'
    }),
    stroke: new ol.style.Stroke({
      color: '#ffcc33',
      width: 2
    }),
    image: new ol.style.Circle({
      radius: 7,
      fill: new ol.style.Fill({
        color: '#ffcc33'
      })
    })
  })
});
featureOverlay.setMap(map);

var modify = new ol.interaction.Modify({
  features: featureOverlay.getFeatures(),
  // the SHIFT key must be pressed to delete vertices, so
  // that new vertices can be drawn at the same position
  // of existing vertices
  deleteCondition: function(event) {
    return ol.events.condition.shiftKeyOnly(event) &&
        ol.events.condition.singleClick(event);
  }
});
map.addInteraction(modify);

var draw; // global so we can remove it later
function addInteraction() {
  draw = new ol.interaction.Draw({
    features: featureOverlay.getFeatures(),
    type: /** @type {ol.geom.GeometryType} */ (typeSelect.value)
  });
  map.addInteraction(draw);
}

var typeSelect = document.getElementById('type');


/**
 * Let user change the geometry type.
 * @param {Event} e Change event.
 */
typeSelect.onchange = function(e) {
  map.removeInteraction(draw);
  addInteraction();
};

addInteraction();
