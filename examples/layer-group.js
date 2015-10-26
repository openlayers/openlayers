goog.require('ol.Map');
goog.require('ol.View');
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
  renderer: common.getRendererFromQueryString(),
  target: 'map',
  view: new ol.View({
    center: ol.proj.fromLonLat([37.40570, 8.81566]),
    zoom: 4
  })
});

function bindInputs(layerid, layer) {
  var visibilityInput = $(layerid + ' input.visible');
  visibilityInput.on('change', function() {
    layer.setVisible(this.checked);
  });
  visibilityInput.prop('checked', layer.getVisible());

  var opacityInput = $(layerid + ' input.opacity');
  opacityInput.on('input change', function() {
    layer.setOpacity(parseFloat(this.value));
  });
  opacityInput.val(String(layer.getOpacity()));
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
