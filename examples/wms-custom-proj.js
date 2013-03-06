goog.require('ol.Attribution');
goog.require('ol.Coordinate');
goog.require('ol.Extent');
goog.require('ol.Map');
goog.require('ol.Projection');
goog.require('ol.ProjectionUnits');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.layer.ImageLayer');
goog.require('ol.layer.TileLayer');
goog.require('ol.projection');
goog.require('ol.source.SingleImageWMS');
goog.require('ol.source.TiledWMS');


var epsg21781 = new ol.Projection('EPSG:21781', ol.ProjectionUnits.METERS,
    // Validity extent from http://spatialreference.org
    new ol.Extent(485869.5728, 76443.1884, 837076.5648, 299941.7864));
ol.projection.addProjection(epsg21781);

var extent = new ol.Extent(420000, 30000, 900000, 350000);
var layers = [
  new ol.layer.TileLayer({
    source: new ol.source.TiledWMS({
      url: 'http://wms.geo.admin.ch/',
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
      attributions: [new ol.Attribution(
          '&copy; ' +
          '<a href="http://www.geo.admin.ch/internet/geoportal/en/home.html">' +
          'National parks / geo.admin.ch</a>')],
      params: {'LAYERS': 'ch.bafu.schutzgebiete-paerke_nationaler_bedeutung'}
    })
  })
];

var map = new ol.Map({
  layers: layers,
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map',
  view: new ol.View2D({
    projection: epsg21781,
    center: new ol.Coordinate(660000, 190000),
    zoom: 2
  })
});
