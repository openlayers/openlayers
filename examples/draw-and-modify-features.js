goog.require('ol.Collection');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.events.condition');
goog.require('ol.interaction.Draw');
goog.require('ol.interaction.Modify');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.OSM');
goog.require('ol.source.Vector');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');

var raster = new ol.layer.Tile({
  source: new ol.source.OSM()
});

var map = new ol.Map({
  layers: [raster],
  target: 'map',
  view: new ol.View({
    center: [-11000000, 4600000],
    zoom: 4
  })
});

var features = new ol.Collection();
var featureOverlay = new ol.layer.Vector({
  source: new ol.source.Vector({features: features}),
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
  features: features,
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
var typeSelect = document.getElementById('type');

function addInteraction() {
  draw = new ol.interaction.Draw({
    features: features,
    type: /** @type {ol.geom.GeometryType} */ (typeSelect.value)
  });
  map.addInteraction(draw);
}


/**
 * Handle change event.
 */
typeSelect.onchange = function() {
  map.removeInteraction(draw);
  addInteraction();
};

addInteraction();
