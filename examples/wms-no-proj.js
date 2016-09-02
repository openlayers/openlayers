goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Image');
goog.require('ol.layer.Tile');
goog.require('ol.proj.Projection');
goog.require('ol.source.ImageWMS');
goog.require('ol.source.TileWMS');


var layers = [
  new ol.layer.Tile({
    source: new ol.source.TileWMS({
      attributions: '© <a href="http://www.geo.admin.ch/internet/geoportal/' +
          'en/home.html">Pixelmap 1:1000000 / geo.admin.ch</a>',
      crossOrigin: 'anonymous',
      params: {
        'LAYERS': 'ch.swisstopo.pixelkarte-farbe-pk1000.noscale',
        'FORMAT': 'image/jpeg'
      },
      url: 'https://wms.geo.admin.ch/'
    })
  }),
  new ol.layer.Image({
    source: new ol.source.ImageWMS({
      attributions: '© <a href="http://www.geo.admin.ch/internet/geoportal/' +
          'en/home.html">National parks / geo.admin.ch</a>',
      crossOrigin: 'anonymous',
      params: {'LAYERS': 'ch.bafu.schutzgebiete-paerke_nationaler_bedeutung'},
      serverType: 'mapserver',
      url: 'https://wms.geo.admin.ch/'
    })
  })
];

// A minimal projection object is configured with only the SRS code and the map
// units. No client-side coordinate transforms are possible with such a
// projection object. Requesting tiles only needs the code together with a
// tile grid of Cartesian coordinates; it does not matter how those
// coordinates relate to latitude or longitude.
var projection = new ol.proj.Projection({
  code: 'EPSG:21781',
  units: 'm'
});

var map = new ol.Map({
  layers: layers,
  renderer: common.getRendererFromQueryString(),
  target: 'map',
  view: new ol.View({
    center: [660000, 190000],
    projection: projection,
    zoom: 9
  })
});
