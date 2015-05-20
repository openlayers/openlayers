goog.require('ol.Attribution');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control');
goog.require('ol.control.ScaleLine');
goog.require('ol.layer.Image');
goog.require('ol.proj');
goog.require('ol.source.ImageWMS');


// Transparent Proj4js support: ol.proj.get() creates and returns a projection
// known to Proj4js if it is unknown to OpenLayers, and registers functions to
// transform between all registered projections.
// EPSG:21781 is known to Proj4js because its definition was loaded in the html.
// Note that we are getting the projection object here to set the extent. If
// you do not need this, you do not have to use ol.proj.get(); simply use the
// string code in the view projection below and the transforms will be
// registered transparently.
var projection = ol.proj.get('EPSG:21781');
// The extent is used to determine zoom level 0. Recommended values for a
// projection's validity extent can be found at http://epsg.io/.
projection.setExtent([485869.5728, 76443.1884, 837076.5648, 299941.7864]);

var extent = [420000, 30000, 900000, 350000];
var layers = [
  new ol.layer.Image({
    extent: extent,
    source: new ol.source.ImageWMS({
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
      serverType: /** @type {ol.source.wms.ServerType} */ ('mapserver')
    })
  }),
  new ol.layer.Image({
    extent: extent,
    source: new ol.source.ImageWMS({
      url: 'http://wms.geo.admin.ch/',
      crossOrigin: 'anonymous',
      attributions: [new ol.Attribution({
        html: '&copy; ' +
            '<a href="http://www.geo.admin.ch/internet/geoportal/' +
            'en/home.html">' +
            'National parks / geo.admin.ch</a>'
      })],
      params: {'LAYERS': 'ch.bafu.schutzgebiete-paerke_nationaler_bedeutung'},
      serverType: /** @type {ol.source.wms.ServerType} */ ('mapserver')
    })
  })
];

var map = new ol.Map({
  controls: ol.control.defaults().extend([
    new ol.control.ScaleLine()
  ]),
  layers: layers,
  renderer: exampleNS.getRendererFromQueryString(),
  target: 'map',
  view: new ol.View({
    projection: projection,
    center: ol.proj.transform([8.23, 46.86], 'EPSG:4326', 'EPSG:21781'),
    extent: extent,
    zoom: 2
  })
});
