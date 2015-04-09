goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Group');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.source.MapQuest');


var layers = [
  new ol.layer.Tile({
    style: 'Road',
    source: new ol.source.MapQuest({layer: 'osm'})
  }),
  new ol.layer.Tile({
    style: 'Aerial',
    visible: false,
    source: new ol.source.MapQuest({layer: 'sat'})
  }),
  new ol.layer.Group({
    style: 'AerialWithLabels',
    visible: false,
    layers: [
      new ol.layer.Tile({
        source: new ol.source.MapQuest({layer: 'sat'})
      }),
      new ol.layer.Tile({
        source: new ol.source.MapQuest({layer: 'hyb'})
      })
    ]
  })
];

var map = new ol.Map({
  layers: layers,
  renderer: exampleNS.getRendererFromQueryString(),
  target: 'map',
  view: new ol.View({
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
