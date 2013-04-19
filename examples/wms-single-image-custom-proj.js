goog.require('ol.Attribution');
goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.layer.ImageLayer');
goog.require('ol.projection');
goog.require('ol.source.SingleImageWMS');


var projection = ol.projection.configureProj4jsProjection({
  code: 'EPSG:21781',
  extent: [485869.5728, 837076.5648, 76443.1884, 299941.7864]
});

var extent = [420000, 900000, 30000, 350000];
var layers = [
  new ol.layer.ImageLayer({
    source: new ol.source.SingleImageWMS({
      url: 'http://wms.geo.admin.ch/',
      crossOrigin: 'anonymous',
      attributions: [new ol.Attribution(
          '&copy; ' +
          '<a href="http://www.geo.admin.ch/internet/geoportal/en/home.html">' +
          'Pixelmap 1:1000000 / geo.admin.ch</a>')],
      params: {
        'LAYERS': 'ch.swisstopo.pixelkarte-farbe-pk1000.noscale',
        'FORMAT': 'image/jpeg'
      },
      extent: extent
    })
  }),
  new ol.layer.ImageLayer({
    source: new ol.source.SingleImageWMS({
      url: 'http://wms.geo.admin.ch/',
      crossOrigin: 'anonymous',
      attributions: [new ol.Attribution(
          '&copy; ' +
          '<a href="http://www.geo.admin.ch/internet/geoportal/en/home.html">' +
          'National parks / geo.admin.ch</a>')],
      params: {'LAYERS': 'ch.bafu.schutzgebiete-paerke_nationaler_bedeutung'},
      extent: extent
    })
  })
];

var map = new ol.Map({
  layers: layers,
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map',
  view: new ol.View2D({
    projection: projection,
    center: [660000, 190000],
    zoom: 2
  })
});
