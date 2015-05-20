goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.dom.Input');
goog.require('ol.layer.Group');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.source.MapQuest');
goog.require('ol.source.TileJSON');

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.MapQuest({layer: 'sat'})
    }), new ol.layer.Group({
      layers: [
        new ol.layer.Tile({
          source: new ol.source.TileJSON({
            url: 'http://api.tiles.mapbox.com/v3/' +
                'mapbox.20110804-hoa-foodinsecurity-3month.jsonp',
            crossOrigin: 'anonymous'
          })
        }),
        new ol.layer.Tile({
          source: new ol.source.TileJSON({
            url: 'http://api.tiles.mapbox.com/v3/' +
                'mapbox.world-borders-light.jsonp',
            crossOrigin: 'anonymous'
          })
        })
      ]
    })
  ],
  renderer: exampleNS.getRendererFromQueryString(),
  target: 'map',
  view: new ol.View({
    center: ol.proj.transform([37.40570, 8.81566], 'EPSG:4326', 'EPSG:3857'),
    zoom: 4
  })
});

function bindInputs(layerid, layer) {
  new ol.dom.Input($(layerid + ' .visible')[0])
      .bindTo('checked', layer, 'visible');
  $.each(['opacity', 'hue', 'saturation', 'contrast', 'brightness'],
      function(i, v) {
        new ol.dom.Input($(layerid + ' .' + v)[0])
            .bindTo('value', layer, v)
            .transform(parseFloat, String);
      }
  );
}
map.getLayers().forEach(function(layer, i) {
  bindInputs('#layer' + i, layer);
  if (layer instanceof ol.layer.Group) {
    layer.getLayers().forEach(function(sublayer, j) {
      bindInputs('#layer' + i + j, sublayer);
    });
  }
});

$('#layertree li > span').click(function() {
  $(this).siblings('fieldset').toggle();
}).siblings('fieldset').hide();
