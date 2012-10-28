goog.require('goog.debug.Console');
goog.require('goog.debug.Logger');
goog.require('goog.debug.Logger.Level');
goog.require('ol.Collection');
goog.require('ol.Coordinate');
goog.require('ol.Map');
goog.require('ol.Projection');
goog.require('ol.source.TiledWMS');


if (goog.DEBUG) {
  goog.debug.Console.autoInstall();
  goog.debug.Logger.getLogger('ol').setLevel(goog.debug.Logger.Level.INFO);
}

var extent = new ol.Extent(420000, 30000, 900000, 350000);

var epsg21781 = new ol.Projection('EPSG:21781',
  ol.ProjectionUnits.METERS,
  extent
);

var layers = new ol.Collection([
  new ol.layer.TileLayer({
    source: new ol.source.TiledWMS({
      url: 'http://wms.geo.admin.ch/?',
      attributions: [new ol.Attribution('&copy; <a href="http://www.geo.admin.ch/internet/geoportal/en/home.html">Pixelmap 1:1000000 / geo.admin.ch</a>')],
      crossOrigin: null,
      params: {'LAYERS': 'ch.swisstopo.pixelkarte-farbe-pk1000.noscale'},
      projection: epsg21781,
      extent: extent
    })
  }),
  new ol.layer.TileLayer({
    source: new ol.source.TiledWMS({
      url: 'http://wms.geo.admin.ch/?',
      attributions: [new ol.Attribution('&copy; <a href="http://www.geo.admin.ch/internet/geoportal/en/home.html">National parks / geo.admin.ch</a>')],
      crossOrigin: null,
      params: {'LAYERS': 'ch.bafu.schutzgebiete-paerke_nationaler_bedeutung'},
      projection: epsg21781,
      extent: extent
    })
  })
]);

var map = new ol.Map({
  center: new ol.Coordinate(660000, 190000),
  projection: epsg21781,
  layers: layers,
  target: 'map',
  zoom: 9
});
