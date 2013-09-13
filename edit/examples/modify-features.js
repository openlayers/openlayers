var raster = new ol.layer.Tile({
  source: new ol.source.MapQuestOpenAerial()
});

var vector = new ol.layer.Vector({
  id: 'vector',
  source: new ol.source.Vector({
    parser: new ol.parser.ogc.GML_v3(),
    url: 'data/gml/topp-states-wfs.xml'
  }),
  style: new ol.style.Style({
    rules: [
      new ol.style.Rule({
        filter: 'renderIntent("selected")',
        symbolizers: [
          new ol.style.Fill({
            color: '#ffffff',
            opacity: 0.5
          }),
          new ol.style.Stroke({
            color: '#6666ff',
            width: 0.5
          })
        ]
      }),
      new ol.style.Rule({
        filter: 'renderIntent("temporary")',
        symbolizers: [
          new ol.style.Shape({
            fill: new ol.style.Fill({color: '#bada55'}),
            size: 16
          })
        ]
      }),
      new ol.style.Rule({
        filter: 'renderIntent("future")',
        symbolizers: [
          new ol.style.Shape({
            fill: new ol.style.Fill({color: '#013'}),
            size: 16
          })
        ]
      })
    ],
    symbolizers: [
      new ol.style.Fill({
        color: '#ffffff',
        opacity: 0.25
      }),
      new ol.style.Stroke({
        color: '#6666ff'
      })
    ]
  })
});

var selectInteraction = new ol.interaction.Select({
  layerFilter: function(layer) { return layer.get('id') == 'vector'; }
});

var map = new ol.Map({
  interactions: ol.interaction.defaults().extend(
      [selectInteraction, new ol.interaction.Modify()]),
  layers: [raster, vector],
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    center: [-11000000, 4600000],
    zoom: 4
  })
});
