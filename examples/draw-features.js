goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.interaction');
goog.require('ol.interaction.Draw');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.MapQuestOpenAerial');
goog.require('ol.source.Vector');
goog.require('ol.style.Fill');
goog.require('ol.style.Rule');
goog.require('ol.style.Shape');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');

var raster = new ol.layer.Tile({
  source: new ol.source.MapQuestOpenAerial()
});

var vector = new ol.layer.Vector({
  source: new ol.source.Vector({parser: null}),
  style: new ol.style.Style({
    rules: [
      new ol.style.Rule({
        filter: 'renderIntent("selected")',
        symbolizers: [
          new ol.style.Shape({
            fill: new ol.style.Fill({
              color: '#0099ff',
              opacity: 1
            }),
            stroke: new ol.style.Stroke({
              color: 'white',
              opacity: 0.75
            }),
            size: 14
          }),
          new ol.style.Fill({
            color: '#ffffff',
            opacity: 0.5
          }),
          new ol.style.Stroke({
            color: 'white',
            width: 5
          }),
          new ol.style.Stroke({
            color: '#0099ff',
            width: 3
          })
        ]
      }),
      new ol.style.Rule({
        filter: 'renderIntent("temporary")',
        symbolizers: [
          new ol.style.Shape({
            fill: new ol.style.Fill({
              color: '#0099ff',
              opacity: 1
            }),
            stroke: new ol.style.Stroke({
              color: 'white',
              opacity: 0.75
            }),
            size: 14,
            zIndex: 1
          })
        ]
      })
    ],
    symbolizers: [
      new ol.style.Shape({
        fill: new ol.style.Fill({
          color: '#ffcc33',
          opacity: 1
        }),
        size: 14
      }),
      new ol.style.Fill({
        color: 'white',
        opacity: 0.2
      }),
      new ol.style.Stroke({
        color: '#ffcc33',
        width: 2
      })
    ]
  })
});

var map = new ol.Map({
  layers: [raster, vector],
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    center: [-11000000, 4600000],
    zoom: 4
  })
});

var typeSelect = document.getElementById('type');

var draw; // global so we can remove it later
function addInteraction() {
  draw = new ol.interaction.Draw({
    layer: vector,
    type: /** @type {ol.geom.GeometryType} */
        (typeSelect.options[typeSelect.selectedIndex].value)
  });
  map.addInteraction(draw);
}


/**
 * Let user change the geometry type.
 * @param {Event} e Change event.
 */
typeSelect.onchange = function(e) {
  map.removeInteraction(draw);
  addInteraction();
};

addInteraction();
