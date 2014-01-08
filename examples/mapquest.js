goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.layer.Group');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.source.MapQuestHybrid');
goog.require('ol.source.MapQuestOSM');
goog.require('ol.source.MapQuestOpenAerial');


var layers = [
  new ol.layer.Tile({
    style: 'Road',
    source: new ol.source.MapQuestOSM()
  }),
  new ol.layer.Tile({
    style: 'Aerial',
    visible: false,
    source: new ol.source.MapQuestOpenAerial()
  }),
  new ol.layer.Group({
    style: 'AerialWithLabels',
    visible: false,
    layers: [
      new ol.layer.Tile({
        source: new ol.source.MapQuestOpenAerial()
      }),
      new ol.layer.Tile({
        source: new ol.source.MapQuestHybrid()
      })
    ]
  })
];

var map = new ol.Map({
  layers: layers,
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map',
  view: new ol.View2D({
    center: ol.proj.transform(
        [-73.979378, 40.702222], 'EPSG:4326', 'EPSG:3857'),
    zoom: 9
  })
});

$('#layer-select').change(function() {
  var style = $(this).find(':selected').val();
  var i, ii;
  for (i = 0, ii = layers.length; i < ii; ++i) {
    layers[i].set('visible', (layers[i].get('style') == style));
  }
});
$('#layer-select').trigger('change');
