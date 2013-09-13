var wms = new ol.layer.Tile({
  source: new ol.source.TileWMS({
    url: 'http://demo.opengeo.org/geoserver/wms',
    params: {'LAYERS': 'ne:ne'}
  })
});

var vector = new ol.layer.Vector({
  source: new ol.source.Vector({
    parser: new ol.parser.GeoJSON(),
    url: 'data/countries.geojson'
  }),
  style: new ol.style.Style({
    symbolizers: [
      new ol.style.Stroke({
        color: '#33cc66',
        width: 2
      })
    ]
  }),
  transformFeatureInfo: function(features) {
    return features.length > 0 ?
        features[0].getFeatureId() + ': ' + features[0].get('name') : '&nbsp;';
  }
});

var map = new ol.Map({
  layers: [wms, vector],
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 1
  })
});

map.on('click', function(evt) {
  map.getFeatureInfo({
    pixel: evt.getPixel(),
    success: function(featureInfoByLayer) {
      document.getElementById('info').innerHTML = featureInfoByLayer.join('');
    }
  });
});
