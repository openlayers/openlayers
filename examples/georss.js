goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.parser.GeoRSS');
goog.require('ol.proj');
goog.require('ol.source.TileWMS');
goog.require('ol.source.Vector');
goog.require('ol.style.Fill');
goog.require('ol.style.Shape');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');

var raster = new ol.layer.Tile({
  source: new ol.source.TileWMS({
    url: 'http://maps.opengeo.org/geowebcache/service/wms',
    params: {'LAYERS': 'bluemarble', 'VERSION': '1.1.1'}
  })
});

var vector = new ol.layer.Vector({
  source: new ol.source.Vector({
    parser: new ol.parser.GeoRSS(),
    url: 'data/georss/7day-M2.5.xml'
  }),
  style: new ol.style.Style({
    symbolizers: [
      new ol.style.Shape({
        fill: new ol.style.Fill({
          color: '#0000FF'
        }),
        size: 10,
        stroke: new ol.style.Stroke({
          color: '#000000'
        })
      })
    ]
  })
});

var map = new ol.Map({
  layers: [raster, vector],
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    projection: ol.proj.get('EPSG:4326'),
    center: [0, 0],
    zoom: 2
  })
});

var displayFeatureInfo = function(pixel) {
  map.getFeatures({
    pixel: pixel,
    layers: [vector],
    success: function(featuresByLayer) {
      var features = featuresByLayer[0];
      var info = [];
      if (features.length > 0) {
        info.push('<b>' + features[0].get('title') + '</b><br/>' +
            features[0].get('summary'));
      }
      document.getElementById('info').innerHTML = info.join(', ') || '&nbsp;';
    }
  });
};

$(map.getViewport()).on('mousemove', function(evt) {
  var pixel = map.getEventPixel(evt.originalEvent);
  displayFeatureInfo(pixel);
});

map.on('singleclick', function(evt) {
  var pixel = evt.getPixel();
  displayFeatureInfo(pixel);
});
