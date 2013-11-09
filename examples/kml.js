goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.parser.KML');
goog.require('ol.source.TileWMS');
goog.require('ol.source.Vector');

var raster = new ol.layer.Tile({
  source: new ol.source.TileWMS({
    url: 'http://vmap0.tiles.osgeo.org/wms/vmap0',
    crossOrigin: null,
    params: {
      'LAYERS': 'basic',
      'VERSION': '1.1.1',
      'FORMAT': 'image/jpeg'
    }
  })
});

var vector = new ol.layer.Vector({
  source: new ol.source.Vector({
    parser: new ol.parser.KML({
      maxDepth: 1, extractStyles: true, extractAttributes: true
    }),
    url: 'data/kml/lines.kml'
  })
});

var map = new ol.Map({
  layers: [raster, vector],
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    projection: 'EPSG:4326',
    center: [-112.169, 36.099],
    zoom: 11
  })
});

var displayFeatureInfo = function(pixel) {
  map.getFeatures({
    pixel: pixel,
    layers: [vector],
    success: function(featuresByLayer) {
      var features = featuresByLayer[0];
      var info = [];
      for (var i = 0, ii = features.length; i < ii; ++i) {
        info.push(features[i].get('name'));
      }
      document.getElementById('info').innerHTML = info.join(', ') || '&nbsp';
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
