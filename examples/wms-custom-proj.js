goog.require('ol.Attribution');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control');
goog.require('ol.control.ScaleLine');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.source.TileWMS');


// EPSG:21781 is known to Proj4js because its definition was loaded in the html.
var projection = ol.proj.addProjection({
  code: 'EPSG:21781',
  // The extent is used to determine zoom level 0. Recommended values for a
  // projection's validity extent can be found at http://epsg.io/.
  extent: [485869.5728, 76443.1884, 837076.5648, 299941.7864],
  // Use data from proj4js to configure the projection's units.
  units: proj4.defs('EPSG:21781').units
});
// Proj4js provides transform functions between its configured projections.
// The transform is needed for the ScaleLine control. Otherwise this example
// would also work without transform functions.
ol.proj.addCoordinateTransforms('EPSG:4326', projection, proj4('EPSG:21781'));

var extent = [420000, 30000, 900000, 350000];
var layers = [
  new ol.layer.Tile({
    source: new ol.source.TileWMS({
      url: 'http://wms.geo.admin.ch/',
      crossOrigin: 'anonymous',
      attributions: [new ol.Attribution({
        html: '&copy; ' +
            '<a href="http://www.geo.admin.ch/internet/geoportal/' +
            'en/home.html">' +
            'Pixelmap 1:1000000 / geo.admin.ch</a>'
      })],
      params: {
        'LAYERS': 'ch.swisstopo.pixelkarte-farbe-pk1000.noscale',
        'FORMAT': 'image/jpeg'
      },
      extent: extent,
      serverType: 'mapserver'
    })
  }),
  new ol.layer.Tile({
    source: new ol.source.TileWMS({
      url: 'http://wms.geo.admin.ch/',
      crossOrigin: 'anonymous',
      attributions: [new ol.Attribution({
        html: '&copy; ' +
            '<a href="http://www.geo.admin.ch/internet/geoportal/' +
            'en/home.html">' +
            'National parks / geo.admin.ch</a>'
      })],
      params: {'LAYERS': 'ch.bafu.schutzgebiete-paerke_nationaler_bedeutung'},
      extent: extent,
      serverType: 'mapserver'
    })
  })
];

var map = new ol.Map({
  controls: ol.control.defaults().extend([
    new ol.control.ScaleLine({
      units: 'metric'
    })
  ]),
  layers: layers,
  renderer: exampleNS.getRendererFromQueryString(),
  target: 'map',
  view: new ol.View({
    projection: projection,
    center: [660000, 190000],
    extent: extent,
    zoom: 2
  })
});
