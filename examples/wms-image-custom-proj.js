goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control');
goog.require('ol.control.ScaleLine');
goog.require('ol.layer.Image');
goog.require('ol.proj');
goog.require('ol.proj.Projection');
goog.require('ol.source.ImageWMS');


// Transparent Proj4js support:
//
// EPSG:21781 is known to Proj4js because its definition was loaded in the html.
// Now when we create an ol.proj.Projection instance with the 'EPSG:21781' code,
// OpenLayers will pick up parameters like units and transform functions from
// Proj4js.
//
// Note that we are setting the projection's extent here, which is used to
// determine the view resolution for zoom level 0. Recommended values for a
// projection's validity extent can be found at http://epsg.io/.
//
// If you use Proj4js only to transform coordinates, you don't even need to
// create an ol.proj.Projection instance. ol.proj.get() will take care of it
// internally.

var projection = new ol.proj.Projection({
  code: 'EPSG:21781',
  extent: [485869.5728, 76443.1884, 837076.5648, 299941.7864]
});

var extent = [420000, 30000, 900000, 350000];
var layers = [
  new ol.layer.Image({
    extent: extent,
    source: new ol.source.ImageWMS({
      url: 'https://wms.geo.admin.ch/',
      crossOrigin: 'anonymous',
      attributions: '© <a href="http://www.geo.admin.ch/internet/geoportal/' +
          'en/home.html">Pixelmap 1:1000000 / geo.admin.ch</a>',
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
      url: 'https://wms.geo.admin.ch/',
      crossOrigin: 'anonymous',
      attributions: '© <a href="http://www.geo.admin.ch/internet/geoportal/' +
          'en/home.html">National parks / geo.admin.ch</a>',
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
  renderer: common.getRendererFromQueryString(),
  target: 'map',
  view: new ol.View({
    projection: projection,
    center: ol.proj.fromLonLat([8.23, 46.86], projection),
    extent: extent,
    zoom: 2
  })
});
